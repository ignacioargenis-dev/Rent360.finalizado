// Endpoint ultra simple sin imports de Next.js
export async function GET() {
  return Response.json({
    status: 'ok',
    message: 'Pong',
    timestamp: new Date().toISOString(),
  });
}
