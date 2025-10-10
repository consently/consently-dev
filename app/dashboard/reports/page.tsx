'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Download, TrendingUp, Users, Globe, Monitor } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

// Mock data
const trendData = [
  { date: '2025-09-01', granted: 320, denied: 82, withdrawn: 15 },
  { date: '2025-09-08', granted: 385, denied: 95, withdrawn: 12 },
  { date: '2025-09-15', granted: 412, denied: 88, withdrawn: 18 },
  { date: '2025-09-22', granted: 445, denied: 102, withdrawn: 14 },
  { date: '2025-09-29', granted: 498, denied: 115, withdrawn: 20 },
  { date: '2025-10-06', granted: 523, denied: 98, withdrawn: 16 },
];

const deviceData = [
  { name: 'Desktop', value: 6271, percentage: 50 },
  { name: 'Mobile', value: 5017, percentage: 40 },
  { name: 'Tablet', value: 1255, percentage: 10 },
];

const geographicData = [
  { country: 'India', consents: 8543, consentRate: 82 },
  { country: 'United States', consents: 2100, consentRate: 75 },
  { country: 'United Kingdom', consents: 1200, consentRate: 78 },
  { country: 'Germany', consents: 700, consentRate: 85 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('30');
  const [exportFormat, setExportFormat] = useState('pdf');

  const handleExport = () => {
    // Implement export logic
    const filename = `consent-report-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`;
    alert(`Exporting report as ${filename}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive insights into your consent management data
          </p>
        </div>
        <div className="flex gap-4">
          <Select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            options={[
              { value: 'pdf', label: 'PDF' },
              { value: 'csv', label: 'CSV' },
              { value: 'json', label: 'JSON' },
            ]}
          />
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Date Range:</label>
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              options={[
                { value: '7', label: 'Last 7 days' },
                { value: '30', label: 'Last 30 days' },
                { value: '90', label: 'Last 90 days' },
                { value: 'all', label: 'All time' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Consents</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,543</div>
            <p className="text-xs text-green-600 mt-1">↑ 12.5% vs last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Consent Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78.3%</div>
            <p className="text-xs text-green-600 mt-1">↑ 2.1% vs last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Countries</CardTitle>
            <Globe className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-gray-600 mt-1">Active regions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Devices</CardTitle>
            <Monitor className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-gray-600 mt-1">Device types tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Consent Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Consent Trends Over Time</CardTitle>
          <CardDescription>Track consent activities over the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#888" 
                fontSize={12}
                tickFormatter={(value) => format(new Date(value), 'MMM d')}
              />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
              />
              <Legend />
              <Line type="monotone" dataKey="granted" stroke="#10b981" strokeWidth={2} name="Granted" />
              <Line type="monotone" dataKey="denied" stroke="#ef4444" strokeWidth={2} name="Denied" />
              <Line type="monotone" dataKey="withdrawn" stroke="#f59e0b" strokeWidth={2} name="Withdrawn" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
            <CardDescription>Consent distribution by device type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }: any) => `${name}: ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {deviceData.map((device, index) => (
                <div key={device.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[index] }} />
                    <span className="text-gray-700">{device.name}</span>
                  </div>
                  <span className="font-medium">{device.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
            <CardDescription>Top countries by consent volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {geographicData.map((geo) => (
                <div key={geo.country}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{geo.country}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">{geo.consents.toLocaleString()}</span>
                      <span className="text-xs text-gray-600 ml-2">({geo.consentRate}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${geo.consentRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Consent Rate by Country</CardTitle>
          <CardDescription>Compare consent acceptance rates across regions</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={geographicData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="country" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} unit="%" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}
              />
              <Bar dataKey="consentRate" fill="#3b82f6" name="Consent Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
