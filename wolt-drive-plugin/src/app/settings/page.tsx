'use client';

import { useRouter } from 'next/navigation';
import { ConfigurationForm } from '@/components/configuration-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => router.push('/')} 
                variant="ghost" 
                size="sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Settings
                </h1>
                <p className="text-sm text-muted-foreground">Configure your Wolt Drive API</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ConfigurationForm />
      </main>
    </div>
  );
}
