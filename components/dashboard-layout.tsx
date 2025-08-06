'use client'

import { useState } from 'react'
import DashboardSidebar from './dashboard-sidebar'
import DashboardHeader from './dashboard-header'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block">
        <DashboardSidebar />
      </div>

      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative">
            <DashboardSidebar />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          title={title} 
          subtitle={subtitle}
          onMenuClick={() => setSidebarOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
