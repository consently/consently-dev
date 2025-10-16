'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  Shield,
  LayoutDashboard,
  Cookie,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

import { useUserStore } from '@/lib/stores/useUserStore';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    name: 'Cookie Consent',
    icon: Cookie,
    children: [
      { name: 'Scanner', href: '/dashboard/cookies/scan' },
      { name: 'Templates', href: '/dashboard/cookies/templates' },
      { name: 'Widget Settings', href: '/dashboard/cookies/widget' },
    ],
  },
  {
    name: 'DPDPA Consent',
    icon: FileText,
    children: [
      { name: 'Dashboard', href: '/dashboard/dpdpa' },
      { name: 'Processing Activities', href: '/dashboard/dpdpa/activities' },
      { name: 'Widget Configuration', href: '/dashboard/dpdpa/widget' },
      { name: 'Consent Records', href: '/dashboard/dpdpa/records' },
    ],
  },
  { name: 'Reports & Analytics', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Cookie Consent', 'DPDPA Consent']);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, setUser, clearUser } = useUserStore();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        setUser({
          id: authUser.id,
          email: authUser.email!,
          fullName: authUser.user_metadata?.full_name || '',
          companyName: authUser.user_metadata?.company_name || '',
          emailVerified: !!authUser.email_confirmed_at,
          twoFactorEnabled: false,
          createdAt: authUser.created_at,
          updatedAt: authUser.updated_at || authUser.created_at,
        });
      } else {
        router.push('/login');
      }
    };

    fetchUser();
  }, [supabase, router, setUser]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      clearUser();
      router.push('/login');
    }
  };

  const toggleExpanded = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Consently</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => toggleExpanded(item.name)}
                        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          <item.icon className="h-5 w-5 mr-3" />
                          {item.name}
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            expandedItems.includes(item.name) ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {expandedItems.includes(item.name) && (
                        <ul className="mt-1 ml-8 space-y-1">
                          {item.children.map((child) => (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                                  isActive(child.href)
                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                                onClick={() => setSidebarOpen(false)}
                              >
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href!}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive(item.href!)
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* User menu */}
          <div className="p-4 border-t border-gray-200">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center flex-1">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium truncate">{user?.fullName || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
            <Menu className="h-6 w-6 text-gray-500" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center text-sm text-gray-600">
              <Shield className="h-4 w-4 mr-2 text-green-500" />
              <span className="font-medium">DPDPA 2023 Compliant</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
}
