import dotenv from "dotenv";
import connectToDatabase from "./db/index.js";

dotenv.config({
    path: "./.env"
}
);

connectToDatabase()




// (async()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) 
//     }
//     catch(err){
//         console.error("Error connecting to MongoDB:", err);
//         throw err;
//     }
// })()