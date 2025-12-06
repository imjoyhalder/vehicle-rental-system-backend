import { Request, Response } from "express";
import { userServices } from "./users.service";


const createUser = async (req: Request, res: Response) => {
    try {
        const result = await userServices.createUser(req.body)
        if (typeof result === 'string') {
            res.status(500).json({
                success: false,
                message: result,
            })
        }
        else {
            res.status(201).json({
                success: true,
                message: "User registered successfully",
                data: result.rows[0]
            })
        }

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const getAllUser = async (req: Request, res: Response) => {
    try {

        const result = await userServices.getAllUser()
        res.status(200).json({
            success: true,
            message: "Users retrieved successfully ",
            data: result.rows
        })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
            details: error
        })
    }
}

const getSingleUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await userServices.getSingleUser(id!)

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }
        else {
            res.status(200).json({
                success: true,
                message: 'User fetched successfully',
                data: result.rows[0]
            })
        }
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await userServices.updateUser(id!, req.body)

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }
        else {
            res.status(200).json({
                success: true,
                message: 'User updated successfully',
                data: result.rows[0]
            })
        }
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await userServices.deleteUser(id!)
        if (result.rowCount === 0) {
            res.status(404).json({
                success: false,
                message: 'user not found'
            })
        }
        else {
            res.status(200).json({
                success: true,
                message: 'user deleted successfully',
                data: result.rows
            })
        }
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const userControllers = {
    createUser,
    getAllUser,
    getSingleUser,
    updateUser,
    deleteUser,
}