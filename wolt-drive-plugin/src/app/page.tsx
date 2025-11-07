'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateDeliveryForm } from '@/components/create-delivery-form';
import { DeliveryList } from '@/components/delivery-list';
import { ApiLogs } from '@/components/api-logs';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  X, 
  Plus, 
  Package, 
  FileText, 
  Settings as SettingsIcon,
  Truck
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'logs'>('create');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  const menuItems = [
    { id: 'create', label: 'Create Order', icon: Plus },
    { id: 'list', label: 'Deliveries', icon: Package },
    { id: 'logs', label: 'API Logs', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-20">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                  <Truck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Wolt Drive
                  </h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    E-shop Delivery Integration
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/settings')}
              className="flex items-center gap-2"
            >
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] z-10
            bg-card/80 backdrop-blur-sm border-r border-border/50
            transition-all duration-300 ease-in-out
            ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:w-16 lg:translate-x-0'}
          `}
        >
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as typeof activeTab);
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${!sidebarOpen && 'lg:mx-auto'}`} />
                  <span className={`font-medium ${!sidebarOpen && 'lg:hidden'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'create' && (
              <div className="max-w-4xl">
                <CreateDeliveryForm />
              </div>
            )}
            {activeTab === 'list' && <DeliveryList />}
            {activeTab === 'logs' && <ApiLogs />}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-card/80 backdrop-blur-sm border-t border-border/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Built with Next.js, Zustand, React Query, and Shadcn UI
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Powered by</span>
              <span className="font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Wolt Drive API
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
