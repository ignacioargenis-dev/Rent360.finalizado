'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { logger } from '@/lib/logger';
import UnifiedSidebar from './UnifiedSidebar';
import { LoadingSpinner } from '@/components/ui/LoadingStates';

// Re-export del layout unificado para mantener compatibilidad
export { default } from './UnifiedDashboardLayout';
export type { UnifiedDashboardLayoutProps as DashboardLayoutProps } from './UnifiedDashboardLayout';
