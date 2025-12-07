import { Router } from "express";
import { bookingControllers } from "./booking.controller";
import authorize from "../../middleware/auth";


const router = Router()

router.post('/',authorize('admin', 'customer'),bookingControllers.createBooking)
router.get('/', authorize('admin', 'customer'),bookingControllers.getAllBooking)
router.put('/:bookingId', authorize('admin', 'customer'), bookingControllers.updateBooking)


export const bookingRoutes = router; 