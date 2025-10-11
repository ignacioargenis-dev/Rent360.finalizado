import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 AUTH-STATUS CHECK - Request received');
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    console.log(
      'Cookies:',
      request.cookies.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' }))
    );

    const user = await requireAuth(request);

    console.log('✅ User authenticated successfully:', {
      id: user.id,
      email: user.email,
      role: user.role,
      hasAllFields: !!(user.id && user.email && user.role),
    });

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log(
      '❌ Authentication failed:',
      error instanceof Error ? error.message : String(error)
    );

    return NextResponse.json(
      {
        authenticated: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
        timestamp: new Date().toISOString(),
      },
      { status: 401 }
    );
  }
}
