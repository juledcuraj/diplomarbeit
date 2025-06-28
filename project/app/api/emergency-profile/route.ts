import { NextRequest, NextResponse } from 'next/server';
import { emergencyProfile } from '@/lib/data';
import { getUserFromRequest } from '@/lib/auth';
import QRCode from 'qrcode';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (emergencyProfile.user_id !== user.id) {
    return NextResponse.json(
      { error: 'Profile not found' },
      { status: 404 }
    );
  }

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

  try {
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
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}