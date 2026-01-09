import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy - Consently",
  description: "Learn about how Consently uses cookies and similar tracking technologies to enhance your experience.",
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Cookie Policy</h1>
        
        <div className="prose prose-blue max-w-none">
          <p className="text-gray-600 mb-4">Last Updated: 01/12/25</p>
          
          <p className="mb-6">
            Consently (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) uses cookies and similar tracking technologies to enhance your experience, improve our platform performance, and ensure secure and personalised services.
          </p>
          <p className="mb-6">
            This Cookie Policy explains what cookies are, how we use them, and the choices you have.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. What Are Cookies?</h2>
          <p className="mb-4">
            Cookies are small text files stored on your device when you visit a website or use an app. They help websites remember your actions and preferences, enabling smoother and more personalised experiences.
          </p>
          <p className="mb-4">
            We also use technologies like pixels, tags, beacons, and local storage, which function similarly to cookies.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Types of Cookies We Use</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">a. Essential / Necessary Cookies</h3>
          <p className="mb-4">
            These cookies are required for the website or platform to function properly.
          </p>
          <p className="mb-2">They include:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Login authentication</li>
            <li>Session management</li>
            <li>Security and fraud prevention</li>
          </ul>
          <p className="mb-4 font-medium text-gray-700">
            You cannot opt out of these cookies.
          </p>

          <hr className="my-6 border-gray-100" />

          <h3 className="text-xl font-semibold mt-6 mb-3">b. Analytics Cookies</h3>
          <p className="mb-4">
            These cookies help us understand how users interact with Consently.
          </p>
          <p className="mb-2">They allow us to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Analyse traffic and usage patterns</li>
            <li>Improve platform performance</li>
            <li>Detect technical issues</li>
          </ul>
          <p className="mb-4 text-gray-600">
            We may use tools such as Google Analytics or similar services.
          </p>

          <hr className="my-6 border-gray-100" />

          <h3 className="text-xl font-semibold mt-6 mb-3">c. Functional Cookies</h3>
          <p className="mb-4">
            These cookies enhance your experience by remembering:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Your settings and preferences</li>
            <li>Language choices</li>
            <li>Your last actions on the platform</li>
          </ul>

          <hr className="my-6 border-gray-100" />

          <h3 className="text-xl font-semibold mt-6 mb-3">d. Marketing & Advertising Cookies</h3>
          <p className="mb-4">
            These cookies help us deliver relevant ads and measure their effectiveness.
          </p>
          <p className="mb-2">They may track:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Browsing behavior</li>
            <li>Engagement with ads or campaigns</li>
            <li>Referral sources</li>
          </ul>
          <p className="mb-4 text-gray-600">
            We may work with trusted third-party advertising partners for this purpose.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Third-Party Cookies</h2>
          <p className="mb-4">
            Some cookies on Consently are placed by third-party service providers such as analytics, cloud storage, or advertising partners.
          </p>
          <p className="mb-4">
            These third parties may process data according to their own privacy policies.
          </p>
          <p className="mb-4">
            We ensure that all such partners comply with applicable data protection laws, including the Digital Personal Data Protection Act (DPDPA), 2023.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. How We Use Cookies</h2>
          <p className="mb-2">Consently uses cookies to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide secure user authentication</li>
            <li>Track usage and improve platform features</li>
            <li>Personalize your experience</li>
            <li>Deliver relevant content and marketing</li>
            <li>Ensure compliance with legal obligations</li>
          </ul>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Your Choices and Control</h2>
          <p className="mb-4">You can manage your cookie preferences through:</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">a. Browser Settings</h3>
          <p className="mb-2">Most browsers allow you to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Block cookies</li>
            <li>Delete cookies</li>
            <li>Receive alerts before cookies are stored</li>
          </ul>
          <p className="mb-4 text-gray-600">
            Disabling some cookies may affect platform performance or restrict access to certain features.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">b. Consent Banner</h3>
          <p className="mb-4">
            When you visit Consently, you may see a cookie banner that allows you to accept or manage cookie preferences.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">c. Opt-Out Tools</h3>
          <p className="mb-2">For analytics and advertising cookies, you may opt out using:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <a 
                href="https://tools.google.com/dlpage/gaoptout" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Google Analytics Opt-Out Add-On
              </a>
            </li>
            <li>Your device&apos;s ad-tracking settings</li>
          </ul>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Data Retention</h2>
          <p className="mb-4">Cookies remain on your device for varying durations:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Session cookies</strong> are deleted when you close your browser.</li>
            <li><strong>Persistent cookies</strong> remain until they expire or are manually deleted.</li>
          </ul>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Updates to This Policy</h2>
          <p className="mb-4">
            We may update this Cookie Policy from time to time.
          </p>
          <p className="mb-4">
            If significant changes are made, we will notify you through our platform or email.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Contact Us</h2>
          <p className="mb-4">
            For any questions regarding our Cookie Policy or data practices, you can reach us at:
          </p>
          <p className="mb-4">
            <a 
              href="mailto:Dpo@consently.in" 
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              📧 Dpo@consently.in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

