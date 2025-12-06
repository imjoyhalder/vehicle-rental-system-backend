import { Router } from "express";
import { bookingControllers } from "./booking.controller";
import authorize from "../../middleware/auth";


const router = Router()

router.post('/', bookingControllers.createBooking)
router.get('/', authorize('admin'),bookingControllers.getAllBooking)

export const bookingRoutes = router; 