"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  TrendingUp,
  Settings,
  Plus,
  Camera,
  BarChart3,
  User,
  Target,
  Calendar,
  Activity,
  Utensils,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    {
      href: "/",
      icon: Home,
      label: "Dashboard",
      description: "Overview & Today's Summary",
    },
    {
      href: "/log-meal",
      icon: Plus,
      label: "Log Meal",
      description: "Add new meal entry",
    },
    {
      href: "/progress",
      icon: TrendingUp,
      label: "Progress",
      description: "Charts & History",
    },
    {
      href: "/meals",
      icon: Utensils,
      label: "Meal History",
      description: "View all meals",
    },
    {
      href: "/analytics",
      icon: BarChart3,
      label: "Analytics",
      description: "Detailed insights",
    },
    {
      href: "/settings",
      icon: Settings,
      label: "Settings",
      description: "Profile & Preferences",
    },
  ];

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo/Header */}
      <div className="flex items-center px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Nutrition Snap</h1>
            <p className="text-xs text-gray-500">Sri Lankan Cuisine Tracker</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-3 rounded-lg transition-colors group",
                isActive
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 mr-3 flex-shrink-0",
                  isActive
                    ? "text-green-600"
                    : "text-gray-400 group-hover:text-gray-600"
                )}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isActive ? "text-green-700" : "text-gray-900"
                  )}
                >
                  {item.label}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Quick Actions */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="space-y-2">
          <Link href="/log-meal">
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white mb-2">
              <Plus className="w-4 h-4 mr-2" />
              Quick Log Meal
            </Button>
          </Link>
          <Link href="/log-meal?method=camera">
            <Button
              variant="outline"
              className="w-full border-green-200 text-green-600 hover:bg-green-50"
            >
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">
          Built with privacy in mind 🔒
        </p>
      </div>
    </div>
  );
}
