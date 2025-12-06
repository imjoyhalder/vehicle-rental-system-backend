import { JwtPayload, verify } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { Request } from "express";
import { pool } from "../../config/db";
import { vehicleServices } from "../vehicles/vehicles.service";
import config from '../../config';


const createBooking = async (payload: Record<string, unknown>) => {
    const { customer_id, vehicle_id, rent_start_date, rent_end_date } = payload;

    const start = new Date(rent_start_date as string);
    const end = new Date(rent_end_date as string);

    if (end <= start) {
        return { success: false, message: "End date must be after start date" };
    }

    const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    const vehicle = await vehicleServices.getSingleVehicle(vehicle_id as string);
    if (vehicle.rows.length === 0) {
        return { success: false, message: "Vehicle not found" };
    }

    const v = vehicle.rows[0];

    if (v.availability_status !== "available") {
        return { success: false, message: "Vehicle already booked" };
    }

    const total_price = v.daily_rent_price * days;

    const booked = await pool.query(
        `INSERT INTO bookings 
        (customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, "active"]
    );

    // update vehicle status
    await pool.query(
        `UPDATE vehicles SET availability_status=$1 WHERE id=$2`,
        ["booked", vehicle_id]
    );

    return {
        success: true,
        message: "Booking created successfully",
        data: {
            ...booked.rows[0],
            vehicle: {
                vehicle_name: v.vehicle_name,
                daily_rent_price: v.daily_rent_price
            }
        }
    };
};

const getAllBooking = async () => {
    const result = pool.query(`SELECT * FROM bookings`)
    return result;
}

const getSingleBooking = async (req: Request, bookingId: string) => {


    const token = req.headers.authorization;

    if(!token){
        return {success: false, message: 'Token not provided'}
    }

    const decoded = jwt.verify(token!, config.jwtSecret!) as JwtPayload
    console.log(decoded);

    const booking = await pool.query(`SELECT * FROM bookings WHERE id=$1`, [bookingId])

    const customerId = booking.rows[0].customer_id
    const vehicleId = booking.rows[0].vehicle_id

    const customer = await pool.query(`SELECT name,email FROM users WHERE id=$1 `, [customerId])

    const vehicle = await pool.query(`SELECT vehicle_name,registration_number FROM vehicles WHERE id=$1 `, [vehicleId])

    if (decoded.role === 'admin') {
        const adminResponse = {
            success: true,
            message: "Bookings retrieved successfully",
            data: [{
                ...booking.rows[0],
                'customer': {
                    "name": `${customer.rows[0].name}`,
                    "email": `${customer.rows[0].email}`
                },
                "vehicle": {
                    "vehicle_name": `${vehicle.rows[0].vehicle_name}`,
                    "registration_number": `${vehicle.rows[0].registration_number}`
                }
            }
            ]
        }
        return adminResponse;
    }
    else {
        const customerResponse = {
            "success": true,
            "message": "Your bookings retrieved successfully",
            data: [{
                ...booking.rows[0],
                "vehicle": {
                    vehicle_name: `${vehicle.rows[0].vehicle_name}`,
                    registration_number: `${vehicle.rows[0].registration_number}`,
                    type: `${vehicle.rows[0].type}`
                }
            }
            ]
        }
        return customerResponse
    }

}

export const bookingServices = {
    createBooking,
    getAllBooking,
    getSingleBooking,
};
