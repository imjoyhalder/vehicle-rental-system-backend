import { Router } from "express";
import { vehicleControllers } from "./vehicles.controller";
import authorize from "../../middleware/auth";
import { verify } from "jsonwebtoken";


const router = Router()

router.post('/', authorize('admin'), vehicleControllers.createVehicle)

router.get('/', vehicleControllers.getAllVehicle)

router.get('/:id', vehicleControllers.getSingleVehicle)

router.put('/:id', authorize('admin'), vehicleControllers.updateVehicle)

router.delete('/:id', authorize('admin'), vehicleControllers.deleteSingleVehicle)



// router.delete('/:vehicleId', )

export const vehicleRoutes = router; 