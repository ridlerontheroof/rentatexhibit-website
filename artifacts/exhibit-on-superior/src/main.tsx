import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

// Remove prerendered JSON-LD before hydration: Helmet re-emits the same
// structured data (with live values) on mount, and Helmet never removes
// scripts it didn't create. Leaving both sets in the DOM makes Google's
// rendered crawl see duplicate entities (e.g. two aggregate ratings on
// /reviews). Removing here — before render — avoids any window where both
// copies coexist.
document.querySelectorAll('script[data-ssr-jsonld]').forEach((el) => el.remove());

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </HelmetProvider>
);
