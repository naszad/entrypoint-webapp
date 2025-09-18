import { NextRequest, NextResponse } from 'next/server';
import { fetchUserByEmail } from '@/libs/userService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await fetchUserByEmail(email);

    return NextResponse.json({
      exists: user !== null,
      user: user
    });

  } catch (error) {
    console.error('Error checking email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
