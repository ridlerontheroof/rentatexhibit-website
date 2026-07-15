import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { SideRail } from './SideRail';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <SideRail />
    </div>
  );
}
