import mongoose, { connect } from "mongoose"
import { DB_NAME } from "../constants.js"


const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect
                    (`${ process.env.MONGODB_URI }/${ DB_NAME }`);
        console.log(`MOngo db connected !! Db HOST  :${connectionInstance.connection.host}`)
    }catch (error){
        console.log(`MONGO Db connection error`);
        process.exit(1)//is used in node for exiting 
    }
}
export default connectDB ;