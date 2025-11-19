# Admin Panel Documentation

## Overview

The Consently Admin Panel is a secure, modern dashboard with sidebar navigation for platform administrators to monitor and manage all users, subscriptions, and module usage across the platform.

## Design System

The admin panel follows Consently's design system with:
- **Clean blue theme**: Primary color #2563eb (blue-600)
- **Professional layout**: Persistent sidebar with tab-based navigation
- **Responsive design**: Mobile-friendly with hamburger menu
- **Consistent UI**: Matches dashboard design patterns

## Access

### URL
- **Production**: `https://your-domain.com/admin`
- **Local Development**: `http://localhost:3000/admin`

### Authentication

The admin panel uses **HTTP Basic Authentication** with hardcoded credentials for security.

#### Default Credentials
- **Username**: `admin@consently.in`
- **Password**: `C0n$ently@dm!n2024#Secure`

> **⚠️ Security Note**: For production environments, it's recommended to set these credentials via environment variables:
> - `ADMIN_USERNAME` - Override the default admin username
> - `ADMIN_PASSWORD` - Override the default admin password

#### Setting Custom Credentials

Add these to your `.env.local` or environment configuration:

```bash
ADMIN_USERNAME=your_custom_admin@email.com
ADMIN_PASSWORD=YourSecurePasswordHere123!
```

## Navigation Structure

### Sidebar Layout
The admin panel features a persistent sidebar (desktop) or collapsible menu (mobile) with:

#### Navigation Tabs
1. **Overview** - Platform-wide metrics and system health
2. **Users** - Comprehensive user management with search and filters
3. **Activity** - Real-time activity timeline
4. **Analytics** - Conversion metrics and adoption rates

#### Sidebar Footer
- Quick stats: Total users and monthly consents
- Logout button for easy access

### Mobile Experience
- Hamburger menu for mobile devices
- Full-screen sidebar overlay
- Touch-friendly navigation
- Responsive card layouts

## Features

### Overview Dashboard

Platform-wide metrics at a glance:

#### Key Metrics Cards
- **Total Users**: User count with weekly growth indicator
- **Monthly Revenue**: Estimated revenue from active subscriptions
- **Active Trials**: Current trial users with expiration count
- **Consents This Month**: Current month consent totals with all-time comparison

### Module Performance Section

The admin panel displays comprehensive platform-wide metrics:

#### User Metrics
- **Total Users**: Total number of registered users
- **Active Trials**: Users currently on trial (30-day free trial)
- **Expired Trials**: Users whose trial period has ended
- **Paid Subscriptions**: Active paying customers
- **Demo Accounts**: Special demo/test accounts

#### Module Adoption
- **Cookie Module Users**: Users actively using the cookie consent module
- **DPDPA Module Users**: Users actively using the DPDPA compliance module
- **Both Modules**: Users utilizing both modules simultaneously

#### Consent Metrics
- **Monthly Consents**: Total consents recorded this month
- **Total Consents**: All-time consent records
- **Cookie Scans**: Total cookie scanning operations
- **Processing Activities**: Total DPDPA processing activities

#### Recent Activity Widget
24-hour summary showing:
- New user signups
- Consent collection totals
- Active trial status

### User Management Tab

Advanced user search and management:

#### Search & Filter Bar
- **Search Box**: Real-time search by email, name, or user ID with icon
- **Plan Filter**: Dropdown to filter by Small, Medium, Enterprise, or All Plans
- **Status Filter**: Dropdown to filter by Active Trials, Paid Users, Demo Accounts
- **Clear All Button**: Quick reset of all filters

#### User Card Display
Each user displays in a modern card with hover effects:

**Basic Information**
- Email address
- Full name
- Registration date
- Demo account status
- Authentication provider

**Subscription Details**
- Current plan (Free, Small, Medium, Enterprise)
- Trial status (Active/Expired/None)
- Days remaining in trial
- Billing cycle
- Subscription amount

