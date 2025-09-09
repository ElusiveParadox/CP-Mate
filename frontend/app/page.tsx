import React from 'react';
import { Navbar } from '@/components/navbar/page';
import { HomePage } from '@/components/home/page';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar/>
      <main className="pt-16 px-4 sm:px-6 lg:px-8">
        <HomePage/>
      </main>
    </div>
  );
}
