import { Router } from 'express';
import { registerUser } from '../controllers/user.controller.js';

const router = Router()

router.route('/register').post(registerUser) //http://localhost:3000/users/register (/api/v1/users)
router.route('/login') //http://localhost:3000/users/login (/api/v1/users)

export default router 