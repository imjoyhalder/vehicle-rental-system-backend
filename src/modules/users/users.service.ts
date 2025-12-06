import { pool } from './../../config/db';

import bcrypt from "bcryptjs"

const createUser = async (payload: Record<string, unknown>) => {
    const { name, email, password, phone, role } = payload;

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
    else{
        return "Password size minimum 6 character"
    }
}

const getAllUser = async () => {
    const result = await pool.query(`SELECT * FROM users`)
    return result
}

const getSingleUser = async (id: string | undefined) => {
    const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [id])
    return result;
}

const updateUser = async (name: string, email: string, id: string | undefined) => {
    const result = await pool.query(`UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING *`, [name, email, id])
    return result;
}

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