**Cookie Module Metrics**
- Number of banners created
- Active banners
- Total cookie scans performed
- Total consents collected
- Monthly consents
- Last scan date

**DPDPA Module Metrics**
- Number of widgets created
- Active widgets
- Processing activities defined
- Active processing activities
- Total consents collected
- Monthly consents
- Total rights requests
- Pending requests

### Activity Timeline Tab

Real-time activity feed displaying:

#### Timeline View
- **Visual Timeline**: Dot indicators with connecting lines
- **Animated Indicators**: Pulsing dot for most recent activity
- **User Actions**: Email and activity summary for each user
- **Timestamps**: Date information for each activity
- **Activity Summary**: Consent collection highlights
- **10 Latest Entries**: Most recent platform activities

#### Activity Types Tracked
- New user registrations
- Consent collection events
- Module usage activities
- Trial status changes

### Analytics Dashboard Tab

Comprehensive analytics and insights:

#### Conversion Metrics
Three key performance cards:
- **Conversion Rate**: Trial to paid subscription percentage
- **Cookie Adoption**: Percentage of users with Cookie module
- **DPDPA Adoption**: Percentage of users with DPDPA module

#### Platform Health Section
- **System Status Card**: Green/healthy indicator with operational status
- **Resource Metrics Grid**: 
  - Total Banners created
  - Total Widgets configured
  - Total Cookie Scans performed
  - Total Rights Requests submitted

#### Visual Design
- Clean blue-themed cards matching brand
- Large percentage displays for quick scanning
- Descriptive subtitles for context
- Healthy/operational status badges

## Trial Period Features

### 30-Day Free Trial

All new users receive a **30-day free trial** with full enterprise-level access:

#### Trial Benefits
1. **Unlimited Consents**: No monthly consent limits during trial
2. **Full Cookie Scanning**: Deep scan capabilities (up to 50 pages)
3. **All Features**: Complete access to both Cookie and DPDPA modules
4. **No Credit Card Required**: Start trial instantly

#### Trial Status Indicators
- 🕒 **Active Trial**: Shows days remaining
- ❌ **Expired Trial**: Trial period ended
- No icon: User never started a trial

### Post-Trial Behavior

After the 30-day trial expires:
- User automatically reverts to their subscription plan limits
- Free plan: 5,000 consents/month, shallow scanning only
- Paid plans retain their respective limits
- No data is lost - all historical data remains accessible

## API Endpoint

The admin panel fetches data from a protected API endpoint:

### GET `/api/admin/dashboard`

#### Authentication
Requires HTTP Basic Authentication header:
```
Authorization: Basic base64(username:password)
```

#### Response Structure
```json
{
  "success": true,
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "subscription": {
        "plan": "small",
        "status": "active",
        "is_trial": true,
        "trial_days_left": 15,
        "trial_status": "active"
      },
      "cookieModule": {
        "banners": 2,
        "activeBanners": 1,
        "totalScans": 10,
        "totalConsents": 1500,
        "monthlyConsents": 500
      },
      "dpdpaModule": {
        "widgets": 1,
        "activeWidgets": 1,
        "processingActivities": 5,
        "totalConsents": 800,
        "monthlyConsents": 200,
        "totalRequests": 10,
        "pendingRequests": 2
      }
    }
  ],
  "platformStats": {
    "totalUsers": 150,
    "activeTrials": 25,
    "paidSubscriptions": 40,
    "totalConsentsThisMonth": 50000
  },
  "timestamp": "2024-11-19T10:00:00Z"
}
```

## Security Considerations

### Authentication
- Uses HTTP Basic Authentication for simplicity
- Credentials stored securely in environment variables
- Session-based authentication with sessionStorage
- Automatic logout on credential expiry

### Data Access
- Read-only access to user data
- No ability to modify or delete data from the panel
- All database queries use RLS (Row Level Security) policies
- CORS not enabled for admin endpoints

### Recommendations for Production

