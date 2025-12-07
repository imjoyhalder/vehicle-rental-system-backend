import { JwtPayload, verify } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { Request } from "express";
import { pool } from "../../config/db";
import { vehicleServices } from "../vehicles/vehicles.service";
import config from '../../config';


const createBooking = async (payload: Record<string, unknown>) => {
    const { customer_id, vehicle_id, rent_start_date, rent_end_date } = payload;

    const vehicle = await vehicleServices.getSingleVehicle(vehicle_id as string);
    if (vehicle.rows.length === 0) {
        return { success: false, message: "Vehicle not found" };
    }

    const v = vehicle.rows[0];

    if (v.availability_status !== "available") {
        return { success: false, message: "Vehicle already booked" };
    }

    const now = new Date(); 
    const start = new Date(rent_start_date as string);
    const end = new Date(rent_end_date as string);

    if (start <= now || end <= now) {
        return { success: false, message: "Start and end date must be in the future" };
    }

    if (end <= start) {
        return { success: false, message: "End date must be after start date" };
    }

    const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (days < 1) {
        return { success: false, message: "Booking duration must be at least 1 day" };
    }

    const total_price = v.daily_rent_price * days;

    const booked = await pool.query(
        `INSERT INTO bookings 
        (customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, "active"]
    );

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

const getAllBooking = async (user: JwtPayload) => {

    if (user.role === "admin") {

        const bookings = await pool.query(`SELECT * FROM bookings`);

        const results = [];
        for (let b of bookings.rows) {
            const customer = await pool.query(
                `SELECT name, email FROM users WHERE id = $1`,
                [b.customer_id]
            );

            const vehicle = await pool.query(
                `SELECT vehicle_name, registration_number FROM vehicles WHERE id = $1`,
                [b.vehicle_id]
            );

            results.push({
                ...b,
                customer: customer.rows[0],
                vehicle: vehicle.rows[0],
            });
        }

        return {
            success: true,
            message: "Bookings retrieved successfully",
            role: "admin",
            data: results,
        };
    }

    // ---------- CUSTOMER ----------
    if (user.role === "customer") {

        const bookings = await pool.query(
            `SELECT * FROM bookings WHERE customer_id = $1 ORDER BY id DESC`,
            [user.id]
        );

        const results = [];
        for (let b of bookings.rows) {
            const vehicle = await pool.query(
                `SELECT vehicle_name, registration_number, type FROM vehicles WHERE id = $1`,
                [b.vehicle_id]
            );

            results.push({
                id: b.id,
                vehicle_id: b.vehicle_id,
                rent_start_date: b.rent_start_date,
                rent_end_date: b.rent_end_date,
                total_price: b.total_price,
                status: b.status,
                vehicle: vehicle.rows[0],
            });
        }

        return {
            success: true,
            message: "Your bookings retrieved successfully",
            role: "customer",
            data: results,
        };
    }

    // ---------- OTHER ----------
    return "UNAUTHORIZED";
};

const getSingleBooking = async (req: Request, bookingId: string) => {
    const user = req.user as JwtPayload;

    // fetch booking info
    const bookingResult = await pool.query(
        `SELECT * FROM bookings WHERE id = $1`,
        [bookingId]
    );

    if (bookingResult.rows.length === 0) {
        return {
            success: false,
            message: "Booking not found",
        };
    }

    const booking = bookingResult.rows[0];

    const customerId = booking.customer_id;
    const vehicleId = booking.vehicle_id;

    // ---------------------------
    // VEHICLE INFO (both roles)
    // ---------------------------
    const vehicleResult = await pool.query(
        `SELECT vehicle_name, registration_number, type 
        FROM vehicles WHERE id = $1`,
        [vehicleId]
    );

    const vehicle = vehicleResult.rows[0];

    // ---------------------------
    // ADMIN VIEW
    // ---------------------------
    if (user.role === "admin") {
        const customerResult = await pool.query(
            `SELECT id, name, email FROM users WHERE id = $1`,
            [customerId]
        );

        const customer = customerResult.rows[0];

        return {
            success: true,
            message: "Booking retrieved successfully",
            role: "admin",
            data: [
                {
                    ...booking,
                    customer: {
                        id: customer.id,
                        name: customer.name,
                        email: customer.email,
                    },
                    vehicle: {
                        vehicle_name: vehicle.vehicle_name,
                        registration_number: vehicle.registration_number,
                        type: vehicle.type,
                    },
                },
            ],
        };
    }

    // ---------------------------
    // CUSTOMER VIEW
    // ---------------------------
    return {
        success: true,
        message: "Your booking retrieved successfully",
        role: "customer",
        data: [
            {
                id: booking.id,
                vehicle_id: booking.vehicle_id,
                rent_start_date: booking.rent_start_date,
                rent_end_date: booking.rent_end_date,
                total_price: booking.total_price,
                status: booking.status,
                vehicle: {
                    vehicle_name: vehicle.vehicle_name,
                    registration_number: vehicle.registration_number,
                    type: vehicle.type,
                },
            },
        ],
    };
};

const updateBooking = async (bookingId: string, status: string, user: JwtPayload) => {
    if (!["cancelled", "returned"].includes(status)) {
        return { statusCode: 400, success: false, message: "Invalid status. Use 'cancelled' or 'returned'." };
    }

    // Convert bookingId to number (safe for Postgres)
    const bookingIdNum = Number(bookingId);

    // Fetch booking
    const bookingResult = await pool.query(
        `SELECT * FROM bookings WHERE id=$1`,
        [bookingIdNum]
    );

    if (!bookingResult.rows.length) {
        return { statusCode: 404, success: false, message: "Booking not found" };
    }

    const booking = bookingResult.rows[0];
    const now = new Date();
    const rentStart = new Date(booking.rent_start_date);
    const rentEnd = new Date(booking.rent_end_date);

    // -------- CUSTOMER --------
    if (user.role === "customer") {
        // Customer can only cancel
        if (status !== "cancelled") {
            return { statusCode: 403, success: false, message: "Customers can only cancel bookings" };
        }

        // Only before rent_start_date
        if (now >= rentStart) {
            return { statusCode: 400, success: false, message: "Booking cannot be cancelled after start date" };
        }

        const updated = await pool.query(
            `UPDATE bookings SET status='cancelled' WHERE id=$1 RETURNING *`,
            [bookingIdNum]
        );

        return { statusCode: 200, success: true, message: "Booking cancelled successfully", data: updated.rows[0] };
    }

    // -------- ADMIN --------
    if (user.role === "admin") {
        // Admin can only mark returned
        if (status !== "returned") {
            return { statusCode: 403, success: false, message: "Admin can only mark booking as returned" };
        }

        // Update booking status
        const updated = await pool.query(
            `UPDATE bookings SET status='returned' WHERE id=$1 RETURNING *`,
            [bookingIdNum]
        );

        // Update vehicle availability
        await pool.query(
            `UPDATE vehicles SET availability_status='available' WHERE id=$1`,
            [booking.vehicle_id]
        );

        return {
            statusCode: 200,
            success: true,
            message: "Booking marked as returned. Vehicle is now available",
            data: {
                ...updated.rows[0],
                vehicle: { availability_status: "available" }
            }
        };
    }

    // Unknown role
    return { statusCode: 403, success: false, message: "Access denied" };
};

export const bookingServices = {
    createBooking,
    getAllBooking,
    getSingleBooking,
    updateBooking,
};
