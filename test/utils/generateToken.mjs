import jwt from 'jsonwebtoken';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Function to generate JWT token
const generateToken = (userId) => {
    const token = jwt.sign(
        { user_id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '5h' } // Token expires in 5 hours, adjust as needed
    );
    return token;
};
export default generateToken;