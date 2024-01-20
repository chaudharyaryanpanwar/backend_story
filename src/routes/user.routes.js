import { Router } from 'express';
import { registerUser } from '../controllers/user.controller.js';
import { upload } from './../middlewares/multer.middleware.js'
import { apiError } from './../utils/apiError.js'
const router = Router()

router.route('/register').post(
  upload.fields([
    {
      name : 'avatar' ,
      maxCount : 1
    } ,
    {
      name : 'cover-image' , 
      maxCount : 1 
    }
  ]),
  registerUser
  )
 //http://localhost:3000/users/register (/api/v1/users)
router.route('/login') //http://localhost:3000/users/login (/api/v1/users)

export default router 