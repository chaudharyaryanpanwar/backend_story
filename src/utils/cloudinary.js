import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs' ;

       
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME , 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async(localFilePath) => {
  try {
    if (!localFilePath) return null 
    // upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath , {
      resource_type : 'auto'
    })
    // file has been uploaded successfully
    // console.log('File is uploaded on cloudinary' , response.url);
    // console.log(`this is loggin response , ${response}`)
    fs.unlinkSync(localFilePath)
    return response 

  }catch(error){
    fs.unlinkSync(localFilePath)//remove the localy saved file as the upload failed
    return null ; 
  }
}

export { uploadOnCloudinary }
