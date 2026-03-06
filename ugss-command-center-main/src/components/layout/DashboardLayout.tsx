import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  headerActions?: ReactNode;
}

export function DashboardLayout({ children, title, subtitle, headerActions }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-background">
      <Sidebar />
      <div className="ml-16 lg:ml-64 transition-all duration-300">
        <Header title={title} subtitle={subtitle}>{headerActions}</Header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
