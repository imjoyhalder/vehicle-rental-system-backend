import { Router } from "express";
import { userControllers } from "./users.controller";
import authorize from "../../middleware/auth";


const router = Router()

//*--------user register route------------------
router.post('/auth/signup', userControllers.createUser)


//*--------get update and delete routes-----------------
router.get('/users', authorize('admin'), userControllers.getAllUser); 

router.put('/users/:id', authorize('admin', 'customer') ,userControllers.updateUser)

router.delete('/users/:id', authorize('admin'), userControllers.deleteUser)


export const userRoutes = router; 