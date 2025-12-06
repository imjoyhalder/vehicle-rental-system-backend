import express, { Request, Response } from "express"
import initDB from "./config/db"
import { userRoutes } from "./modules/users/users.routes"

const app = express()
app.use(express.json())
app.use(express.urlencoded())

// Database call 
initDB()


app.get('/', (req: Request, res: Response)=>{
    res.status(200).json({
        message: "vehicle rental system server is running", 
        success: true, 
        path: req.path
    })
})


//*-------------- user routes-----------
app.use('/api/v1/', userRoutes)



export default app