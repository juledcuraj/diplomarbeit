import { NextRequest, NextResponse } from 'next/server';
import { users } from '@/lib/data';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // For now, bypass credential checking and use the demo user
    const user = users[0]; // Always use the first demo user

    const token = generateToken({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      date_of_birth: user.date_of_birth,
      gender: user.gender,
      phone: user.phone
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        date_of_birth: user.date_of_birth,
        gender: user.gender,
        phone: user.phone
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}