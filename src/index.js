import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config({
    path : './.env'
})
connectDB()
.then(()=>{
    app.on('error' , (error)=>{
        console.log(`app is not able to talk to database , error : ${error}`);
    })
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`Server started on port ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log(`mongo db connection failed ${err}`)
})







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