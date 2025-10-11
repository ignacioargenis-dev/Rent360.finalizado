// Health endpoint ultra simple sin imports complejos
export async function GET() {
  const startTime = Date.now();

  try {
    const totalResponseTime = Date.now() - startTime;

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: totalResponseTime,
      message: 'Server is running',
      environment: process.env.NODE_ENV || 'development',
    };

    console.log('Health check completed', {
      status: 'healthy',
      responseTime: totalResponseTime,
    });

    return Response.json(healthData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('Health check failed', error);

    return Response.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
