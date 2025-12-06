import { pool } from "../../config/db";
import { vehicleServices } from "../vehicles/vehicles.service";

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

const getAllBooking = async()=>{
    const result = pool.query(`SELECT * FROM bookings`)
    return result; 
}

const getSingleBooking = async(bookingId: string)=>{
    const result = await pool.query(`SELECT * FROM bookings WHERE id=$1`, [bookingId])
    return result.rows; 
}

export const bookingServices = {
    createBooking,
    getAllBooking, 
    getSingleBooking, 
};
