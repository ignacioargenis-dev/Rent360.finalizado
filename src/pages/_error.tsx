import React from 'react';
import { NextPageContext } from 'next';

interface ErrorProps {
  statusCode?: number;
  title?: string;
}

function Error({ statusCode, title }: ErrorProps) {
  return (
    <div
      style={{
        padding: '100px 20px',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        {statusCode ? `${statusCode} - ` : ''}Error
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#666' }}>
        {title || 'Ha ocurrido un error inesperado'}
      </p>
      <button
        onClick={() => (window.location.href = '/')}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Volver al inicio
      </button>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
