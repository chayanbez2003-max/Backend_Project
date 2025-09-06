import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";
import {ApiError} from "../utils/ApiError.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessTokenandRefreshToken=async (userId)=>{
    try {
        const user= await User.findById(userId)
        const accessToken =user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false});

        return{accessToken,refreshToken};

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating tokens")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    const{username, email, password, fullName} = req.body;
    // console.log("email:", email);

    if([fullName, username, email, password].some(field => 
        field?.trim() === "" )
    ){
        throw new ApiError(400, "All fields are required");
    }
    
    const existedUser =await  User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(400, "Username or email already exists");
    }

     console.log(req.files);
   
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    // const avatarLocalPath=req.files?.avatar[0]?.path;
    // const coverImageLocalPath=req.files?.coverImage?.[0]?.path;


    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){   
        coverImageLocalPath = req.files.coverImage[0].path;
    }


    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Failed to upload avatar");
    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username:  username.toLowerCase()
    });
    
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500," Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User created successfully")
    )
} )

const loginUser =  asyncHandler( async(req,res)=>{
    const{username, password,email} = req.body;

    if(!username && !email){
        throw new ApiError(400,"Username and email are required!");
    }

   const user= await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(404,"User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid User Credentials");
    }

    const {accessToken, refreshToken} =await generateAccessTokenandRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(
        200,
        {
            user:loggedInUser,accessToken,refreshToken
        },
    "User logged in successfully"
    ))
})


const logoutUser= asyncHandler(async(req,res)=>{
       await User.findByIdAndUpdate(
            req.user._id,
            {
                $set:{
                    refreshToken:undefined
                }
            },
            {
                new:true 
            }
        )

    
    const options = {
    httpOnly: true,
    secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out successfully"))
    })

const refreshAccessToken = asyncHandler(async (req, res)=>{
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken, 
            process.env.REFRESH_TOKEN_SECRET, 
        )
    
        const  user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if(user.refreshToken !== incomingRefreshToken){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        const {accessToken,newrefreshToken}=await generateAccessTokenandRefreshToken(user._id)
    
        const options= {
            httpOnly:true,
            secure:true
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("newrefreshToken", newrefreshToken, options)
        .json(
            new ApiResponse
            (
                200,
                {accessToken, newrefreshToken},
                "Access token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }

})
    



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken

}

