import { Request, Response } from "express";
import { vehicleServices } from "./vehicles.service";


const createVehicle = async (req: Request, res: Response) => {
    try {
        const result = await vehicleServices.createVehicle(req.body)
        res.status(201).json({
            success: true,
            message: "Vehicle created successfully",
            data: result.rows[0]
        })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
}

const getAllVehicle = async (req: Request, res: Response) => {
    try {
        const result = await vehicleServices.getAllVehicle()
        res.status(200).json({
            "success": true,
            "message": "Vehicles retrieved successfully",
            data: result
        })

    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
}

const getSingleVehicle = async (req: Request, res: Response) => {
    try {
        const vehicle = await vehicleServices.getSingleVehicle(req.params.id!);
        if (vehicle.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            })
        }
        else {
            res.status(200).json({
                success: true,
                message: "Vehicle retrieved successfully",
                data: vehicle.rows[0]
            })
        }
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
}

const deleteSingleVehicle = async (req: Request, res: Response) => {
    try {
        const result = await vehicleServices.deleteSingleVehicle(req.params.id!);
        if (result.rowCount === 0) {
            res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            })
        }
        else {
            res.status(200).json({
                success: true,
                message: 'Vehicle deleted successfully',
            })
        }

    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
}


export const vehicleControllers = {
    createVehicle,
    getAllVehicle,
    getSingleVehicle,
    deleteSingleVehicle,
}