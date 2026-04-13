import React, { useState, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import SplashScreen from '../components/SplashScreen';
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
  const [showSplash, setShowSplash] = useState(true);

  // דפי Onboarding לא צריכים AuthGuard (הם עצמם חלק מתהליך ההתחברות)
  const publicPages = ['Onboarding'];
  const isPublicPage = publicPages.includes(currentPageName);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
        {!showSplash && (
          <Suspense fallback={<PageLoader />}>
            {isPublicPage ? children : <AuthGuard>{children}</AuthGuard>}
          </Suspense>
        )}
        <Toaster position="top-center" richColors />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}