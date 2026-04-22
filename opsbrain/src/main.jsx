import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import App from '@/App.jsx'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ThemeProvider } from 'next-themes'
import '@/index.css'
import '@/styles/responsive.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
      <App />
      <Analytics />
    </ThemeProvider>
  </ErrorBoundary>
)
