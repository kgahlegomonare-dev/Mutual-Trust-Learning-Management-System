import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure middleware can see the .env file in the backend folder
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Middleware: Protects endpoints by verifying the incoming stateless JWT Bearer token.
 */
export const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided. Access Denied' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // {id, role, email}
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token. Access Denied' });
    }
};

/**
 * Middleware: Handles Role-Based Access Control (RBAC).
 * Transformed to handle case-insensitive evaluations cleanly across front-end inputs and DB states.
 */
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({ message: 'Forbidden: Security credentials missing.' });
        }

        // Standardize both the configuration rules and user roles to lowercase
        const lowerAllowed = allowedRoles.map(role => role.toLowerCase());
        const userRole = req.user.role ? req.user.role.toLowerCase() : '';

        if (!lowerAllowed.includes(userRole)) {
            return res.status(403).json({ 
                message: 'Forbidden: You do not have the required permissions to access this resource.' 
            });
        }
        
        next();
    };
};