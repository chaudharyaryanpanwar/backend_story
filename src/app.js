import mongoose from "mongoose"
import 'dotenv/config'



const connectDB = async() =>{
  try{
      const connectionInstance = await mongoose.connect(`${process.env.DATABASE_URI}/${'videotube'}`);
      console.log(connectionInstance);
  }catch(error){
      console.log(`error encounterd  : ${error}`)
    }
}
connectDB();