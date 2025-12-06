import jwt, { JwtPayload } from 'jsonwebtoken';
import { NextFunction, Request, Response } from "express"
import config from '../config';

const authorize = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            let token = req.headers.authorization;

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: "No token provided"
                })
            }

            // check if it's bearer token 
            if (token.startsWith('Bearer ')) {
                token = token.split(" ")[1];
            }

            //verify token 
            const decoded = jwt.verify(token!, config.jwtSecret as string) as JwtPayload
            req.user = decoded;


            // Role based access 
            if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized request!!"
                })
            }

            if (decoded.role === 'admin') {
                return next()
            }

            const paramId = req.params.id;
            const paramAsNumber = Number(paramId);

            // Customer must ONLY access own ID
            if (decoded.role === "customer") {
                if (!paramId || decoded.id !== paramAsNumber) {
                    return res.status(403).json({
                        success: false,
                        message: "You can only access your own data",
                    });
                }
            }

            // If passes all checks → allow
            next();

        } catch (error: any) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
                error: error.message
            });
        }
    }
}

export default authorize; 