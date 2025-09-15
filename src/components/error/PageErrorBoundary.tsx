'use client';

import React, { Component, ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { logger } from '@/lib/logger-edge';

interface PageErrorBoundaryProps {
  children: ReactNode;
  pageName?: string;
}

export class PageErrorBoundary extends Component<PageErrorBoundaryProps> {
  render() {
    return (
      <ErrorBoundary
        onError={(error, errorInfo) => {
          // Log específico para errores de página
          logger.error('Page Error Boundary', {
            page: this.props.pageName || 'unknown',
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            context: 'page_error_boundary'
          });
        }}
        showDetails={process.env.NODE_ENV === 'development'}
      >
        {this.props.children}
      </ErrorBoundary>
    );
  }
}

// HOC específico para páginas
export function withPageErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  pageName: string
) {
  const WrappedComponent = (props: P) => (
    <PageErrorBoundary pageName={pageName}>
      <Component {...props} />
    </PageErrorBoundary>
  );

  WrappedComponent.displayName = `withPageErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
