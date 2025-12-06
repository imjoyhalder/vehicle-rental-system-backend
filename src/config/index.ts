import  dotenv  from 'dotenv';
import path from 'path'

dotenv.config({path: path.join(process.cwd(), '.env')})

const config = {
    connectionString: process.env.PG_KEY, 
    port: process.env.PORT, 
    jwtSecret: process.env.JWT_SECRET
}

export default config; 