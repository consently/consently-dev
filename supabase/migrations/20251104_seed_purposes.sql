-- Migration: Seed Predefined Purposes for All Industries
-- Date: 2025-11-04
-- Description: Insert all predefined purposes from different industries into the purposes table

-- Delete existing predefined purposes (optional - only if you want a fresh start)
-- DELETE FROM purposes WHERE is_predefined = TRUE;

-- Insert all predefined purposes
INSERT INTO purposes (purpose_name, description, is_predefined) VALUES
  -- E-commerce Purposes
  ('Enable Order Tracking', 'Track and monitor customer orders throughout the fulfillment process', TRUE),
  ('Personalize User Experience', 'Customize the shopping experience based on user preferences and behavior', TRUE),
  ('Manage Billing & Payments', 'Process payments, generate invoices, and maintain billing records', TRUE),
  ('Send Marketing Communications', 'Send promotional content, newsletters, and personalized offers to customers', TRUE),
  ('Provide Customer Support', 'Handle customer inquiries, resolve issues, and improve satisfaction', TRUE),
  ('Prevent Fraud & Ensure Security', 'Detect and prevent fraudulent activities and unauthorized access', TRUE),

  -- Banking Purposes
  ('Account Management & Transactions', 'Create, maintain, and manage user accounts and financial transactions', TRUE),
  ('KYC & Identity Verification', 'Verify customer identity and comply with Know Your Customer regulations', TRUE),
  ('Credit Assessment & Loan Processing', 'Evaluate creditworthiness and process loan applications', TRUE),
  ('Fraud Detection & Prevention', 'Monitor transactions to detect and prevent fraudulent activities', TRUE),
  ('Regulatory Compliance', 'Comply with financial regulations, AML, and other legal requirements', TRUE),
  ('Customer Communications & Alerts', 'Send account updates, alerts, and important notifications to customers', TRUE),

  -- Healthcare Purposes
  ('Provide Patient Care & Treatment', 'Deliver medical care, treatment, and healthcare services to patients', TRUE),
  ('Maintain Medical Records', 'Store and manage patient health records and medical history', TRUE),
  ('Schedule Appointments & Reminders', 'Manage appointment scheduling and send reminders to patients', TRUE),
  ('Billing & Insurance Claims', 'Process medical billing and insurance claim submissions', TRUE),
  ('Prescription Management', 'Manage and track patient prescriptions and medications', TRUE),
  ('Telemedicine Services', 'Provide remote healthcare consultations and digital health services', TRUE),

  -- Education Purposes
  ('Student Enrollment & Registration', 'Manage student admissions, enrollment, and registration processes', TRUE),
  ('Maintain Academic Records', 'Store and manage student grades, transcripts, and academic performance', TRUE),
  ('Deliver Online Learning Content', 'Provide digital educational content and e-learning materials', TRUE),
  ('Fee Management & Billing', 'Process tuition fees, payments, and financial aid administration', TRUE),
  ('Parent-Teacher Communication', 'Facilitate communication between parents, teachers, and administration', TRUE),
  ('Track Student Performance', 'Monitor and analyze student academic progress and achievements', TRUE),

  -- Real Estate Purposes
  ('Property Listing & Management', 'List, manage, and showcase properties for sale or rent', TRUE),
  ('Lead Management & Follow-up', 'Track potential buyers/tenants and manage sales pipeline', TRUE),
  ('Schedule Property Viewings', 'Arrange and manage property tours and viewings', TRUE),
  ('Tenant Screening & Verification', 'Verify tenant background, credit history, and references', TRUE),
  ('Lease Agreement Management', 'Create, manage, and track rental agreements and contracts', TRUE),
  ('Handle Maintenance Requests', 'Process and track property maintenance and repair requests', TRUE),

  -- Travel & Hospitality Purposes
  ('Booking & Reservations', 'Process hotel, flight, and travel service reservations', TRUE),
  ('Guest Check-in & Verification', 'Verify guest identity and process check-in procedures', TRUE),
  ('Loyalty Program Management', 'Manage customer loyalty programs and rewards', TRUE),
  ('Personalized Travel Offers', 'Provide customized travel recommendations and special offers', TRUE),
  ('Collect Guest Feedback', 'Gather customer reviews and feedback to improve services', TRUE),
  ('Travel Coordination & Support', 'Provide travel assistance and customer support services', TRUE),

  -- Telecommunications Purposes
  ('Customer Activation & Onboarding', 'Register new customers and activate telecommunication services', TRUE),
  ('Service Provisioning', 'Provision and configure telecom services and equipment', TRUE),
  ('Billing & Payment Processing', 'Generate bills and process payments for telecom services', TRUE),
  ('Network Quality Management', 'Monitor and improve network performance and quality', TRUE),
  ('Customer Service & Support', 'Provide technical support and customer service', TRUE),
  ('Usage Tracking & Analytics', 'Monitor service usage and generate analytics reports', TRUE),

  -- General/Other Industry Purposes
  ('Account Management', 'Create, maintain, and manage user accounts and profiles', TRUE),
  ('Service Delivery', 'Deliver products, services, and fulfill customer orders', TRUE),
  ('Marketing & Communications', 'Send marketing materials, promotions, and business communications', TRUE),
  ('Analytics & Improvement', 'Analyze data to improve products, services, and user experience', TRUE),
  ('Security & Fraud Prevention', 'Protect systems and data from unauthorized access and fraud', TRUE),
  ('Legal Compliance', 'Comply with legal obligations and regulatory requirements', TRUE),
  ('Product Recommendations', 'Provide personalized product or service suggestions', TRUE),
  ('Quality Assurance', 'Monitor and improve service quality and customer satisfaction', TRUE),
  ('Research & Development', 'Conduct research to develop new products and services', TRUE),
  ('Performance Monitoring', 'Track system performance and operational metrics', TRUE)
ON CONFLICT (purpose_name) DO NOTHING;

-- Verify insertion
SELECT 
  is_predefined,
  COUNT(*) as purpose_count
FROM purposes
GROUP BY is_predefined
ORDER BY is_predefined DESC;

COMMENT ON TABLE purposes IS 'Predefined and custom purposes for data processing activities across all industries';
