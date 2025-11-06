'use client';

import { useState } from 'react';
import { ConfigurationForm } from '@/components/configuration-form';
import { CreateDeliveryForm } from '@/components/create-delivery-form';
import { DeliveryList } from '@/components/delivery-list';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'config' | 'create' | 'list'>('config');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Wolt Drive Plugin
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                E-shop Delivery Integration
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Powered by Wolt Drive API
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('config')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'config'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Configuration
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Create Delivery
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'list'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Deliveries
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'config' && (
          <div className="max-w-2xl">
            <ConfigurationForm />
          </div>
        )}
        {activeTab === 'create' && (
          <div className="max-w-4xl">
            <CreateDeliveryForm />
          </div>
        )}
        {activeTab === 'list' && <DeliveryList />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Built with Next.js, Zustand, React Query, and Shadcn UI
          </p>
        </div>
      </footer>
    </div>
  );
}
