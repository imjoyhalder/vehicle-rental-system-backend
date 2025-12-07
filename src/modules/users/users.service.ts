import { pool } from './../../config/db';

import bcrypt from "bcryptjs"

const createUser = async (payload: Record<string, unknown>) => {
    const { name, email, password, phone, role } = payload;

    if (!name || !email || !password || !phone || !role) {
        return "All fields are required";
    }

    const existEmail = await pool.query('SELECT * FROM users WHERE email=$1', [email])
    if (existEmail.rows.length > 0) {
        return 'Email already exists'
    }

    const pass = password as string
    if (pass.length >= 6) {

        const hashedPass = await bcrypt.hash(password as string, 10);
        const result = await pool.query(`INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name, email, hashedPass, phone, role]
        )
        // console.log(result.rows);
        delete result.rows[0].password;

        return result;
    }
    else {
        return "Password size minimum 6 character"
    }
}

const getAllUser = async () => {
    const result = await pool.query(`SELECT * FROM users`)
    result.rows.map(user => delete user.password)
    return result
}

const getSingleUser = async (id: string | undefined) => {
    const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [id])
    result.rows.length > 0 ? delete result.rows[0].password : result
    return result;
}

const updateUser = async (id: string, payload: Record<string, unknown>) => {

    let query = "UPDATE users SET ";
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
    values.push(id);

    const result = await pool.query(query, values);

    if (result.rowCount! > 0) {
        delete result.rows[0].password;
    }

    return result;
};


const deleteUser = async (id: string | undefined) => {
    const result = await pool.query(`DELETE FROM users WHERE id=$1 RETURNING *`, [id])
    return result
}

export const userServices = {
    createUser,
    getAllUser,
    getSingleUser,
    updateUser,
    deleteUser
}

