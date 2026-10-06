import express from 'express';
import cors from 'cors';
// other imports (dotenv, routes, etc.)

const app = express();

// Configure CORS
app.use(cors({
  origin: [
    'https://gupio-full-stack-option1-employee-m-iota.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true
}));

// Express body parsers
app.use(express.json());

// Routes (must come AFTER app.use(cors(...)))
// app.use('/api', employeeRoutes);