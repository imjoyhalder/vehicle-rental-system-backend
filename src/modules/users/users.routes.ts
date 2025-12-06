import { Router } from "express";
import { userControllers } from "./users.controller";


const router = Router()

router.post('/auth/signup', userControllers.createUser)

export const userRoutes = router; 