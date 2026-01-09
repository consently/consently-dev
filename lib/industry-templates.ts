export interface DataCategoryWithRetention {
  categoryName: string;
  retentionPeriod: string;
}

export interface ActivityPurposeTemplate {
  purposeName: string;
  legalBasis: 'consent' | 'contract' | 'legal-obligation' | 'legitimate-interest';
  dataCategories: DataCategoryWithRetention[];
}

export interface ActivityTemplate {
  activity_name: string;
  purposes: ActivityPurposeTemplate[];
  data_sources: string[];
  data_recipients?: string[];
  // Legacy fields for backward compatibility
  purpose?: string;
  data_attributes?: string[];
  retention_period?: string;
  data_processors?: {
    sources: string[];
  };
  legalBasis?: string;
}

export interface IndustryTemplate {
  industry: string;
  name: string;
  description: string;
  icon: string;
  activities: ActivityTemplate[];
}

// NOTE: Templates are being migrated to new structure with purposes and data categories.
// New structure example shown in e-commerce templates above.
// TODO: Migrate remaining templates to new structure (banking, healthcare, etc.)
// Legacy templates still work but should be updated to match the pattern in Customer Registration and Order Processing.

export const industryTemplates: IndustryTemplate[] = [
  {
    industry: 'e-commerce',
    name: 'E-commerce',
    description: 'Online retail and marketplace operations',
    icon: '🛒',
    activities: [
      {
        activity_name: 'Customer Registration',
        purposes: [
          {
            purposeName: 'Account Management',
            legalBasis: 'consent',
            dataCategories: [
              { categoryName: 'Email', retentionPeriod: '3 years from last activity' },
              { categoryName: 'Name', retentionPeriod: '3 years from last activity' },
              { categoryName: 'Phone Number', retentionPeriod: '3 years from last activity' },
              { categoryName: 'Password Hash', retentionPeriod: '3 years from last activity' },
              { categoryName: 'Date of Birth', retentionPeriod: '3 years from last activity' },
              { categoryName: 'Gender', retentionPeriod: '3 years from last activity' },
            ],
          },
        ],
        data_sources: ['Website Registration Form', 'Mobile App', 'Social Login APIs'],
        data_recipients: ['Internal Teams', 'Cloud Storage Providers'],
      },
      {
        activity_name: 'Order Processing',
        purposes: [
          {
            purposeName: 'Transaction Processing',
            legalBasis: 'contract',
            dataCategories: [
              { categoryName: 'Order ID', retentionPeriod: '7 years for tax and accounting' },
              { categoryName: 'Product Details', retentionPeriod: '7 years for tax and accounting' },
              { categoryName: 'Quantity', retentionPeriod: '7 years for tax and accounting' },
              { categoryName: 'Email', retentionPeriod: '7 years for tax and accounting' },
              { categoryName: 'Phone Number', retentionPeriod: '7 years for tax and accounting' },
              { categoryName: 'Billing Address', retentionPeriod: '7 years for tax and accounting' },
              { categoryName: 'Shipping Address', retentionPeriod: '7 years for tax and accounting' },
            ],
          },
        ],
        data_sources: ['E-commerce Platform', 'Order Management System', 'Shipping Provider API'],
        data_recipients: ['Shipping Providers', 'Payment Processors', 'Accounting Software'],
      },
      {
        activity_name: 'Payment Processing',
        purposes: [
          {
            purposeName: 'Transaction Processing',
            legalBasis: 'legal-obligation',
            dataCategories: [
              { categoryName: 'Payment Method', retentionPeriod: '10 years for financial compliance' },
              { categoryName: 'Transaction ID', retentionPeriod: '10 years for financial compliance' },
              { categoryName: 'Amount', retentionPeriod: '10 years for financial compliance' },
              { categoryName: 'Currency', retentionPeriod: '10 years for financial compliance' },
              { categoryName: 'Payment Status', retentionPeriod: '10 years for financial compliance' },
              { categoryName: 'Card Last 4 Digits', retentionPeriod: '10 years for financial compliance' },
              { categoryName: 'Billing Address', retentionPeriod: '10 years for financial compliance' },
            ],
          },
          {
            purposeName: 'Security and Fraud Prevention',
            legalBasis: 'legitimate-interest',
            dataCategories: [
              { categoryName: 'Transaction ID', retentionPeriod: '10 years for financial compliance' },
              { categoryName: 'Payment Status', retentionPeriod: '10 years for financial compliance' },
              { categoryName: 'IP Address', retentionPeriod: '2 years' },
            ],
          },
        ],
        data_sources: ['Payment Gateway', 'Payment Processor', 'Fraud Detection Service'],
        data_recipients: ['Payment Processors', 'Banks', 'Fraud Detection Services'],
      },
      {
        activity_name: 'Marketing Communications',
        purposes: [
          {
            purposeName: 'Marketing and Advertising',
            legalBasis: 'consent',
            dataCategories: [
              { categoryName: 'Email', retentionPeriod: '2 years or until consent is withdrawn' },
              { categoryName: 'Name', retentionPeriod: '2 years or until consent is withdrawn' },
              { categoryName: 'Purchase History', retentionPeriod: '2 years or until consent is withdrawn' },
              { categoryName: 'Browsing Behavior', retentionPeriod: '2 years or until consent is withdrawn' },
              { categoryName: 'Preferences', retentionPeriod: '2 years or until consent is withdrawn' },
              { categoryName: 'Communication Opt-in Status', retentionPeriod: '2 years or until consent is withdrawn' },
            ],
          },
        ],
        data_sources: ['Email Marketing Platform', 'CRM System', 'Analytics Tools'],
        data_recipients: ['Email Service Providers', 'Marketing Platforms'],
      },
      {
        activity_name: 'Customer Support',
        purposes: [
          {
            purposeName: 'Customer Support',
            legalBasis: 'legitimate-interest',
            dataCategories: [
              { categoryName: 'Name', retentionPeriod: '5 years from last interaction' },
              { categoryName: 'Email', retentionPeriod: '5 years from last interaction' },
              { categoryName: 'Phone Number', retentionPeriod: '5 years from last interaction' },
              { categoryName: 'Order History', retentionPeriod: '5 years from last interaction' },
              { categoryName: 'Support Tickets', retentionPeriod: '5 years from last interaction' },
              { categoryName: 'Chat Transcripts', retentionPeriod: '5 years from last interaction' },
            ],
          },
        ],
        data_sources: ['Customer Support Portal', 'Live Chat System', 'Helpdesk Software'],
        data_recipients: ['Customer Support Team'],
      },
      {
        activity_name: 'Product Reviews & Ratings',
        purposes: [
          {
            purposeName: 'Product Improvement',
            legalBasis: 'legitimate-interest',
            dataCategories: [
              { categoryName: 'Name', retentionPeriod: 'Indefinitely or until review is removed' },
              { categoryName: 'Email', retentionPeriod: 'Indefinitely or until review is removed' },
              { categoryName: 'Review Text', retentionPeriod: 'Indefinitely or until review is removed' },
              { categoryName: 'Rating', retentionPeriod: 'Indefinitely or until review is removed' },
              { categoryName: 'Product ID', retentionPeriod: 'Indefinitely or until review is removed' },
              { categoryName: 'Purchase Verification', retentionPeriod: 'Indefinitely or until review is removed' },
            ],
          },
        ],
        data_sources: ['Review Management System', 'Website'],
        data_recipients: ['Public (Website Visitors)'],
      }
    ]
  },
  {
    industry: 'banking',
    name: 'Banking & Financial Services',
    description: 'Banking, lending, and financial institution operations',
    icon: '🏦',
    activities: [
      {
        activity_name: 'Account Opening',
        purposes: [],
        data_sources: ['Branch Application', 'Digital Onboarding Portal', 'Mobile Banking App'],
        purpose: 'To verify customer identity, establish banking relationships, and create customer accounts in compliance with regulatory requirements',
        data_attributes: ['Full Name', 'Date of Birth', 'Address', 'Phone Number', 'Email', 'PAN Card', 'Aadhaar Number', 'Photograph', 'Signature'],
        retention_period: '10 years after account closure',
        data_processors: {
          sources: ['Branch Application', 'Digital Onboarding Portal', 'Mobile Banking App']
        },
        legalBasis: 'legal-obligation'
      },
      {
        activity_name: 'KYC Verification',
        purposes: [],
        data_sources: [],
        purpose: 'To verify customer identity, prevent fraud, comply with anti-money laundering regulations, and maintain updated customer records',
        data_attributes: ['Identity Documents', 'Address Proof', 'PAN Card', 'Aadhaar', 'Biometric Data', 'Income Details', 'Source of Funds'],
        retention_period: '10 years after relationship ends',
        data_processors: {
          sources: ['KYC Platform', 'Document Verification Service', 'Video KYC System', 'CKYC Registry']
        },
        legalBasis: 'legal-obligation'
      },
      {
        activity_name: 'Transaction Processing',
        purposes: [],
        data_sources: [],
        purpose: 'To execute financial transactions, maintain account balances, generate statements, and provide banking services',
        data_attributes: ['Account Number', 'Transaction Amount', 'Date & Time', 'Transaction Type', 'Beneficiary Details', 'Location', 'Device Information'],
        retention_period: '10 years for regulatory compliance',
        data_processors: {
          sources: ['Core Banking System', 'Payment Gateway', 'NEFT/RTGS/IMPS Systems', 'ATM Network']
        },
        legalBasis: 'contract'
      },
      {
        activity_name: 'Credit Assessment',
        purposes: [],
        data_sources: [],
        purpose: 'To evaluate creditworthiness, determine loan eligibility, set credit limits, and make informed lending decisions',
        data_attributes: ['Income Details', 'Employment Information', 'Credit Score', 'Credit History', 'Assets', 'Liabilities', 'Bank Statements', 'Tax Returns'],
        retention_period: '7 years after loan settlement',
        data_processors: {
          sources: ['Credit Bureau', 'Loan Origination System', 'Income Verification Service']
        },
        legalBasis: 'contract'
      },
      {
        activity_name: 'Fraud Detection & Prevention',
        purposes: [],
        data_sources: [],
        purpose: 'To identify suspicious activities, prevent fraudulent transactions, protect customer accounts, and comply with security regulations',
        data_attributes: ['Transaction Patterns', 'Device Information', 'IP Address', 'Location Data', 'Biometric Data', 'Behavioral Analytics'],
        retention_period: '5 years from detection',
        data_processors: {
          sources: ['Fraud Detection System', 'Risk Analytics Platform', 'Security Monitoring Tools']
        },
        legalBasis: 'legal-obligation'
      },
      {
        activity_name: 'Customer Communication',
        purposes: [],
        data_sources: [],
        purpose: 'To send account alerts, transaction notifications, promotional offers, and important updates to customers',
        data_attributes: ['Name', 'Email', 'Phone Number', 'Account Details', 'Communication Preferences', 'Transaction History'],
        retention_period: '3 years from last communication',
        data_processors: {
          sources: ['SMS Gateway', 'Email Service', 'Mobile Banking App', 'CRM System']
        },
        legalBasis: 'legitimate-interest'
      }
    ]
  },
  {
    industry: 'healthcare',
    name: 'Healthcare',
    description: 'Medical services, hospitals, and healthcare providers',
    icon: '🏥',
    activities: [
      {
        activity_name: 'Patient Registration',
        purposes: [],
        data_sources: [],
        purpose: 'To register patients, create medical records, verify insurance eligibility, and establish patient-provider relationships',
        data_attributes: ['Full Name', 'Date of Birth', 'Gender', 'Address', 'Phone Number', 'Email', 'Emergency Contact', 'Insurance Details', 'Medical History'],
        retention_period: '10 years or as per medical regulations',
        data_processors: {
          sources: ['Hospital Management System', 'Patient Portal', 'Registration Desk']
        },
        legalBasis: 'contract'
      },
      {
        activity_name: 'Medical Records Management',
        purposes: [],
        data_sources: [],
        purpose: 'To maintain comprehensive medical records, track treatment history, enable continuity of care, and comply with healthcare regulations',
        data_attributes: ['Medical History', 'Diagnoses', 'Test Results', 'Prescriptions', 'Treatment Plans', 'Imaging Records', 'Physician Notes', 'Vital Signs'],
        retention_period: 'Lifetime or as per medical regulations',
        data_processors: {
          sources: ['Electronic Health Records System', 'Laboratory Information System', 'Radiology System']
        },
        legalBasis: 'legal-obligation'
      },
      {
        activity_name: 'Appointment Management',
        purposes: [],
        data_sources: [],
        purpose: 'To schedule patient appointments, send reminders, manage doctor availability, and optimize healthcare facility operations',
        data_attributes: ['Patient Name', 'Phone Number', 'Email', 'Appointment Date & Time', 'Doctor Name', 'Reason for Visit', 'Appointment Type'],
        retention_period: '5 years from appointment date',
        data_processors: {
          sources: ['Appointment Scheduling System', 'SMS Gateway', 'Email Service', 'Mobile App']
        },
        legalBasis: 'contract'
      },
      {
        activity_name: 'Prescription Management',
        purposes: [],
        data_sources: [],
        purpose: 'To generate, track, and manage patient prescriptions, ensure medication safety, and maintain prescription records',
        data_attributes: ['Patient Name', 'Date of Birth', 'Medication Name', 'Dosage', 'Duration', 'Doctor Name', 'Pharmacy Details', 'Allergies'],
        retention_period: '10 years from prescription date',
        data_processors: {
          sources: ['Prescription Management System', 'Electronic Prescribing System', 'Pharmacy Management System']
        },
        legalBasis: 'legal-obligation'
      },
      {
        activity_name: 'Billing & Insurance Claims',
        purposes: [],
        data_sources: [],
        purpose: 'To process medical bills, submit insurance claims, manage payments, and maintain financial records for healthcare services',
        data_attributes: ['Patient Name', 'Insurance Details', 'Treatment Codes', 'Billing Amount', 'Payment Status', 'Invoice Details', 'Claim Status'],
        retention_period: '7 years for tax and accounting purposes',
        data_processors: {
          sources: ['Billing System', 'Insurance Portal', 'Payment Gateway']
        },
        legalBasis: 'contract'
      },
      {
        activity_name: 'Telemedicine Services',
        purposes: [],
        data_sources: [],
        purpose: 'To provide remote healthcare consultations, enable virtual doctor visits, and deliver healthcare services digitally',
        data_attributes: ['Patient Name', 'Contact Details', 'Medical History', 'Video Consultation Records', 'Chat Transcripts', 'Digital Prescriptions'],
        retention_period: '10 years from consultation date',
        data_processors: {
          sources: ['Telemedicine Platform', 'Video Conferencing System', 'Cloud Storage']
        },
        legalBasis: 'consent'
      }
    ]
  },
  {
    industry: 'education',
    name: 'Education',
    description: 'Schools, universities, and online learning platforms',
    icon: '🎓',
    activities: [
      {
        activity_name: 'Student Enrollment',
        purposes: [],
        data_sources: [],
        purpose: 'To register students, verify eligibility, create student profiles, and maintain enrollment records',
        data_attributes: ['Full Name', 'Date of Birth', 'Address', 'Phone Number', 'Email', 'Parent/Guardian Details', 'Previous Education Records', 'Photograph'],
        retention_period: '10 years after graduation',
        data_processors: {
          sources: ['Student Information System', 'Admission Portal', 'Registration Office']
        },
        legalBasis: 'contract'
      },
      {
        activity_name: 'Academic Records Management',
        purposes: [],
        data_sources: [],
        purpose: 'To maintain student grades, attendance records, transcripts, and academic performance data',
        data_attributes: ['Student ID', 'Course Enrollment', 'Grades', 'Attendance', 'Test Scores', 'Assignment Submissions', 'Academic Achievements'],
        retention_period: 'Permanently or as per education regulations',
        data_processors: {
          sources: ['Learning Management System', 'Student Portal', 'Grading System']
        },
        legalBasis: 'legal-obligation'
      },
      {
        activity_name: 'Online Learning Platform',
        purposes: [],
        data_sources: [],
        purpose: 'To deliver educational content, track learning progress, facilitate online courses, and provide interactive learning experiences',
        data_attributes: ['Name', 'Email', 'Learning Progress', 'Course Completion', 'Quiz Results', 'Discussion Forum Posts', 'Video Watch History'],
        retention_period: '3 years from course completion',
        data_processors: {
          sources: ['E-Learning Platform', 'Content Delivery Network', 'Analytics Tools']
        },
        legalBasis: 'contract'
      },
      {
        activity_name: 'Fee Management',
        purposes: [],
        data_sources: [],
        purpose: 'To collect tuition fees, process payments, generate receipts, and maintain financial records for educational services',
        data_attributes: ['Student Name', 'Fee Structure', 'Payment Amount', 'Payment Method', 'Receipt Number', 'Due Dates', 'Payment Status'],
        retention_period: '7 years for accounting purposes',
        data_processors: {
          sources: ['Fee Management System', 'Payment Gateway', 'Accounting Software']
        },
        legalBasis: 'contract'
      },
      {
        activity_name: 'Parent-Teacher Communication',
        purposes: [],
        data_sources: [],
        purpose: 'To facilitate communication between parents and teachers, share student progress updates, and coordinate parent meetings',
        data_attributes: ['Student Name', 'Parent Name', 'Contact Details', 'Progress Reports', 'Meeting Schedules', 'Communication History'],
        retention_period: '5 years from student graduation',
        data_processors: {
          sources: ['Parent Portal', 'Mobile App', 'Email System', 'SMS Gateway']
        },
        legalBasis: 'legitimate-interest'
      },
      {
        activity_name: 'Library Management',
        purposes: [],
        data_sources: [],
        purpose: 'To manage library resources, track book borrowing, maintain member records, and provide library services',
        data_attributes: ['Student ID', 'Books Borrowed', 'Due Dates', 'Fine Status', 'Library Card Number', 'Reading History'],
        retention_period: '3 years after membership ends',
        data_processors: {
          sources: ['Library Management System', 'RFID System', 'Mobile App']
        },
        legalBasis: 'contract'
      }
    ]
  },
  {
    industry: 'real-estate',
    name: 'Real Estate',
    description: 'Property management, real estate agencies, and housing platforms',
    icon: '🏠',
    activities: [
      {
        activity_name: 'Property Listing Management',
        purposes: [],
        data_sources: [],
        purpose: 'To create and manage property listings, showcase properties to potential buyers/renters, and maintain property databases',
        data_attributes: ['Property Address', 'Property Type', 'Area', 'Price', 'Photos', 'Floor Plans', 'Amenities', 'Owner Contact'],
        retention_period: '2 years after listing removal',
        data_processors: {
          sources: ['Property Management System', 'Real Estate Portal', 'CRM System']
        },
        legalBasis: 'legitimate-interest'
      },
      {
        activity_name: 'Lead Management',
        purposes: [],
        data_sources: [],
        purpose: 'To capture and manage potential buyer/renter leads, track interactions, and facilitate property sales/rentals',
        data_attributes: ['Name', 'Phone Number', 'Email', 'Property Interest', 'Budget Range', 'Preferred Location', 'Communication History'],
        retention_period: '3 years from last contact',
        data_processors: {
          sources: ['CRM System', 'Website Form', 'Mobile App', 'Call Center']
        },
        legalBasis: 'consent'
      },
      {
        activity_name: 'Property Viewing Scheduling',
        purposes: [],
        data_sources: [],
        purpose: 'To schedule property viewings, coordinate with buyers and property owners, and manage viewing appointments',
        data_attributes: ['Viewer Name', 'Contact Details', 'Property ID', 'Viewing Date & Time', 'Agent Details', 'Feedback'],
        retention_period: '1 year from viewing date',
        data_processors: {
          sources: ['Scheduling System', 'Calendar Integration', 'SMS Gateway']
        },
        legalBasis: 'legitimate-interest'
      },
      {
        activity_name: 'Tenant Screening',
        purposes: [],
        data_sources: [],
        purpose: 'To verify tenant background, assess creditworthiness, check references, and make informed rental decisions',
        data_attributes: ['Full Name', 'ID Proof', 'Employment Details', 'Income Verification', 'Credit Score', 'Rental History', 'References'],
        retention_period: '7 years from application date',
        data_processors: {
          sources: ['Tenant Screening Service', 'Credit Bureau', 'Background Check Service']
        },
        legalBasis: 'consent'
      },
      {
        activity_name: 'Lease Agreement Management',
        purposes: [],
        data_sources: [],
        purpose: 'To create, execute, and manage rental agreements, track lease terms, and maintain legal documentation',
        data_attributes: ['Tenant Name', 'Property Address', 'Lease Term', 'Rent Amount', 'Deposit', 'Agreement Copy', 'Signatures', 'Renewal Status'],
        retention_period: '10 years after lease expiry',
        data_processors: {
          sources: ['Document Management System', 'E-Signature Platform', 'Property Management Software']
        },
        legalBasis: 'contract'
      },
      {
        activity_name: 'Maintenance Requests',
        purposes: [],
        data_sources: [],
        purpose: 'To handle property maintenance requests, coordinate repairs, track service providers, and ensure property upkeep',
        data_attributes: ['Tenant Name', 'Property Address', 'Issue Description', 'Request Date', 'Priority', 'Service Provider', 'Resolution Status'],
        retention_period: '5 years from resolution',
        data_processors: {
          sources: ['Maintenance Management System', 'Mobile App', 'Service Provider Portal']
        },
        legalBasis: 'contract'
      }
    ]
  },
  {
    industry: 'travel',
    name: 'Travel & Hospitality',
    description: 'Hotels, travel agencies, and booking platforms',
    icon: '✈️',
    activities: [
      {
        activity_name: 'Hotel Booking',
        purposes: [],
        data_sources: [],
        purpose: 'To process hotel reservations, manage room availability, collect guest information, and provide accommodation services',
        data_attributes: ['Guest Name', 'Phone Number', 'Email', 'Check-in Date', 'Check-out Date', 'Room Type', 'Number of Guests', 'Special Requests'],
        retention_period: '3 years from check-out',
        data_processors: {
          sources: ['Booking Engine', 'Property Management System', 'OTA Platforms']
        },
        legalBasis: 'contract'
      },
      {
        activity_name: 'Flight Booking',
        purposes: [],
        data_sources: [],
        purpose: 'To book flights, process ticketing, collect passenger information, and facilitate air travel arrangements',
        data_attributes: ['Passenger Name', 'Date of Birth', 'Passport Number', 'Nationality', 'Contact Details', 'Flight Details', 'Seat Preference', 'Meal Preference'],
        retention_period: '5 years for travel and tax records',
        data_processors: {
          sources: ['Global Distribution System', 'Airline Reservation System', 'Travel Booking Platform']
        },
        legalBasis: 'contract'
      },
      {
        activity_name: 'Travel Package Management',
        purposes: [],
        data_sources: [],
        purpose: 'To create and sell travel packages, coordinate multiple services, and provide comprehensive travel solutions',
        data_attributes: ['Traveler Name', 'Contact Details', 'Package Details', 'Travel Dates', 'Destination', 'Accommodation', 'Activities', 'Total Cost'],
        retention_period: '5 years from travel completion',
        data_processors: {
          sources: ['Travel Management System', 'CRM', 'Payment Gateway', 'Third-party Service Providers']
        },
        legalBasis: 'contract'
      },
      {
        activity_name: 'Guest Check-in Process',
        purposes: [],
        data_sources: [],
        purpose: 'To verify guest identity, collect required information, assign rooms, and complete the check-in procedure',
        data_attributes: ['Full Name', 'ID Proof', 'Address', 'Passport Details', 'Vehicle Number', 'Signature', 'Photo', 'Companion Details'],
        retention_period: '10 years as per hospitality regulations',
        data_processors: {
          sources: ['Property Management System', 'ID Scanner', 'Guest Portal']
        },
        legalBasis: 'legal-obligation'
      },
      {
        activity_name: 'Loyalty Program',
        purposes: [],
        data_sources: [],
        purpose: 'To reward frequent travelers, track points and rewards, provide personalized offers, and enhance customer retention',
        data_attributes: ['Membership ID', 'Name', 'Email', 'Phone Number', 'Travel History', 'Points Balance', 'Tier Status', 'Preferences'],
        retention_period: '5 years after membership termination',
        data_processors: {
          sources: ['Loyalty Management System', 'CRM', 'Mobile App', 'Email Marketing Platform']
        },
        legalBasis: 'consent'
      },
      {
        activity_name: 'Guest Feedback Collection',
        purposes: [],
        data_sources: [],
        purpose: 'To collect guest reviews and feedback, improve service quality, and maintain reputation management',
        data_attributes: ['Guest Name', 'Email', 'Booking ID', 'Rating', 'Review Text', 'Service Aspects', 'Response Status'],
        retention_period: '3 years from submission',
        data_processors: {
          sources: ['Feedback Management System', 'Review Platforms', 'Email Surveys']
        },
        legalBasis: 'legitimate-interest'
      }
    ]
  },
  {
    industry: 'telecom',
    name: 'Telecommunications',
    description: 'Telecom operators and service providers',
    icon: '📱',
    activities: [
      {
        activity_name: 'Customer Activation',
        purposes: [],
        data_sources: [],
        purpose: 'To activate mobile connections, verify customer identity as per DoT regulations, and provide telecom services',
        data_attributes: ['Full Name', 'Date of Birth', 'Address', 'Photo', 'Aadhaar Number', 'Alternative ID', 'Phone Number', 'Biometric Data'],
        retention_period: '10 years from service termination',
        data_processors: {
          sources: ['Customer Acquisition System', 'eKYC Platform', 'Biometric Device']
        },
        legalBasis: 'legal-obligation'
      },
      {
        activity_name: 'Call Detail Records (CDR)',
        purposes: [],
        data_sources: [],
        purpose: 'To maintain call records for billing, network management, legal compliance, and service quality monitoring',
        data_attributes: ['Caller Number', 'Receiver Number', 'Call Duration', 'Date & Time', 'Location (Cell Tower)', 'Call Type', 'Cost'],
        retention_period: '1 year as per TRAI regulations',
        data_processors: {
          sources: ['Billing System', 'Network Management System', 'CDR Storage']
        },
        legalBasis: 'legal-obligation'
      },
      {
        activity_name: 'Data Usage Tracking',
        purposes: [],
        data_sources: [],
        purpose: 'To monitor data consumption, provide fair usage policy compliance, and generate accurate bills for data services',
        data_attributes: ['Phone Number', 'Data Volume', 'Session Duration', 'Websites Visited (URL)', 'IP Address', 'Device Information', 'Location'],
        retention_period: '1 year from billing cycle',
        data_processors: {
          sources: ['Data Management System', 'Deep Packet Inspection', 'Billing Platform']
        },
        legalBasis: 'contract'
      },
      {
        activity_name: 'Billing & Payments',
        purposes: [],
        data_sources: [],
        purpose: 'To generate bills, process payments, manage account balances, and provide financial services to subscribers',
        data_attributes: ['Customer Name', 'Phone Number', 'Bill Amount', 'Payment Method', 'Transaction ID', 'Due Date', 'Payment History'],
        retention_period: '7 years for tax and accounting purposes',
        data_processors: {
          sources: ['Billing System', 'Payment Gateway', 'Bank Integration', 'Mobile Wallet']
        },
        legalBasis: 'contract'
      },
      {
        activity_name: 'Network Quality Management',
        purposes: [],
        data_sources: [],
        purpose: 'To monitor network performance, optimize coverage, troubleshoot issues, and improve service quality',
        data_attributes: ['Phone Number', 'Location Data', 'Signal Strength', 'Network Type', 'Call Drop Data', 'Speed Test Results', 'Device Model'],
        retention_period: '6 months from collection',
        data_processors: {
          sources: ['Network Monitoring System', 'Customer App', 'Network Optimization Tools']
        },
        legalBasis: 'legitimate-interest'
      },
      {
        activity_name: 'Customer Service & Support',
        purposes: [],
        data_sources: [],
        purpose: 'To handle customer queries, resolve complaints, provide technical support, and improve customer satisfaction',
        data_attributes: ['Customer Name', 'Phone Number', 'Account Details', 'Issue Description', 'Call Recordings', 'Chat Transcripts', 'Resolution Status'],
        retention_period: '3 years from case closure',
        data_processors: {
          sources: ['Call Center System', 'CRM', 'Ticketing System', 'Chat Platform']
        },
        legalBasis: 'legitimate-interest'
      }
    ]
  },
  {
    industry: 'other',
    name: 'Other Industries',
    description: 'Generic templates for other business types',
    icon: '🏢',
    activities: [
      {
        activity_name: 'User Registration',
        purposes: [],
        data_sources: [],
        purpose: 'To create user accounts, authenticate users, and provide access to services',
        data_attributes: ['Name', 'Email', 'Phone Number', 'Password Hash', 'Registration Date'],
        retention_period: '3 years from account closure',
        data_processors: {
          sources: ['Website', 'Mobile App', 'API']
        },
        legalBasis: 'consent'
      },
      {
        activity_name: 'Contact Form Submissions',
        purposes: [],
        data_sources: [],
        purpose: 'To handle customer inquiries, provide information, and facilitate communication',
        data_attributes: ['Name', 'Email', 'Phone Number', 'Message', 'Submission Date'],
        retention_period: '2 years from submission',
        data_processors: {
          sources: ['Website Contact Form', 'Email Service']
        },
        legalBasis: 'legitimate-interest'
      },
      {
        activity_name: 'Newsletter Subscription',
        purposes: [],
        data_sources: [],
        purpose: 'To send newsletters, updates, and marketing communications to subscribers',
        data_attributes: ['Email', 'Name', 'Subscription Date', 'Preferences', 'Opt-in Status'],
        retention_period: '2 years or until unsubscribe',
        data_processors: {
          sources: ['Email Marketing Platform', 'Website']
        },
        legalBasis: 'consent'
      }
    ]
  }
];

