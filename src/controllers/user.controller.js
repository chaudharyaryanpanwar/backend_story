import { asyncHandler } from './../utils/asyncHandler.js';
import { ApiError } from './../utils/apiError.js'
import { User } from './../models/user.model.js'
import { uploadOnCloudinary } from './../utils/cloudinary.js'
import { ApiResponse } from '../utils/apiResponse.js';
const registerUser = asyncHandler( async(req , res)=>{
  /* what are the steps for registering user : 
  step1 : get user details from frontend
  step2 : validation - not empty
  step3 : check if user already exists  : username , email
  step4 : check for images , check for avatar
  step5 : upload them to cloudinary , avatar
  step6 : create user object - create entry in db
  step7 : remove password and refresh token field from response
  step8 : check for user creation 
  step9 : return response
  */  
 const { fullName , email ,username ,  password } = req.body
 console.log('email: ' , email );

//  simple code can also be used using if - else
 if ([fullName , email , username , password ].some(
    (field)=>{field?.trim()===""}
    )
  ){
    throw new ApiError(400 , "full name is required")
 } 
 const existedUser = User.findOne({
  $or : [{ username } , { email }]
 })
 if (existedUser){
  throw new ApiError(409 , 'user with this username or email already exists');
 }
 const avatarLocalPath = req.files?.avatar[0]?.path
 const coverImageLocalPath = req.files?.coverimage[0]?.path
 console.log(`logging req.files ${req.files}`)

 if (!avatarLocalPath){
  throw new ApiError(400 , 'avatar files is required')
 }

 const avatar = await uploadOnCloudinary(avatarLocalPath)
 const coverImage = await uploadOnCloudinary(coverImageLocalPath)

 if (!avatar){
  throw new ApiError(400 , 'avatar files is required')
 }

 const user = await User.create({
  fullName ,//fullName : fullName
  avatar : avatar.url , 
  coverImage : coverImage?.url || "" , 
  email , 
  password , 
  username : username.toLowerCase()
 })

 const createdUser = await User.findById(user._id).select(
  "-password -refreshtoken"
 )

 if (!createdUser){
  throw new ApiError(500 , 'Something went wrong while registering the user')
 }

 return res.status(201).json(
  new ApiResponse(200 , createdUser , 'user registered successfully')
 )
 
})

export { registerUser }