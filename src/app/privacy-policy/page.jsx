import Link from 'next/link';
import SimplePageShell from '../components/SimplePageShell';
import {
  FEST_NAME,
  FEST_YEAR,
  FEST_INSTITUTE,
  FEST_INSTITUTE_SHORT,
  FEST_LOCATION,
  CONTACT_EMAIL,
} from '@/lib/festConfig';

export const metadata = {
  title: `Privacy Policy | ${FEST_NAME} ${FEST_YEAR} · ${FEST_INSTITUTE_SHORT}`,
  description: `Official Privacy Policy and Data Protection Guidelines for ${FEST_NAME} ${FEST_YEAR} at ${FEST_INSTITUTE} (${FEST_INSTITUTE_SHORT}), Thiruvananthapuram.`,
};

const SUPPORT_EMAIL =
  CONTACT_EMAIL && CONTACT_EMAIL !== 'TBD' ? CONTACT_EMAIL : 'dhanak@iist.ac.in';

const sections = [
  {
    number: '01',
    title: 'Introduction & Scope',
    body: [
      `This Privacy Policy describes how ${FEST_NAME} ${FEST_YEAR}, the Annual Cultural Festival of the ${FEST_INSTITUTE} (${FEST_INSTITUTE_SHORT}), Department of Space, Government of India, located at Valiamala P.O., Thiruvananthapuram – 695547, Kerala, India ("we", "us", or "our"), collects, uses, stores, and protects your personal information when you visit our website, create an attendee profile, register for workshops or cultural competitions, book campus accommodation, or purchase festival passes and merchandise.`,
      `By accessing or using this website and completing any registration or payment transaction, you consent to the data practices described in this Privacy Policy in accordance with the Information Technology Act, 2000 (and its SPDI Rules, 2011) and the Digital Personal Data Protection Act (DPDPA), 2023.`,
    ],
  },
  {
    number: '02',
    title: 'Information We Collect',
    body: [
      'When you sign in, complete your attendee profile, or register for any festival activity, we collect only the information strictly necessary for festival administration and campus security verification:',
    ],
    bullets: [
      'Identity & Profile Information: Full legal name, gender, city, and unique attendee identification code (DHN-ID / CNS-ID).',
      'Contact Information: Email address (verified via Google OAuth or One-Time Password) and 10-digit mobile phone number for communication, ticket delivery, and emergency coordination.',
      'Academic & Campus Security Verification Details: College/Institution name, College Roll/ID Number, and 12-digit Government Identity / Aadhaar number. Because IIST functions under the Department of Space, Government of India, valid government and institutional identification is mandatory for security clearance and physical entry onto the IIST Valiamala campus.',
      'Event & Team Registration Records: Selected workshops, cultural events, team rosters (leader and teammate DHN-IDs), accommodation dates, meal preferences, and merchandise sizes.',
      'Payment & Transaction Identifiers: Razorpay Order ID (order_...), Razorpay Payment ID (pay_...), cryptographic verification signature, payment method category (UPI, Card, NetBanking, Wallet), transaction amount in INR, and payment status.',
    ],
  },
  {
    number: '03',
    title: 'Payment Processing & Financial Data Security (Razorpay)',
    body: [
      'All online payments on this website are processed securely through Razorpay Software Private Limited ("Razorpay"), an RBI-authorized Payment Aggregator compliant with the Payment Card Industry Data Security Standard (PCI-DSS Level 1).',
      'We do NOT collect, process, or store your sensitive payment instrument details—such as credit/debit card numbers, CVV/CVC security codes, net-banking login passwords, or UPI PINs—on our servers or database. When you initiate checkout, your payment credentials are transmitted directly to Razorpay’s encrypted gateway over 256-bit SSL/TLS.',
      'Our backend servers only receive a cryptographic HMAC-SHA256 signature, Order ID, and Payment ID from Razorpay to verify payment authenticity before issuing your festival passes. For more details on how Razorpay handles financial data, please refer to Razorpay’s official Privacy Policy at https://razorpay.com/privacy/.',
    ],
  },
  {
    number: '04',
    title: 'How We Use Your Information',
    bullets: [
      'Processing and confirming your registrations for workshops, cultural competitions, pronites, foodfest orders, merchandise, and campus accommodation.',
      'Generating your unique digital festival pass, QR code, and verifiable participation/winner certificates.',
      'Facilitating multi-member team formation where a verified Team Leader links registered teammates via their unique DHN-ID.',
      'Preparing mandatory gate-entry manifests for IIST Campus Security and the Hospitality & Accommodation Desk.',
      'Sending transactional notifications, payment receipts, schedule updates, and refund/support communications.',
      'Preventing duplicate charges, unauthorized access, fraudulent bookings, or tampering with registration records.',
    ],
  },
  {
    number: '05',
    title: 'Data Storage, Cryptographic Safeguards & Row-Level Security',
    body: [
      'We implement strict technical and organizational security controls to protect your personal data against unauthorized access, alteration, disclosure, or destruction:',
    ],
    bullets: [
      'All client-server and payment gateway communications are encrypted in transit using HTTPS / TLS 1.2+.',
      'Database records are hosted on enterprise cloud infrastructure (Supabase PostgreSQL) protected by Row-Level Security (RLS) policies ensuring users can only read their own profile and registration records.',
      'All registration writes and team modifications are executed exclusively through authenticated server-side API routes after verifying Supabase JWT tokens and Razorpay HMAC-SHA256 signatures.',
    ],
  },
  {
    number: '06',
    title: 'Cookies & Local Storage',
    body: [
      'We use essential first-party browser cookies and localStorage items solely to maintain your authenticated login session, preserve your shopping cart items across page reloads, and recover checkout state in the event of a temporary network interruption during payment redirect. We do not use third-party advertising trackers or sell behavioral data to marketers.',
    ],
  },
  {
    number: '07',
    title: 'Information Sharing & Third-Party Disclosure',
    body: [
      'We never sell, rent, or trade your personal information. Your data is shared only under the following limited circumstances:',
    ],
    bullets: [
      'IIST Administration & Campus Security: For mandatory identity verification, gate clearance, and hostel/accommodation allotment at IIST Valiamala.',
      'Payment Gateway Partner (Razorpay) & Issuing Banks: For transaction authorization, webhook reconciliation, refund processing, and statutory financial compliance.',
      'Legal & Regulatory Authorities: When required by applicable Indian law, court order, or governmental agency.',
    ],
  },
  {
    number: '08',
    title: 'Data Retention & Your Rights',
    body: [
      'Registration and certificate verification records are retained for the duration of the festival cycle and subsequent academic verification period so participants can validate their official certificates online. You have the right to view and update your profile details prior to checkout, request correction of inaccurate information, or contact our team regarding data privacy concerns.',
    ],
  },
  {
    number: '09',
    title: 'Grievance Officer & Contact Information',
    body: [
      'In accordance with the Information Technology Act, 2000 and rules made thereunder, if you have any questions, concerns, or grievances regarding this Privacy Policy or the handling of your personal data, please contact:',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <SimplePageShell
      eyebrow={`${FEST_NAME} ${FEST_YEAR} · Legal & Compliance`}
      title="Privacy Policy"
      subtitle="How we collect, safeguard, and process attendee data and Razorpay payment transactions for Dhanak at IIST Thiruvananthapuram."
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-orange-500/25 bg-[#120B07]/90 p-4 sm:p-5 text-xs sm:text-sm text-white/75 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-mono uppercase tracking-widest text-amber-300 font-bold">
              Effective Date:
            </span>{' '}
            November 1, 2026 · Last Updated: November 2026
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] text-emerald-300">
            PCI-DSS &amp; DPDPA 2023 Compliant
          </span>
        </div>

        {sections.map((sec) => (
          <section
            key={sec.number}
            className="rounded-2xl border border-white/12 bg-[#140B07]/92 p-5 sm:p-7 space-y-3"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/30 rounded-lg px-2.5 py-1">
                {sec.number}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {sec.title}
              </h2>
            </div>

            {sec.body?.map((paragraph, idx) => (
              <p
                key={idx}
                className="text-sm sm:text-[15px] leading-relaxed text-white/80"
              >
                {paragraph}
              </p>
            ))}

            {sec.bullets && (
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-[15px] leading-relaxed text-white/80">
                {sec.bullets.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {/* Merchant & Grievance Contact Card */}
        <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-[#1A0E08] to-[#0E0906] p-6 sm:p-8 space-y-3 text-sm">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-amber-300 font-bold">
            Official Organizer &amp; Grievance Desk
          </p>
          <p className="text-base font-bold text-white">
            {FEST_NAME} Organizing Committee — {FEST_INSTITUTE} ({FEST_INSTITUTE_SHORT})
          </p>
          <p className="text-white/75 leading-relaxed">
            Department of Space, Government of India
            <br />
            Valiamala P.O., Thiruvananthapuram – 695547, Kerala, India ({FEST_LOCATION})
          </p>
          <div className="pt-2 flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm font-mono text-amber-300">
            <span>Email: {SUPPORT_EMAIL}</span>
            <span>Phone: +91 94919 78534 / +91 92011 72630</span>
          </div>
          <div className="pt-3 flex flex-wrap gap-3 text-xs">
            <Link
              href="/terms-and-conditions"
              className="text-orange-400 hover:underline font-semibold"
            >
              Terms &amp; Conditions →
            </Link>
            <Link
              href="/refund-policy"
              className="text-orange-400 hover:underline font-semibold"
            >
              Refund &amp; Cancellation Policy →
            </Link>
            <Link
              href="/shipping-policy"
              className="text-orange-400 hover:underline font-semibold"
            >
              Shipping &amp; Delivery Policy →
            </Link>
            <Link
              href="/contact-us"
              className="text-orange-400 hover:underline font-semibold"
            >
              Contact Us →
            </Link>
          </div>
        </div>
      </div>
    </SimplePageShell>
  );
}
