import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const cookies = request.cookies;
    const authToken = cookies.get('auth-token');
    const refreshToken = cookies.get('refresh-token');

    return NextResponse.json({
      success: true,
      cookies: {
        hasAuthToken: !!authToken,
        hasRefreshToken: !!refreshToken,
        authTokenLength: authToken?.value?.length || 0,
        refreshTokenLength: refreshToken?.value?.length || 0,
      },
      headers: {
        cookie: request.headers.get('cookie') ? 'present' : 'not present',
        userAgent: request.headers.get('user-agent')?.substring(0, 50) + '...',
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL,
        digitalOcean: !!process.env.DIGITALOCEAN_APP_ID,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
