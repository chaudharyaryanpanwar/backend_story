import { Router } from 'express';
import { registerUser , loginUser, logoutUser, refreshAccessToken } from '../controllers/user.controller.js';
import { upload } from './../middlewares/multer.middleware.js'
import { ApiError } from './../utils/apiError.js'
import { verifyJWT } from '../middlewares/auth.middleware.js';
const router = Router()

router.route('/register').post(
  upload.fields([
    {
      name : 'avatar' ,
      maxCount : 1
    } ,
    {
      name : 'coverImage' , 
      maxCount : 1 
    }
  ]),
  registerUser
  )
 //http://localhost:3000/users/register (/api/v1/users)
// router.route('/login') //http://localhost:3000/users/login (/api/v1/users)


router.route('/login').post(loginUser)
router.route('/logout').post(verifyJWT , logoutUser)
router.route('/refresh-token').post(refreshAccessToken)

export default router 