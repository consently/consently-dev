import {
  Building2,
  Hotel,
  Landmark,
  Stethoscope,
  LayoutGrid,
  Factory,
  Plane,
  ShoppingCart,
  Store,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

const sectors = [
  {
    title: 'Hospitality',
    icon: <Hotel className="h-6 w-6" />,
    description: 'Manage guest data consent for bookings, loyalty programs, and check-ins while ensuring DPDPA compliance.',
    href: '/sectors/hospitality',
  },
  {
    title: 'Real Estate',
    icon: <Building2 className="h-6 w-6" />,
    description: 'Secure property buyer data and manage consent for marketing communications and property listings.',
    href: '/sectors/real-estate',
  },
  {
    title: 'Banking & NBFC',
    icon: <Landmark className="h-6 w-6" />,
    description: 'Bank-grade consent management for sensitive financial data. Compliant with RBI guidelines and DPDPA.',
    href: '/sectors/banking',
  },
  {
    title: 'Healthcare',
    icon: <Stethoscope className="h-6 w-6" />,
    description: 'Protect patient confidentiality and manage health data consent with strict adherence to data fiduciary obligations.',
    href: '/sectors/healthcare',
  },
  {
    title: 'SaaS Companies',
    icon: <LayoutGrid className="h-6 w-6" />,
    description: 'Automate cookie scanning and manage user consent for your software platforms. The ideal choice for B2B SaaS.',
    href: '/sectors/saas',
  },
  {
    title: 'Manufacturing',
    icon: <Factory className="h-6 w-6" />,
    description: 'Streamline employee and vendor data processing consent across your supply chain and factory operations.',
    href: '/sectors/manufacturing',
  },
  {
    title: 'Tourism',
    icon: <Plane className="h-6 w-6" />,
    description: 'Handle traveler data responsibly. Perfect for travel agencies needing DPDPA consent management.',
    href: '/sectors/tourism',
  },
  {
    title: 'E-commerce Retail',
    icon: <ShoppingCart className="h-6 w-6" />,
    description: ' Seamless consent for shopper data, cookies, and marketing. Boost trust and reduce cart abandonment.',
    href: '/sectors/ecommerce',
  },
  {
    title: 'Retail Sector',
    icon: <Store className="h-6 w-6" />,
    description: 'Unified consent management for offline stores and digital channels. protect customer loyalty program data.',
    href: '/sectors/retail',
  },
];

export function SectorSolutions() {
  return (
    <section className="py-16 sm:py-20 bg-gray-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            DPDPA Compliance for Every Sector
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Tailored solutions to meet the unique compliance challenges of your industry.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {sectors.map((sector) => (
            <div
              key={sector.title}
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all border border-gray-100 group"
            >
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {sector.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                {sector.title}
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {sector.description}
              </p>
              {/* <Link // Commented out until pages exist
                href={sector.href}
                className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700 transition-colors"
              >
                Learn more <ArrowRight className="ml-2 h-4 w-4" />
              </Link> */}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
