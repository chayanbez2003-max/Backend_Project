import mongoose, { Schema } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const userSchema = new Schema({
    username: {
        type: String,  
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    email: {
        type: String,  
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    fullName: {
        type: String,  
        required: true,
        trim: true,
        lowercase: true,
        index: true
    },
    avatar: {
        type: String,//cloudinary url
        required:true
    },
    coverImage:{
        type: String,   //cloudinary url
    },
    watchHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Video"
    }],
    password: {
        type: String,  
        required: [true, 'Password is required'],
    },
    refreshToken:{
        type: String,  
    }

},
{timestamps: true});

userSchema.pre("save", async function(next){
    //if password is not modified, skip hashing, otherwise it will keep changing the password on every save.
    
    if(!this.modifier("password")) return(next());
    //hash the password

    this.password = await bcrypt.hash(this.password, 10);// here 10 refers to the salt rounds/How many times hashing is repeated (cost factor)
    next();
})

userSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
     return jwt.sign({
        _id : this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
);

}
userSchema.methods.generateRefreshToken = function(){
     return jwt.sign({
        _id : this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
);

}

export const User = mongoose.model('User', userSchema);