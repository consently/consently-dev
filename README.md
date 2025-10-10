# 🛡️ Consently - DPDPA 2023 Consent Manager

[![License](https://img.shields.io/badge/License-Proprietary-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)

A comprehensive, enterprise-grade SaaS platform designed to help Indian businesses achieve seamless compliance with the Digital Personal Data Protection Act (DPDPA) 2023. Built with modern web technologies and privacy-by-design principles.

## 🚀 Key Features

### 🍪 Cookie Consent Management
- Automatic cookie scanning and classification
- Real-time cookie banner customization
- GDPR & DPDPA compliant consent mechanisms
- Granular cookie category management

### 📋 DPDPA Compliance Suite
- Pre-built industry-specific consent templates
- Data processing activity records (DPAR)
- Consent lifecycle management
- Legal basis tracking and documentation

### 📊 Analytics & Reporting
- Real-time compliance dashboards
- Consent rate analytics and optimization
- Detailed audit trails with exportable reports
- Custom compliance reports for legal teams

### 🌐 Multi-language & Accessibility
- Support for 22 Indian languages
- WCAG 2.1 AA accessibility compliance
- RTL language support
- Mobile-responsive consent widgets

### 🔒 Privacy & Security
- End-to-end encryption (AES-256)
- Email tokenization for privacy protection
- Row-level security (RLS) on all data
- OWASP Top 10 security compliance
- SOC 2 Type II controls implementation

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19 with TypeScript 5+
- **Styling**: Tailwind CSS v4 with custom design system
- **Components**: Custom UI components with accessibility features
- **Icons**: Lucide React (consistent iconography)
- **Forms**: React Hook Form + Zod validation
- **State Management**: Zustand for client state

### Backend & Infrastructure
- **Database**: Supabase (PostgreSQL 15+)
- **Authentication**: Supabase Auth with OAuth2/JWT
- **Real-time**: Supabase Realtime subscriptions
- **File Storage**: Supabase Storage (S3-compatible)
- **API**: RESTful APIs with Next.js Route Handlers

### Payment & Integrations
- **Payment Gateway**: Razorpay (Indian market focus)
- **Email Service**: Integration-ready (SendGrid/SES)
- **Analytics**: Custom privacy-focused analytics
- **CDN**: Vercel Edge Network

## 📋 Prerequisites

Ensure you have the following installed and configured:

- **Node.js**: Version 18+ (recommend v20 LTS)
- **npm**: Version 9+ (or yarn/pnpm)
- **Git**: For version control
- **Supabase Account**: [Create account](https://supabase.com)
- **Razorpay Account**: For payment processing (Indian businesses)

### Optional Requirements
- **Vercel Account**: For deployment
- **Custom Domain**: For production deployment
- **Email Service**: SendGrid, AWS SES, or similar

## 🔧 Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd consently-dev
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your credentials
3. Run the SQL schema:
   - Go to SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `supabase/schema.sql`
   - Execute the SQL

### 4. Configure OAuth Providers (Optional)

In your Supabase dashboard:
- Go to Authentication > Providers
- Enable Google, Twitter, and Apple providers
- Add your OAuth credentials

### 5. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Update the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
consently-dev/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── dashboard/         # Dashboard pages
│   ├── setup/             # Setup modules
│   └── settings/          # Settings pages
├── components/            # Reusable components
│   └── ui/               # UI components
├── lib/                  # Utilities and helpers
│   ├── supabase/        # Supabase clients
│   └── utils.ts         # Utility functions
├── types/               # TypeScript types
├── supabase/           # Supabase SQL schemas
└── public/             # Static assets
```

## 🎨 Color Theme

The platform uses a trustworthy blue & white color scheme:

- **Primary Blue**: `hsl(217 91% 60%)` - Main brand color
- **Light Blue**: `hsl(214 100% 97%)` - Secondary elements
- **White**: `hsl(0 0% 100%)` - Backgrounds
- **Gray**: Various shades for text and borders

## 📦 Subscription Plans

- **Small**: ₹999/month - Up to 10,000 consents/month
- **Medium**: ₹2,499/month - Up to 100,000 consents/month
- **Enterprise**: Custom pricing - Unlimited consents

## 🔒 Security Features

- Row Level Security (RLS) enabled on all tables
- Email tokenization for privacy
- AES-256 encryption at rest
- TLS 1.3 encryption in transit
- OWASP Top 10 compliance

## 📝 License

© 2025 Consently. All rights reserved.

## 🤝 Support

For support, email support@consently.app or create an issue in the repository.

## 🚀 Deployment to Vercel

### Prerequisites
- GitHub/GitLab account
- Vercel account (free tier available)
- Supabase project set up

### Step 1: Prepare Your Repository

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your repository
4. Configure your project:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### Step 3: Configure Environment Variables

In Vercel project settings, add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### Step 4: Deploy

Click "Deploy" and wait for the build to complete (usually 2-3 minutes).

### Step 5: Configure Custom Domain (Optional)

1. Go to Project Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_SITE_URL` environment variable

### Step 6: Update Supabase Auth Settings

1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Add your Vercel domain to "Site URL"
3. Add `https://your-domain.vercel.app/auth/callback` to "Redirect URLs"

## 🔄 Continuous Deployment

Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

## 🚧 Development Status

✅ **Production Ready** - Core DPDPA compliance features implemented and tested

### Current Version: v1.0.0

#### ✅ Completed Features
- ✅ User authentication and authorization
- ✅ Cookie consent management system
- ✅ DPDPA compliance dashboard
- ✅ Multi-language support
- ✅ Payment integration (Razorpay)
- ✅ Audit logging and reporting
- ✅ Email notification system
- ✅ Responsive widget implementation

#### 🚧 In Development
- 🔄 Advanced analytics dashboard
- 🔄 API documentation portal
- 🔄 Third-party integrations
- 🔄 Mobile application

#### 📋 Roadmap
- 📅 Q1 2025: Advanced reporting features
- 📅 Q2 2025: Enterprise SSO integration
- 📅 Q3 2025: AI-powered compliance recommendations

For detailed feature specifications, see documentation in `docs/` directory.
