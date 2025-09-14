import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface User {
  id: number;
  email: string;
  full_name: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      full_name: user.full_name 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function getUserFromRequest(request: Request): User | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  return decoded ? {
    id: parseInt(decoded.id.toString()),
    email: decoded.email,
    full_name: decoded.full_name
  } : null;
}