import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path : './env'
})
connectDB();







/*
import express from "express"
const app = express()
//always udse try /catch for connecting to database
(async ()=> {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on('error' , (error)=> {
            console.log('applicationn is not able to talk to the database')
            throw error
        })

        app.listen(process.env.PORT , ()=>{
            console.log(`app is listening on ${process.env.PORT}`);
        })
    }catch(error){
        console.log(`Error : ${error}`);
        throw err;
    }
})()
*/