1. **Use Environment Variables**: Never commit credentials to version control
2. **Strong Passwords**: Use complex passwords with special characters
3. **IP Whitelisting**: Consider restricting access by IP address
4. **HTTPS Only**: Ensure the admin panel is only accessible via HTTPS
5. **Regular Password Rotation**: Change admin credentials periodically
6. **Audit Logging**: Monitor access to the admin panel

## Auto-Refresh

The dashboard automatically refreshes data every **30 seconds** when authenticated, ensuring real-time visibility into platform metrics.

## Logout

Click the "Logout" button in the top-right corner to:
- Clear authentication credentials from sessionStorage
- Return to the login screen
- Require re-authentication for next access

## Troubleshooting

### Cannot Login
- Verify credentials are correct
- Check if environment variables are set properly
- Ensure the API route is accessible

### Data Not Loading
- Check browser console for errors
- Verify Supabase connection
- Ensure database tables have proper RLS policies

### Missing User Data
- Verify the user has completed onboarding
- Check if the user has created widgets/banners
- Ensure database queries are not filtered incorrectly

## Technical Implementation

### Frontend
- **Framework**: Next.js 14 with App Router
- **UI Components**: Shadcn UI components (Card, Button, Badge, Input, Tabs)
- **Layout**: Sidebar navigation with tab-based content switching
- **State Management**: React hooks (useState, useEffect)
- **Authentication**: Session-based with sessionStorage
- **Design System**: Blue theme (#2563eb) matching Consently brand
- **Responsive**: Mobile-first with hamburger menu and collapsible sidebar
- **Icons**: Lucide React for consistent iconography

### Backend
- **API Route**: `/app/api/admin/dashboard/route.ts`
- **Database**: Supabase PostgreSQL
- **Authentication**: HTTP Basic Auth
- **Security**: Environment-based credentials

### Database Tables Accessed
- `users` - User profiles and account info
- `subscriptions` - Subscription and trial data
- `cookie_banners` - Cookie module banners
- `cookie_scans` - Cookie scanning history
- `consent_logs` - Cookie consent records
- `dpdpa_widget_configs` - DPDPA widgets
- `processing_activities` - DPDPA processing activities
- `dpdpa_consent_records` - DPDPA consent records
- `dpdp_rights_requests` - Data subject rights requests

## UI/UX Highlights

### Design Improvements
- **Consistent Branding**: Blue theme (#2563eb) throughout
- **Card-Based Layout**: Modern card design with hover effects
- **Visual Hierarchy**: Clear information structure with proper spacing
- **Badge System**: Color-coded badges for plan types and status
- **Icon Integration**: Contextual icons for better visual communication
- **Responsive Grid**: Adaptive layouts for all screen sizes
- **Loading States**: Smooth loading animations and spinners

### User Experience Features
- **Quick Navigation**: Sidebar access to all major sections
- **Real-time Search**: Instant filtering as you type
- **Smart Filters**: Multiple filter combinations for precise results
- **Auto-refresh**: Background data updates every 30 seconds
- **Mobile Optimized**: Touch-friendly controls and full-screen modals
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Clear Actions**: Prominent refresh, export, and logout buttons

### Performance Optimizations
- **Efficient Rendering**: Component-level state management
- **Lazy Loading**: On-demand data fetching
- **Cached Sessions**: Persistent authentication state
- **Optimized Queries**: Efficient database access patterns

## Future Enhancements

Potential features for future versions:
- User management actions (suspend, activate, delete)
- Manual trial extension capabilities
- In-panel subscription plan changes
- Advanced revenue analytics and charts
- Export data to CSV/Excel/PDF
- Advanced filtering with date ranges
- Email notification system for admins
- Detailed activity audit logs
- Custom date range selection
- Detailed user drill-down pages with history
- Bulk user operations
- Real-time websocket updates
- Dark mode toggle
- Customizable dashboard layouts

## Support

For issues or questions regarding the admin panel:
- Check the troubleshooting section above
- Review application logs for errors
- Contact the development team

