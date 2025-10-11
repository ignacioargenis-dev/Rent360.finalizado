// Endpoint de debug ultra simple
export async function GET() {
  try {
    console.log('Debug-simple endpoint called');
    return Response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Debug endpoint working',
      nodeVersion: process.version,
      platform: process.platform,
    });
  } catch (error) {
    console.error('Debug-simple error:', error);
    return Response.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
