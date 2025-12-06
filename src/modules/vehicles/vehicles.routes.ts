import { Router } from "express";
import { vehicleControllers } from "./vehicles.controller";
import authorize from "../../middleware/auth";


const router = Router()

router.post('/', authorize('admin'), vehicleControllers.createVehicle)

export const vehicleRoutes = router; 