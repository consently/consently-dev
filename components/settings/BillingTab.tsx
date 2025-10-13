import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Download } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import type { Subscription } from '@/types/settings';

interface BillingTabProps {
  subscription: Subscription | null;
}

export function BillingTab({ subscription }: BillingTabProps) {
  // Mock billing history - in production, fetch from API
  const billingHistory = [
    { id: '1', date: '2025-10-01', amount: 2499, status: 'Paid' as const },
    { id: '2', date: '2025-09-01', amount: 2499, status: 'Paid' as const },
    { id: '3', date: '2025-08-01', amount: 2499, status: 'Paid' as const },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-gray-600" />
            <CardTitle>Current Plan</CardTitle>
          </div>
          <CardDescription>Manage your subscription and billing</CardDescription>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div>
                  <p className="font-semibold text-lg text-gray-900">{subscription.plan_name}</p>
                  <p className="text-gray-600 mt-1">
                    Status: <span className="font-medium capitalize">{subscription.status}</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Next billing: {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatINR(subscription.amount)}
                  </p>
                  <p className="text-sm text-gray-600">/month</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline">Change Plan</Button>
                {!subscription.cancel_at_period_end && (
                  <Button variant="outline" className="text-red-600 hover:text-red-700">
                    Cancel Subscription
                  </Button>
                )}
              </div>

              {subscription.cancel_at_period_end && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Notice:</strong> Your subscription will be cancelled at the end of the current billing period 
                    ({new Date(subscription.current_period_end).toLocaleDateString()}).
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">You don't have an active subscription</p>
              <Button>Choose a Plan</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Your recent invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
          {billingHistory.length > 0 ? (
            <div className="space-y-3">
              {billingHistory.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(invoice.date).toLocaleDateString('en-IN', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-gray-600">{formatINR(invoice.amount)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {invoice.status}
                    </span>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No billing history available</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Manage your payment information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">No payment method on file</p>
            <Button variant="outline">Add Payment Method</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
