'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  Activity, 
  Shield, 
  Cookie, 
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  UserPlus,
  RefreshCw,
  Search,
  Filter,
  Download,
  Database,
  Server,
  Eye,
  Mail,
  Calendar,
  Menu,
  X,
  ChevronDown,
  BarChart3,
  LogOut
} from 'lucide-react';

interface UserStat {
  id: string;
  email: string;
  full_name: string | null;
  auth_provider: string;
  demo_account: boolean;
  created_at: string;
  onboarding_completed: boolean;
  subscription: {
    plan: string;
    status: string;
    is_trial: boolean;
    trial_end: string | null;
    trial_days_left: number | null;
    trial_status: string;
    start_date: string;
    billing_cycle: string;
    amount: number;
  };
  cookieModule: {
    banners: number;
    activeBanners: number;
    totalScans: number;
    totalConsents: number;
    monthlyConsents: number;
    lastScan: string | null;
  };
  dpdpaModule: {
    widgets: number;
    activeWidgets: number;
    processingActivities: number;
    activeActivities: number;
    totalConsents: number;
    monthlyConsents: number;
    totalRequests: number;
    pendingRequests: number;
  };
  totalConsentsThisMonth: number;
  totalConsents: number;
}

interface PlatformStats {
  totalUsers: number;
  activeTrials: number;
  expiredTrials: number;
  paidSubscriptions: number;
  demoAccounts: number;
  cookieModuleUsers: number;
  dpdpaModuleUsers: number;
  bothModulesUsers: number;
  totalConsentsThisMonth: number;
  totalCookieScans: number;
  totalProcessingActivities: number;
  totalConsents: number;
  totalCookieBanners: number;
  totalDpdpaWidgets: number;
  totalDpdpaRequests: number;
}

