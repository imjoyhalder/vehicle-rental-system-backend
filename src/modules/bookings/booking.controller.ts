import { Request, Response } from "express";
import { bookingServices } from "./booking.service";


const createBooking = async (req: Request, res: Response) => {
    try {
        const result = await bookingServices.createBooking(req.body);
        return res.status(result.success ? 201 : 400).json(result);
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
            details: error
        });
    }
};

const getAllBooking = async (req: Request, res: Response) => {
    try {
        const result = await bookingServices.getAllBooking();
        res.status(200).json({
            success: true,
            message: "Bookings retrieved successfully",
            data: result.rows
        })
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
            details: error
        });
    }
}

const getSingleBooking = async (req: Request, res: Response) => {
    try {
        const result = await bookingServices.getSingleBooking(req, req.params.id!)
        res.status(200).json(result)
    } catch (error: any) {

    }
}

export const bookingControllers = {
    createBooking,
    getAllBooking, 
    getSingleBooking
}