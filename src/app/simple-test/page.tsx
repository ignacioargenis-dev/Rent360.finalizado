export default function SimpleTestPage() {
  return (
    <div className="p-8">
      <h1>Simple Test Page</h1>
      <p>If you can see this, Next.js is working correctly.</p>
      <p>Time: {new Date().toISOString()}</p>
    </div>
  );
}
