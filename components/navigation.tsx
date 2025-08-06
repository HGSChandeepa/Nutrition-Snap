'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, TrendingUp, Settings, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/progress', icon: TrendingUp, label: 'Progress' },
    { href: '/settings', icon: Settings, label: 'Settings' }
  ]

  return (
    <>
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center py-2 px-3 rounded-lg transition-colors",
                  isActive 
                    ? "text-green-600 bg-green-50" 
                    : "text-gray-500 hover:text-green-600"
                )}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Floating Action Button */}
      <Link
        href="/log-meal"
        className="fixed bottom-20 right-4 w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </>
  )
}
