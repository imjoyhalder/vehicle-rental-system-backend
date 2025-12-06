import { pool } from './../../config/db';

import bcrypt from "bcryptjs"

const createUser = async (payload: Record<string, unknown>)=>{
    const {name,email,password ,phone ,role } = payload;
    
    const hashedPass = await bcrypt.hash(password as string, 10); 

    const result = await pool.query(`INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING *`, 
        [name, email, hashedPass, phone, role]
    )
    console.log(result.rows);
    delete result.rows[0].password; 

    return result; 
}

export const userServices = {
    createUser
}