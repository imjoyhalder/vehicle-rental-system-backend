import jwt, { JwtPayload } from 'jsonwebtoken';
import { NextFunction, Request, Response } from "express"
import config from '../config';
import { pool } from '../config/db';

// const authorize = (...allowedRoles: string[]) => {
//     return (req: Request, res: Response, next: NextFunction) => {
//         try {
//             let token = req.headers.authorization;

//             if (!token) {
//                 return res.status(401).json({
//                     success: false,
//                     message: "No token provided"
//                 })
//             }

//             // check if it's bearer token 
//             if (token.startsWith('Bearer ')) {
//                 token = token.split(" ")[1];
//             }

//             //verify token 
//             const decoded = jwt.verify(token!, config.jwtSecret as string) as JwtPayload
//             req.user = decoded;

//             // Role based access 
//             if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
//                 return res.status(403).json({
//                     success: false,
//                     message: "Unauthorized request!!"
//                 })
//             }

//             if (decoded.role === 'admin') {
//                 return next()
//             }

//             const paramId = req.params.id;
//             const paramAsNumber = Number(paramId);

//             // Customer must ONLY access own ID
//             if (decoded.role === "customer") {
//                 if (!paramId || decoded.id !== paramAsNumber) {
//                     return res.status(403).json({
//                         success: false,
//                         message: "You can only access your own data",
//                     });
//                 }
//             }

//             next();

//         } catch (error: any) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Invalid or expired token",
//                 error: error.message
//             });
//         }
//     }
// }

const authorize = (...allowedRoles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            let token = req.headers.authorization;

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: "No token provided"
                });
            }

            // Bearer token support
            if (token.startsWith("Bearer ")) {
                token = token.split(" ")[1];
            }

            const decoded = jwt.verify(
                token!,
                config.jwtSecret as string
            ) as JwtPayload;

            req.user = decoded;

            // Role check
            if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized request!"
                });
            }

            if (decoded.role === "admin") {
                return next();
            }

            if (req.params.id) {  
                const paramId = Number(req.params.id);

                if (decoded.id !== paramId) {
                    return res.status(403).json({
                        success: false,
                        message: "You can only access your own user data"
                    });
                }

                return next();
            }

            if (req.params.bookingId) {
                const bookingId = Number(req.params.bookingId);

                const result = await pool.query(
                    `SELECT customer_id FROM bookings WHERE id = $1`,
                    [bookingId]
                );

                if (result.rows.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "Booking not found"
                    });
                }

                const ownerId = result.rows[0].customer_id;

                if (ownerId !== decoded.id) {
                    return res.status(403).json({
                        success: false,
                        message: "You can only access your own bookings"
                    });
                }

                return next();
            }

            
            next();

        } catch (error: any) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
                error: error.message
            });
        }
    };
};


export default authorize; 