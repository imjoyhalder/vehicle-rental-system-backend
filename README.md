# Vehicle Rental System API

A backend API for managing a vehicle rental system with role-based access control (Admin and Customer). The system handles vehicles, users, and bookings.

## Live -> https://vehicle-rental-system-backend-two.vercel.app

**Project Overview**
The system allows:

Managing vehicle inventory with availability tracking
Managing customer accounts and profiles
Handling vehicle rentals, returns, and cost calculation
Securing role-based access using JWT authentication


**Technology Stack**

- Node.js + TypeScript
- Express.js
- PostgreSQL
- bcrypt for password hashing
- jsonwebtoken (JWT) for authentication

**Authentication & Authorization**

Admin: full access to vehicles, users, and all bookings
Customer: can register, view vehicles, and manage own bookings

**Authentication flow:**
Passwords are hashed before storing in the database
Users login via /api/v1/auth/signin and receive a JWT
Protected endpoints require a valid token in the header (Authorization: Bearer <token>)
Role-based access is enforced; unauthorized requests return 401 or 403

1. Clone the Repository
```
git clone repo-rul
cd <project-folder>
```
2. Install Dependencies
```
npm install
```

Create Environment Variables

Inside the project root, create a .env file:
```
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secret_key
```


Make sure your PostgreSQL database is running.

1. Setup the Database

Run the SQL table creation scripts inside your project
(or ensure your initialization code auto-creates tables).

Example:
```
npm run migrate
```

Or if your project auto-creates tables, simply start the server once.

5. Start the Server

For development:
```
    npm run dev
```
