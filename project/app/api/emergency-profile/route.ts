import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import pool from '@/lib/db';
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
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Get emergency profile with medical data from database
    const result = await pool.query(
      `SELECT ep.*, u.full_name, u.date_of_birth,
              mp.blood_type as medical_blood_type, mp.allergies as medical_allergies, 
              mp.chronic_conditions, mp.medication_notes
       FROM emergency_profiles ep
       JOIN users u ON u.id = ep.user_id
       LEFT JOIN user_medical_profile mp ON mp.user_id = ep.user_id
       WHERE ep.user_id = $1`,
      [user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Emergency profile not found' },
        { status: 404 }
      );
    }

    const emergencyProfile = result.rows[0];
    
    // Use medical profile data if emergency profile data is not set, ensuring consistency
    const profileData = {
      ...emergencyProfile,
      blood_type: emergencyProfile.blood_type || emergencyProfile.medical_blood_type,
      allergies: emergencyProfile.allergies || emergencyProfile.medical_allergies,
      conditions: emergencyProfile.conditions || emergencyProfile.chronic_conditions,
      medications: emergencyProfile.medications || emergencyProfile.medication_notes
    };

    // Generate QR code with consistent data
    const qrData = JSON.stringify({
      name: profileData.full_name,
      blood_type: profileData.blood_type,
      allergies: profileData.allergies,
      conditions: profileData.conditions,
      medications: profileData.medications,
      emergency_contact: {
        name: profileData.emergency_contact_name,
        phone: profileData.emergency_contact_phone
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
      profile: profileData,
      qrCode: qrCodeDataURL
    });
  } catch (error) {
    console.error('Emergency profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emergency profile' },
      { status: 500 }
    );
  }
}