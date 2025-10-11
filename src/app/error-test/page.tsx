'use client';

import React from 'react';
import { useAuth } from '@/components/auth/AuthProviderSimple';

export default function ErrorTestPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1>Error Test Page</h1>
      <p>User: {user ? JSON.stringify(user) : 'No user'}</p>
      <p>Loading: {loading ? 'true' : 'false'}</p>
    </div>
  );
}
