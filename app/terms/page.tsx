export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        
        <div className="prose prose-blue max-w-none">
          <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing and using Consently, you accept and agree to be bound by the terms and provision of this agreement.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Use License</h2>
          <p className="mb-4">
            Permission is granted to temporarily use Consently for personal or commercial purposes. This is the grant of a license, not a transfer of title.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Service Description</h2>
          <p className="mb-4">
            Consently provides cookie consent management and compliance tools for websites. We reserve the right to modify or discontinue services at any time.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. User Accounts</h2>
          <p className="mb-4">
            You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Payment Terms</h2>
          <p className="mb-4">
            Certain features require payment. You agree to pay all fees and charges associated with your subscription plan.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Limitation of Liability</h2>
          <p className="mb-4">
            Consently shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of the service.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Contact</h2>
          <p className="mb-4">
            If you have any questions about these Terms, please contact us at consently.project@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}
