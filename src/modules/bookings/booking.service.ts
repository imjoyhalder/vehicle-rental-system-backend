import { JwtPayload, verify } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { Request } from "express";
import { pool } from "../../config/db";




const createBooking = async (payload: Record<string, unknown>) => {
    const { customer_id, vehicle_id, rent_start_date, rent_end_date } = payload;

    const vehicle = await pool.query(`SELECT * FROM vehicles WHERE id=$1`, [vehicle_id])
    console.log(vehicle)
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
    const now = new Date();

    if (user.role === "admin") {
        await pool.query(
            `UPDATE bookings
            SET status='returned'
            WHERE status='active' AND rent_end_date <= $1`,
            [now]
        );

        const expiredBookings = await pool.query(
            `SELECT vehicle_id FROM bookings WHERE status='returned' AND rent_end_date <= $1`,
            [now]
        );

        // vehicle update 
        for (let b of expiredBookings.rows) {
            await pool.query(
                `UPDATE vehicles SET availability_status='available' WHERE id=$1`,
                [b.vehicle_id]
            );
        }

        const bookings = await pool.query(`SELECT * FROM bookings`);

        const results = [];
        for (let b of bookings.rows) {
            const customer = await pool.query(
                `SELECT name, email FROM users WHERE id = $1`,
                [b.customer_id]
            );

            const vehicle = await pool.query(
                `SELECT vehicle_name, registration_number, availability_status FROM vehicles WHERE id = $1`,
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
            data: results,
        };
    }

    if (user.role === "customer") {
        await pool.query(
            `UPDATE bookings
            SET status='returned'
            WHERE status='active' AND customer_id=$1 AND rent_end_date <= $2`,
            [user.id, now]
        );

        const expiredBookings = await pool.query(
            `SELECT vehicle_id FROM bookings WHERE status='returned' AND customer_id=$1 AND rent_end_date <= $2`,
            [user.id, now]
        );

        for (let b of expiredBookings.rows) {
            await pool.query(
                `UPDATE vehicles SET availability_status='available' WHERE id=$1`,
                [b.vehicle_id]
            );
        }

        const bookings = await pool.query(
            `SELECT * FROM bookings WHERE customer_id = $1 ORDER BY id DESC`,
            [user.id]
        );

        const results = [];
        for (let b of bookings.rows) {
            const vehicle = await pool.query(
                `SELECT vehicle_name, registration_number, type, availability_status FROM vehicles WHERE id = $1`,
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

    return { success: false, message: "UNAUTHORIZED" };
};

const updateBooking = async (bookingId: string, status: string, user: JwtPayload) => {
    if (!["cancelled", "returned"].includes(status)) {
        return {
            statusCode: 400,
            success: false,
            message: "Invalid status. Use 'cancelled' or 'returned'."
        };
    }

    const bookingIdNum = Number(bookingId);


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
            return {
                statusCode: 403,
                success: false,
                message: "Customers can only cancel bookings"
            };
        }

        // Only before rent_start_date
        if (now >= rentStart) {
            return {
                statusCode: 400,
                success: false,
                message: "Booking cannot be cancelled after start date"
            };
        }

        const updated = await pool.query(
            `UPDATE bookings SET status='cancelled' WHERE id=$1 RETURNING *`,
            [bookingIdNum]
        );

        return {
            statusCode: 200,
            success: true,
            message: "Booking cancelled successfully",
            data: updated.rows[0]
        };
    }

    // -------- ADMIN --------
    if (user.role === "admin") {
        if (status !== "returned") {
            return {
                statusCode: 403,
                success: false,
                message: "Admin can only mark booking as returned"
            };
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
    return {
        statusCode: 403,
        success: false,
        message: "Access denied"
    };
};

export const bookingServices = {
    createBooking,
    getAllBooking,

    updateBooking,
};
