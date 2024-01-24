import { asyncHandler } from './../utils/asyncHandler.js';
import { ApiError } from './../utils/apiError.js'
import { User } from './../models/user.model.js'
import { uploadOnCloudinary } from './../utils/cloudinary.js'
import { ApiResponse } from '../utils/apiResponse.js';
import jwt, { decode } from "jsonwebtoken"
import mongoose from 'mongoose';

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
  if (!username && !email){
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
  const user = await User.findById(req.user._id).select("-password")
  user.refreshToken = undefined
  user.save({validateBeforeSave : false});
  const options = {
    httpOnly : true , 
    secure : true 
  }
  return res.status(200)
    .clearCookie('accessToken' , options)
    .clearCookie('refreshToken' ,options)
    .json(new ApiResponse(200 , {} , 'User Logged Out'))
})

 const refreshAccessToken = asyncHandler(async(req ,res )=>{
  try {
      const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
      if (!incomingRefreshToken){
        throw new ApiError(401 , "Unauthorized Request")
      }
    
      const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
    
      const user = await User.findById(decodedToken?._id)
    
      if (!user){
        throw new ApiError(401 , 'Invalid refresh token');
      }
    
      if (incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401 , "Refresh token is expired or used");
      }
    
      const options = {
        httpOnly : true , 
        secure : true
      }
    
      const { accessToken , newRefreshToken } = await generateAccessAndRefreshTokens(user._id);
    
      return res.status(200)
        .cookie("accessToken" , accessToken)
        .cookie("refreshToken" , newRefreshToken)
        .json(new ApiResponse(200 , {
          accessToken,
          refreshToken : newRefreshToken 
        },
        "Access Token refreshed")
        )
  } catch (error) {
    throw new ApiError(401 , error?.message || "Invalid Refresh Token");
  }
})

const changeCurrentPassword = asyncHandler(async(req , res)=>{
  const { oldPassword , newPassword } = req.body;
  const user = await User.findById(req.user._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if (!isPasswordCorrect){
    throw new ApiError(400 , 'Invalid password')
  }
  user.password = newPassword ;
  await user.save({validateBeforeSave : false})
  
  return res.status(200)
    .json(new ApiResponse(200 , {} , "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req ,res)=>{
  return res.status(200).json(200 , req.user , "current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req  ,res)=>{
  const { fullName  , email } = req.body
  if (!fullName || !email){
    throw new ApiError(400 , 'All fields are required')
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id , 
    {
      $set : {
        fullName : fullName ,
        email : email
      }
    },
    {new : true}
    ).select("-password")

    return res
      .status(200)
      .json(new ApiResponse(200 , user , "account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req ,res)=>{
  const avatarLocalPath  = req.file?.path

  if (!avatarLocalPath){
    throw new ApiError(400 , 'Avatar file is not found')
  }

  const avatar= await uploadOnCloudinary(avatarLocalPath)

  if (!avatar.url){
    throw new ApiError(400,'Error while uploading avatar on cloud' )
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id , 
    {
      $set : {
        avatar : avatar.url
      }
    },
    { new : true }
  ).select('-password')
  return res.status(202)
    .json(new ApiResponse(202 , user , "Avatar is updated successfully"))
})

// make a custom util so that when user Cover Image is changed , then the old image is deleted from the cloudinary
const updateUserCovereImage = asyncHandler(async(req , res)=>{
  const coverImageLocalPath = req.file?.path ;
  if(!coverImageLocalPath){
    return new ApiError(400 , "Cover image file is missing")
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage){
    return new ApiError(400 , "Error while uploading CoverImage on cloudinary ")
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage : coverImage.url
      }
    },
    { new : true}
  ).select("-password")
  return res
    .status(200)
    .json(new ApiResponse(202 , user ,"CoverImage is updated successfully"))
})

const getUserChannelProfile = asyncHandler(async(req, res ,next)=>{
  const { username } = req.params ;
  if (!username?.trim()){
    throw new ApiError(400 , 'Username is missing');
  }
  const channel = await User.aggregate([
    {//first pipeline
      $match : {
        username : username?.toLowerCase()
      }
    } , 
    {//second pipeline
      $lookup : {
        from : "Subscription",
        localField : "_id" ,
        foreignField : "channel" ,
        as : "subscribers"
      }
    } , 
    {
      //third pipeline
      $lookup : {
        from : "Subscriptions" ,
        localField : "_id" ,
        foreignField : "subscriber" ,
        as : "subscribedTo"
      }
    } , 
    { //fourth pipeline
      $addFields : {
        subscribersCount : {
          $size : "$subscribers"
        } , 
        channelsSubscribedToCount : {
          $size: "$subscribedTo"
        } , 
        isSubscribed : {
          $cond : {
            if : {$in : [req.user?._id , "$subscribers.subscriber" ]} ,
            then : true , 
            else : false 
          }
        }
      }
    } ,
    {
      //fifth pipeline
      $project : {
        fullName : 1 , 
        username : 1 , 
        subscribersCount : 1 , 
        channelsSubscribedToCount : 1 , 
        isSubscribed : 1 , 
        avatar : 1 , 
        coverImage : 1 , 
        email : 1
      }
    }
])
  console.log(channel);
  if (!channel?.length){
    throw  new ApiError(404 , 'Channel Not Found')
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200 , channel[0] , 'User channel fetched successfully')
      )
})

const getWatchHistory = asyncHandler(async(req , res )=>{
  const user = await User.aggregate([
    {
      $match : {
        _id : new mongoose.Types.ObjectId(req.user._id)
      }
    } , 
    {
      $lookup : {
        from : "videos",
        localField : "watchHistory",
        foreignField : "_id",
        as : "watchHistory" ,
        pipeline : [
          {
            $lookup : {
              from : "users" ,
              localField : "owner" ,
              foreignField : "_id" ,
              as : "owner" , 
              pipeline : [
                {
                  $project : {
                    fullName : 1 , 
                    username : 1 , 
                    avatar : 1
                  }
                }
              ]
            } 
          },
          {
            $addFields : {
                owner : {
                  $arrayElemAt: ["$owner" , 0]
                }
              }
          }
        ]
      }
    }
  ])
  
  return res
    .status(200)
    .json(
      new ApiResponse( 200 , user[0].watchHistory , "watch history fetched successfully")
    )
})

export { registerUser  , 
  loginUser ,
  logoutUser ,
  refreshAccessToken ,
  changeCurrentPassword ,
  getCurrentUser ,
  updateUserAvatar ,
  updateUserCovereImage ,
  getUserChannelProfile ,
  getWatchHistory
 }

