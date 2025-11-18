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
  FileCheck,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

import { useUserStore } from '@/lib/stores/useUserStore';

const navigation = [
  {
    name: 'Cookie Consent',
    icon: Cookie,
    children: [
      { name: 'Overview', href: '/dashboard/cookies' },
      { name: 'Cookie Scanner', href: '/dashboard/cookies/scan' },
      { name: 'Widget Settings', href: '/dashboard/cookies/widget' },
      { name: 'Consent Records', href: '/dashboard/cookies/records' },
    ],
  },
  {
    name: 'DPDPA Consent',
    icon: FileText,
    children: [
      { name: 'Overview', href: '/dashboard/dpdpa' },
      { name: 'Processing Activities', href: '/dashboard/dpdpa/activities' },
      { name: 'Widget Configuration', href: '/dashboard/dpdpa/widget' },
      { name: 'Consent Records', href: '/dashboard/dpdpa/records' },
    ],
  },
  {
    name: 'Reports & Analytics',
    icon: BarChart3,
    children: [
      { name: 'Analytics Dashboard', href: '/dashboard/reports' },
      { name: 'Audit Logs', href: '/dashboard/audit' },
    ],
  },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Cookie Consent', 'DPDPA Consent', 'Reports & Analytics']);
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
        // Fetch user profile to check onboarding status
        const { data: profile } = await supabase
          .from('users')
          .select('onboarding_completed, full_name')
          .eq('id', authUser.id)
          .single();

        // If profile doesn't exist, create it (for OAuth users)
        if (!profile) {
          const { data: newProfile } = await supabase
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email!,
              full_name: authUser.user_metadata?.full_name || null,
              auth_provider: authUser.app_metadata?.provider || 'email',
              onboarding_completed: false,
            })
            .select()
            .single();

          // Redirect to onboarding if not completed
          if (pathname !== '/dashboard/setup/onboarding') {
            router.push('/dashboard/setup/onboarding');
            return;
          }
        } else {
          // Redirect to onboarding if not completed and not already on onboarding page
          if (!profile.onboarding_completed && pathname !== '/dashboard/setup/onboarding') {
            router.push('/dashboard/setup/onboarding');
            return;
          }
        }

        setUser({
          id: authUser.id,
          email: authUser.email!,
          fullName: profile?.full_name || authUser.user_metadata?.full_name || '',
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
  }, [supabase, router, setUser, pathname]);

  const handleLogout = async () => {
    try {
      // Log logout attempt (before sign out)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        toast.error('Failed to sign out. Please try again.');
        return;
      }

      // Clear user store
      clearUser();
      
      // Log successful logout
      if (currentUser) {
        try {
          const { logSuccess } = await import('@/lib/audit');
          await logSuccess(
            currentUser.id,
            'user.logout',
            'auth',
            currentUser.id,
            undefined
          );
        } catch (auditError) {
          console.error('Failed to log logout:', auditError);
          // Don't block logout if audit logging fails
        }
      }

      // Force router refresh and redirect
      router.refresh();
      router.push('/login');
      
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Unexpected logout error:', error);
      toast.error('An error occurred during sign out');
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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 safe-left ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6 border-b border-gray-200 safe-top">
            <Link href="/dashboard/cookies" className="flex items-center space-x-2" onClick={() => setSidebarOpen(false)}>
              <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
              <span className="text-lg sm:text-xl font-bold text-gray-900">Consently</span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
              aria-label="Close menu"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 overflow-y-auto overscroll-contain scroll-smooth">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => toggleExpanded(item.name)}
                        className="flex items-center justify-between w-full px-3 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 touch-manipulation"
                      >
                        <div className="flex items-center">
                          <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${
                            expandedItems.includes(item.name) ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {expandedItems.includes(item.name) && (
                        <ul className="mt-1 ml-6 sm:ml-8 space-y-1 animate-in slide-in-from-top-2 duration-200">
                          {item.children.map((child) => (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className={`block px-3 py-3 text-sm rounded-lg transition-all duration-200 touch-manipulation ${
                                  isActive(child.href)
                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                    : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                                }`}
                                onClick={() => setSidebarOpen(false)}
                              >
                                <span className="truncate block">{child.name}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href!}
                      className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 touch-manipulation ${
                        isActive(item.href!)
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* User menu */}
          <div className="p-3 sm:p-4 border-t border-gray-200 safe-bottom">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center w-full px-3 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 touch-manipulation"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="font-medium truncate text-sm">{user?.fullName || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
                <ChevronDown
                  className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-10 animate-in slide-in-from-bottom-2 duration-200">
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150 touch-manipulation"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4 mr-3 flex-shrink-0" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors duration-150 touch-manipulation"
                  >
                    <LogOut className="h-4 w-4 mr-3 flex-shrink-0" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-4 lg:px-8 safe-top backdrop-blur-sm bg-white/95">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 touch-manipulation"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6 text-gray-500" />
          </button>

          <div className="flex items-center space-x-2 sm:space-x-4 ml-auto lg:ml-0">
            <div className="flex items-center text-xs sm:text-sm text-gray-600 bg-green-50 px-2 sm:px-3 py-1.5 rounded-full">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-green-500 flex-shrink-0" />
              <span className="font-medium whitespace-nowrap">DPDPA 2023 Compliant</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 pb-6 sm:pb-8 safe-bottom">{children}</main>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
}
