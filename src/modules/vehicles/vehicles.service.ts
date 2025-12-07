import { pool } from "../../config/db";

const createVehicle = async (payload: Record<string, unknown>) => {
    const { vehicle_name, type, registration_number, daily_rent_price, availability_status } = payload;
    const result = await pool.query(`INSERT INTO vehicles (vehicle_name, type, registration_number, daily_rent_price, availability_status )
            VALUES($1, $2, $3, $4, $5) RETURNING *
        `, [vehicle_name, type, registration_number, daily_rent_price, availability_status])
    return result;
}

const getAllVehicle = async () => {
    const result = await pool.query(`SELECT * FROM vehicles`)
    return result.rows;
}

const getSingleVehicle = async (vehicleId: string) => {
    const vehicle = await pool.query(`SELECT * FROM vehicles WHERE id=$1`, [vehicleId])
    return vehicle;
}

const deleteSingleVehicle = async (vehicleId: string) => {

    const isExistsBooking = await pool.query(`SELECT * FROM bookings WHERE vehicle_id=$1 AND status=$2`, [vehicleId, 'active'])
    if (isExistsBooking.rows.length > 0) {
        return "This vehicle on booking so now you can't delete this vehicle"
    }

    const vehicle = await pool.query(`DELETE FROM vehicles WHERE id=$1`, [vehicleId]);
    return vehicle;
}

const updateVehicle = async (id: string, payload: Record<string, unknown>) => {

    const isExists = await pool.query(`SELECT * FROM bookings WHERE vehicle_id=$1 AND `)

    let query = "UPDATE vehicles SET ";
    const values: any[] = [];
    let index = 1;

    for (const key in payload) {
        if (index > 1) {
            query += ", ";
        }

        query += `${key} = $${index}`;
        values.push(payload[key]);
        index++;
    }

    query += ` WHERE id = $${index} RETURNING *`;
    values.push(id)

    const result = await pool.query(query, values);

    return result;

    
}

export const vehicleServices = {
    createVehicle,
    getAllVehicle,
    getSingleVehicle,
    deleteSingleVehicle,
    updateVehicle,
}