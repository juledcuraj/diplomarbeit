import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getUserFromRequest } from '@/lib/auth';
import QRCode from 'qrcode';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Replace with a secure secret in production

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if the user exists
    const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (res.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = res.rows[0];

    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error during authentication:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Fetch emergency profile for the authenticated user
    const res = await pool.query('SELECT * FROM emergency_profiles WHERE user_id = $1', [user.id]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const emergencyProfile = res.rows[0];

    // Generate QR code
    const qrData = JSON.stringify({
      name: user.full_name,
      blood_type: emergencyProfile.blood_type,
      allergies: emergencyProfile.allergies,
      conditions: emergencyProfile.conditions,
      medications: emergencyProfile.medications,
      emergency_contact: {
        name: emergencyProfile.emergency_contact_name,
        phone: emergencyProfile.emergency_contact_phone
      }
    });

    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return NextResponse.json({ 
      profile: emergencyProfile,
      qrCode: qrCodeDataURL
    });
  } catch (error) {
    console.error('Error fetching emergency profile or generating QR code:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}