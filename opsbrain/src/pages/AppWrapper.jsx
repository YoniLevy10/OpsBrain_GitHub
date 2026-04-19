import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import AuthGuard from '../components/AuthGuard';
import ErrorBoundary from '../components/ErrorBoundary';
import PageLoader from '../components/PageLoader';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function AppWrapper({ children, currentPageName }) {
  const publicPages = ['Onboarding'];
  const isPublicPage = publicPages.includes(currentPageName);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<PageLoader />}>
          {isPublicPage ? children : <AuthGuard>{children}</AuthGuard>}
        </Suspense>
        <Toaster position="top-center" richColors />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
