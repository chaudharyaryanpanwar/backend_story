import { asyncHandler } from './../utils/asyncHandler.js';
import { ApiError } from './../utils/apiError.js'
import { User } from './../models/user.model.js'
import { uploadOnCloudinary } from './../utils/cloudinary.js'
import { ApiResponse } from '../utils/apiResponse.js';
import { upload } from './../middlewares/multer.middleware.js'

const generateAccessAndRefreshTokens = async(userId)=>{
  try {
    const user = await User.findById(userId) ;
    const accessToken = user.generateAccessToken() 
    const refreshToken = user.generateRefreshToken()
    
    user.refreshToken = refreshToken 
    await user.save({validateBeforeSave : false})

    return { accessToken , refreshToken }

  } catch(err){
    throw new ApiError(500 , 'Something went wring while generating refresh and access token')
  }
}

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
  console.log('fullName: ' , fullName )
  console.log('username: ' , username)
  console.log('password: ' , password)

//  simple code can also be used using if - else
 if ([fullName , email , username , password ].some(
    (field)=>{field.trim() ===""}
    )
  ){
    throw new ApiError(400 , "full name is required")
 } 
 const existedUser = await User.findOne({
  $or : [{ username } , { email }]
 })
 if (existedUser){
  throw new ApiError(409 , 'user with this username or email already exists');
 }
 if (!req.files || !req.files.avatar ) {
  throw new ApiError(400, 'Avatar and coverImage files are required');
}
 const avatarLocalPath = req.files?.avatar[0]?.path
//  const coverImageLocalPath = req.files?.coverImage[0]?.path
 
 let coverImageLocalPath= "";
 if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
  coverImageLocalPath = req.files.coverImage[0].path
 }


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

const loginUser = asyncHandler(async(req ,res )=>{
  // step1 :  req body -> data
  // step2 : username or email 
  // step3 : find the user
  // step4 : password check 
  // step5 : access and refresh token 
  // step6 : send cookie and login success reponse
  const { username , email , password } = req.body ;
  if (!username || !email){
    throw new ApiError(400 , 'username or email or password is required');
  }
  const user = await User.findOne({
    $or : [{ username } , { email }]
  })
  if (!user){
    throw new ApiError(404 , 'User does not exist')
  }
  const isPasswordValid = await user.isPasswordCorrect(password)
  if (!isPasswordValid){
    throw new ApiError(401 , "Invalid user creadentials")
  }

  const { accessToken , refreshToken } = await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly : true , //this means that frontend cannot modify these queries , only backend can
    secure : true , 
  }

  return res.status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json( 
      new ApiResponse(200 , {
        user: loggedInUser , accessToken , refreshToken
      } ,
      "user logged in successfully"
       )
    )

})

const logoutUser = asyncHandler(async(req, res)=>{
  const user = await User.findByIdAndUpdate(req.user?._id ,
     {
      $set:{
        refreshToken : undefined
        } ,
      },
      { new : true }
  )
  const options = {
    httpOnly : true , 
    secure : true 
  }
  return res.status(200)
    .clearCookie('accessToken' , options)
    .clearCookie('refreshToken' ,options)
    .json(new ApiResponse(200 , {} , 'User Logged Out'))
})

export { registerUser  , loginUser , logoutUser }