export const getLegalBasisLabel = (basis: string): string => {
  const labels: Record<string, string> = {
    'consent': 'Consent',
    'contract': 'Contract',
    'legal-obligation': 'Legal Obligation',
    'legitimate-interest': 'Legitimate Interest',
  };
  return labels[basis] || basis;
};

export const getIndustryLabel = (industry: string): string => {
  const template = industryTemplates.find(t => t.industry === industry);
  return template ? template.name : industry;
};

export const getIndustryIcon = (industry: string): string => {
  const template = industryTemplates.find(t => t.industry === industry);
  return template ? template.icon : '🏢';
};

// Helper to check if template uses new structure
export const isNewStructureTemplate = (template: ActivityTemplate): boolean => {
  return !!template.purposes && template.purposes.length > 0;
};

// Helper to intelligently map activity names to appropriate predefined purposes
const mapActivityToPurpose = (activityName: string, legalBasis?: string): string => {
  const activityLower = activityName.toLowerCase();
  
  // Map based on activity name keywords
  if (activityLower.includes('payment') || activityLower.includes('transaction') || activityLower.includes('billing')) {
    return 'Transaction Processing';
  }
  if (activityLower.includes('marketing') || activityLower.includes('promotional') || activityLower.includes('newsletter')) {
    return 'Marketing and Advertising';
  }
  if (activityLower.includes('support') || activityLower.includes('help') || activityLower.includes('service')) {
    return 'Customer Support';
  }
  if (activityLower.includes('account') || activityLower.includes('registration') || activityLower.includes('login') || activityLower.includes('profile')) {
    return 'Account Management';
  }
  if (activityLower.includes('analytics') || activityLower.includes('research') || activityLower.includes('analysis')) {
    return 'Analytics and Research';
  }
  if (activityLower.includes('security') || activityLower.includes('fraud') || activityLower.includes('prevention')) {
    return 'Security and Fraud Prevention';
  }
  if (activityLower.includes('legal') || activityLower.includes('compliance') || activityLower.includes('regulatory') || activityLower.includes('kyc')) {
    return 'Legal Compliance';
  }
  if (activityLower.includes('communication') || activityLower.includes('notification') || activityLower.includes('alert') || activityLower.includes('message')) {
    return 'Communication';
  }
  if (activityLower.includes('personalization') || activityLower.includes('personalize') || activityLower.includes('customize') || activityLower.includes('recommendation')) {
    return 'Personalization';
  }
  if (activityLower.includes('improvement') || activityLower.includes('review') || activityLower.includes('feedback') || activityLower.includes('rating')) {
    return 'Product Improvement';
  }
  
  // Default fallback based on legal basis
  if (legalBasis === 'legal-obligation') {
    return 'Legal Compliance';
  }
  if (legalBasis === 'contract') {
    return 'Transaction Processing';
  }
  
  // Ultimate fallback
  return 'Account Management';
};

// Helper to convert legacy template to new structure
export const convertLegacyTemplate = (template: ActivityTemplate): ActivityTemplate => {
  if (isNewStructureTemplate(template)) {
    return template; // Already in new format
  }

  // Intelligently map to predefined purpose
  const purposeName = mapActivityToPurpose(template.activity_name, template.legalBasis);
  
  // Convert legacy format to new structure
  return {
    activity_name: template.activity_name,
    purposes: [
      {
        purposeName,
        legalBasis: (template.legalBasis as any) || 'consent',
        dataCategories: (template.data_attributes || []).map((attr) => ({
          categoryName: attr,
          retentionPeriod: template.retention_period || '3 years from last activity',
        })),
      },
    ],
    data_sources: template.data_processors?.sources || [],
    data_recipients: [],
    // Keep legacy fields for backward compatibility
    purpose: template.purpose,
    data_attributes: template.data_attributes,
    retention_period: template.retention_period,
    data_processors: template.data_processors,
    legalBasis: template.legalBasis,
  };
};
