import { pool } from "../../config/db";

const createVehicle = async (payload: Record<string, unknown>) => {
    const { vehicle_name, type, registration_number, daily_rent_price, availability_status } = payload;
    const result = await pool.query(`INSERT INTO vehicles (vehicle_name, type, registration_number, daily_rent_price, availability_status )
            VALUES($1, $2, $3, $4, $5) RETURNING *
        `, [vehicle_name, type, registration_number, daily_rent_price, availability_status])
    return result; 
}


const getAllVehicle = async ()=>{
    const result = await pool.query(`SELECT * FROM vehicles`)
    return result.rows; 
}

const getSingleVehicle = async(vehicleId: string)=>{
    const vehicle = await pool.query(`SELECT * FROM vehicles WHERE id=$1`, [vehicleId])
    return vehicle; 
}

const deleteSingleVehicle = async(vehicleId: string)=>{
    const vehicle = await pool.query(`DELETE FROM vehicles WHERE id=$1`, [vehicleId]); 
    return vehicle; 
}

const updateVehicle = async(payload: Record<string, unknown>)=>{
    const updatedVehicle = await pool.query(`UPDATE vehicles SET `)
}

export const vehicleServices ={
    createVehicle, 
    getAllVehicle, 
    getSingleVehicle,
    deleteSingleVehicle,
    updateVehicle,
}