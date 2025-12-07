import { Request, Response } from "express";
import { bookingServices } from "./booking.service";
import { JwtPayload } from "jsonwebtoken";


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
        if (!req.user) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized request"
            })
        }
        const result = await bookingServices.getAllBooking(req.user);
        res.status(200).json(result)
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

const getSingleBooking = async (req: Request, res: Response) => {
    try {
        const result = await bookingServices.getSingleBooking(req, req.params.bookingId!)
        res.status(200).json(result)
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// const updateBooking = async (req: Request, res: Response) => {
//     try {
//         const user: JwtPayload = req.user as JwtPayload;

//         const bookingIdNum = Number(req.params.bookingId);
//         if (isNaN(bookingIdNum)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid booking ID"
//             });
//         }

//         const result = await bookingServices.updateBooking(
//             bookingIdNum.toString(),
//             req.body.status,
//             user
//         );

//         return res.status(result.statusCode || 200).json({
//             success: result.success,
//             message: result.message,
//             data: result.data || null
//         });

//     } catch (error: any) {
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

const updateBooking = async (req: Request, res: Response) => {
    try {
        const user = req.user as JwtPayload;

        const result = await bookingServices.updateBooking(
            req.params.bookingId as string,
            req.body.status,
            user
        );

        return res.status(result.statusCode || 200).json({
            success: result.success,
            message: result.message,
            data: result.data || null
        });

    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const bookingControllers = {
    createBooking,
    getAllBooking,
    getSingleBooking, 
    updateBooking, 
}