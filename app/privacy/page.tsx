export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        
        <div className="prose prose-blue max-w-none">
          <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
          <p className="mb-4">
            We collect information you provide directly to us, including:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Account information (name, email, password)</li>
            <li>Website URLs and cookie scanning data</li>
            <li>Usage data and analytics</li>
            <li>Payment information (processed securely through third-party providers)</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Monitor and analyze trends and usage</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Information Sharing</h2>
          <p className="mb-4">
            We do not sell or rent your personal information. We may share information with:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Service providers who assist in our operations</li>
            <li>Law enforcement when required by law</li>
            <li>Other parties with your consent</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Security</h2>
          <p className="mb-4">
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized or unlawful processing and accidental loss, destruction, or damage.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Your Rights</h2>
          <p className="mb-4">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to processing of your data</li>
            <li>Export your data</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Cookies</h2>
          <p className="mb-4">
            We use cookies and similar technologies to improve your experience. You can control cookies through your browser settings.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Changes to This Policy</h2>
          <p className="mb-4">
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Contact Us</h2>
          <p className="mb-4">
            If you have questions about this Privacy Policy, please contact us at consently.project@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}