interface AdminData {
  success: boolean;
  users: UserStat[];
  platformStats: PlatformStats;
  timestamp: string;
}

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const credentials = btoa(`${username}:${password}`);
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Basic ${credentials}`,
        },
      });

      if (response.ok) {
        const adminData = await response.json();
        setData(adminData);
        setIsAuthenticated(true);
        
        sessionStorage.setItem('adminAuth', credentials);
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    const credentials = sessionStorage.getItem('adminAuth');
    if (!credentials) return;

    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Basic ${credentials}`,
        },
      });

      if (response.ok) {
        const adminData = await response.json();
        setData(adminData);
      } else {
        setIsAuthenticated(false);
        sessionStorage.removeItem('adminAuth');
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  useEffect(() => {
    const credentials = sessionStorage.getItem('adminAuth');
    if (credentials) {
      setIsAuthenticated(true);
      fetchData();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuth');
    setUsername('');
    setPassword('');
    setData(null);
  };

  const getPlanBadgeColor = (plan: string, isTrial: boolean) => {
    if (isTrial) return 'bg-blue-100 text-blue-700 border-blue-200';
    switch (plan) {
      case 'enterprise': return 'bg-blue-600 text-white border-0';
      case 'medium': return 'bg-blue-500 text-white border-0';
      case 'small': return 'bg-blue-400 text-white border-0';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  const filteredUsers = data?.users.filter((user) => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.includes(searchTerm);
    
    const matchesPlan = filterPlan === 'all' || user.subscription.plan === filterPlan;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'trial' && user.subscription.is_trial) ||
      (filterStatus === 'paid' && !user.subscription.is_trial && user.subscription.status === 'active') ||
      (filterStatus === 'demo' && user.demo_account);
    
    return matchesSearch && matchesPlan && matchesStatus;
  }) || [];

  const recentUsers = data?.users.filter(user => {
    const createdDate = new Date(user.created_at);
    const daysDiff = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 7;
  }).length || 0;

  const estimatedMonthlyRevenue = data?.users.reduce((sum, user) => {
    if (user.subscription.status === 'active' && !user.subscription.is_trial) {
      return sum + (user.subscription.amount || 0);
    }
    return sum;
  }, 0) || 0;

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-blue-600 rounded-xl">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Admin Panel</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin@consently.in"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && (
                <div className="text-sm text-red-600 flex items-center gap-2 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Authenticating...' : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading admin data...</p>
        </div>
      </div>
    );
  }

  // Navigation items
  const navigation = [
    { name: 'Overview', icon: BarChart3, id: 'overview' },
    { name: 'Users', icon: Users, id: 'users' },
    { name: 'Activity', icon: Activity, id: 'activity' },
    { name: 'Analytics', icon: TrendingUp, id: 'analytics' },
  ];

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
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Consently</span>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Admin Badge */}
          <div className="px-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">Admin Panel</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">Platform Management</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 overflow-y-auto">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`flex items-center w-full px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    <span>{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Stats Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Users</span>
                <span className="font-semibold text-gray-900">{data.platformStats.totalUsers}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">This Month</span>
                <span className="font-semibold text-blue-600">{data.platformStats.totalConsentsThisMonth.toLocaleString()}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-all"
          >
            <Menu className="h-6 w-6 text-gray-500" />
          </button>

          <div className="flex items-center gap-3 ml-auto lg:ml-0">
            <div className="flex items-center text-xs sm:text-sm text-gray-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
              <Server className="h-4 w-4 mr-2 text-green-600" />
              <span className="font-medium">System Healthy</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Platform Overview</h1>
                <p className="text-gray-600 mt-1">Real-time metrics and system health</p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{data.platformStats.totalUsers}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      +{recentUsers} this week
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Monthly Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">₹{estimatedMonthlyRevenue.toLocaleString()}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      {data.platformStats.paidSubscriptions} paid users
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Active Trials</CardTitle>
                    <Clock className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{data.platformStats.activeTrials}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      {data.platformStats.expiredTrials} expired
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Consents This Month</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">
                      {data.platformStats.totalConsentsThisMonth.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {data.platformStats.totalConsents.toLocaleString()} all time
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Module Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Module Performance</CardTitle>
                    <CardDescription>Usage across Cookie and DPDPA modules</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 border-2 border-blue-100 rounded-lg bg-blue-50">
                        <Cookie className="h-6 w-6 text-blue-600 mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{data.platformStats.cookieModuleUsers}</div>
                        <p className="text-sm text-gray-600 font-medium">Cookie Module</p>
                        <div className="mt-3 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Banners:</span>
                            <span className="font-semibold">{data.platformStats.totalCookieBanners}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Scans:</span>
                            <span className="font-semibold">{data.platformStats.totalCookieScans}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border-2 border-blue-100 rounded-lg bg-blue-50">
                        <Shield className="h-6 w-6 text-blue-600 mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{data.platformStats.dpdpaModuleUsers}</div>
                        <p className="text-sm text-gray-600 font-medium">DPDPA Module</p>
                        <div className="mt-3 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Widgets:</span>
                            <span className="font-semibold">{data.platformStats.totalDpdpaWidgets}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Requests:</span>
                            <span className="font-semibold">{data.platformStats.totalDpdpaRequests}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border-2 border-green-100 rounded-lg bg-green-50">
                        <CheckCircle2 className="h-6 w-6 text-green-600 mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{data.platformStats.bothModulesUsers}</div>
                        <p className="text-sm text-gray-600 font-medium">Both Modules</p>
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <p className="text-xs text-gray-600">
                            {((data.platformStats.bothModulesUsers / data.platformStats.totalUsers) * 100).toFixed(1)}% adoption rate
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Last 24 hours</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <UserPlus className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">New Users</p>
                            <p className="text-xs text-gray-500">Sign ups today</p>
                          </div>
                        </div>
                        <span className="text-lg font-bold">{recentUsers}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Consents</p>
                            <p className="text-xs text-gray-500">This month</p>
                          </div>
                        </div>
                        <span className="text-lg font-bold">{data.platformStats.totalConsentsThisMonth}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Clock className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Active Trials</p>
                            <p className="text-xs text-gray-500">Pending conversion</p>
                          </div>
                        </div>
                        <span className="text-lg font-bold">{data.platformStats.activeTrials}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl">User Management</CardTitle>
                    <CardDescription>Manage and monitor all platform users</CardDescription>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-0 self-start sm:self-auto">
                    {filteredUsers.length} / {data.platformStats.totalUsers} Users
                  </Badge>
                </div>

                {/* Search and Filters */}
                <div className="mt-6 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by email, name, or user ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Filters:</span>
                    </div>
                    
                    <select
                      value={filterPlan}
                      onChange={(e) => setFilterPlan(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Plans</option>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="enterprise">Enterprise</option>
                    </select>

                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="trial">Active Trials</option>
                      <option value="paid">Paid Users</option>
                      <option value="demo">Demo Accounts</option>
                    </select>

                    {(filterPlan !== 'all' || filterStatus !== 'all' || searchTerm) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFilterPlan('all');
                          setFilterStatus('all');
                          setSearchTerm('');
                        }}
                        className="text-xs"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No users found matching your filters</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="group hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-blue-200 rounded-lg p-4 space-y-3 bg-white">
                        {/* User Header */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900">{user.email}</h3>
                                {user.demo_account && (
                                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                    <Eye className="h-3 w-3 mr-1" />
                                    Demo
                                  </Badge>
                                )}
                              </div>
                              {user.full_name && (
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {user.full_name}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <Calendar className="h-3 w-3" />
                                Joined {new Date(user.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <Badge className={getPlanBadgeColor(user.subscription.plan, user.subscription.is_trial)}>
                              {user.subscription.is_trial ? 'TRIAL' : user.subscription.plan.toUpperCase()}
                            </Badge>
                            {user.subscription.trial_status === 'active' && (
                              <div className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">
                                <Clock className="h-3 w-3" />
                                {user.subscription.trial_days_left}d left
                              </div>
                            )}
                            {user.subscription.trial_status === 'expired' && (
                              <div className="flex items-center gap-1 text-xs text-red-700 bg-red-50 px-2 py-1 rounded-lg">
                                <XCircle className="h-3 w-3" />
                                Expired
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Module Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                          {/* Cookie Module */}
                          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Cookie className="h-4 w-4 text-blue-600" />
                              <h4 className="font-semibold text-blue-900 text-sm">Cookie Module</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-gray-600">Banners</p>
                                <p className="font-bold text-gray-900">{user.cookieModule.banners}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Scans</p>
                                <p className="font-bold text-gray-900">{user.cookieModule.totalScans}</p>
                              </div>
                              <div className="col-span-2 pt-2 border-t border-blue-100">
                                <p className="text-gray-600">This Month</p>
                                <p className="font-bold text-blue-700">{user.cookieModule.monthlyConsents}</p>
                              </div>
                            </div>
                          </div>

                          {/* DPDPA Module */}
                          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Shield className="h-4 w-4 text-blue-600" />
                              <h4 className="font-semibold text-blue-900 text-sm">DPDPA Module</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-gray-600">Widgets</p>
                                <p className="font-bold text-gray-900">{user.dpdpaModule.widgets}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Activities</p>
                                <p className="font-bold text-gray-900">{user.dpdpaModule.processingActivities}</p>
                              </div>
                              <div className="col-span-2 pt-2 border-t border-blue-100">
                                <p className="text-gray-600">This Month</p>
                                <p className="font-bold text-blue-700">{user.dpdpaModule.monthlyConsents}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Total */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                          <span className="font-semibold text-gray-700 text-sm">Total Consents This Month</span>
                          <span className="text-xl font-bold text-blue-600">{user.totalConsentsThisMonth}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'activity' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Activity className="h-6 w-6" />
                  Recent Activity Timeline
                </CardTitle>
                <CardDescription>Real-time platform activity and user actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.users.slice(0, 10).map((user, index) => (
                    <div key={user.id} className="flex gap-4 items-start">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-500 animate-pulse' : 'bg-blue-500'
                        }`} />
                        {index < 9 && <div className="w-px h-full bg-gray-200 mt-2" />}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-gray-900">{user.email}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {user.totalConsentsThisMonth > 0 ? (
                                <span className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  Collected {user.totalConsentsThisMonth} consents this month
                                </span>
                              ) : (
                                <span className="text-gray-500">No recent consent activity</span>
                              )}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'analytics' && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <TrendingUp className="h-6 w-6" />
                    Conversion Analytics
                  </CardTitle>
                  <CardDescription>Trial to paid conversion insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-blue-50 rounded-xl border-2 border-blue-100">
                      <div className="text-4xl font-bold text-blue-600">
                        {data.platformStats.activeTrials > 0 
                          ? ((data.platformStats.paidSubscriptions / (data.platformStats.paidSubscriptions + data.platformStats.activeTrials + data.platformStats.expiredTrials)) * 100).toFixed(1)
                          : 0}%
                      </div>
                      <p className="text-sm text-blue-700 font-medium mt-2">Conversion Rate</p>
                      <p className="text-xs text-gray-600 mt-1">Trials → Paid</p>
                    </div>

                    <div className="text-center p-6 bg-blue-50 rounded-xl border-2 border-blue-100">
                      <div className="text-4xl font-bold text-blue-600">
                        {data.platformStats.totalUsers > 0
                          ? ((data.platformStats.cookieModuleUsers / data.platformStats.totalUsers) * 100).toFixed(1)
                          : 0}%
                      </div>
                      <p className="text-sm text-blue-700 font-medium mt-2">Cookie Adoption</p>
                      <p className="text-xs text-gray-600 mt-1">Users with Cookie Module</p>
                    </div>

                    <div className="text-center p-6 bg-blue-50 rounded-xl border-2 border-blue-100">
                      <div className="text-4xl font-bold text-blue-600">
                        {data.platformStats.totalUsers > 0
                          ? ((data.platformStats.dpdpaModuleUsers / data.platformStats.totalUsers) * 100).toFixed(1)
                          : 0}%
                      </div>
                      <p className="text-sm text-blue-700 font-medium mt-2">DPDPA Adoption</p>
                      <p className="text-xs text-gray-600 mt-1">Users with DPDPA Module</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Database className="h-6 w-6" />
                    Platform Health
                  </CardTitle>
                  <CardDescription>System-wide metrics and performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="font-semibold text-green-900">System Status</p>
                          <p className="text-sm text-green-700">All services operational</p>
                        </div>
                      </div>
                      <Badge className="bg-green-600 text-white border-0">
                        Healthy
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 border rounded-lg bg-white">
                        <p className="text-xs text-gray-600 mb-1">Total Banners</p>
                        <p className="text-2xl font-bold">{data.platformStats.totalCookieBanners}</p>
                      </div>
                      <div className="p-4 border rounded-lg bg-white">
                        <p className="text-xs text-gray-600 mb-1">Total Widgets</p>
                        <p className="text-2xl font-bold">{data.platformStats.totalDpdpaWidgets}</p>
                      </div>
                      <div className="p-4 border rounded-lg bg-white">
                        <p className="text-xs text-gray-600 mb-1">Total Scans</p>
                        <p className="text-2xl font-bold">{data.platformStats.totalCookieScans}</p>
                      </div>
                      <div className="p-4 border rounded-lg bg-white">
                        <p className="text-xs text-gray-600 mb-1">Rights Requests</p>
                        <p className="text-2xl font-bold">{data.platformStats.totalDpdpaRequests}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-6 border-t border-gray-200 mt-6">
            <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
              <Clock className="h-3 w-3" />
              Last updated: {new Date(data.timestamp).toLocaleString()}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
