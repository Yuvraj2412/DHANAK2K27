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
  title: `Terms & Conditions | ${FEST_NAME} ${FEST_YEAR} · ${FEST_INSTITUTE_SHORT}`,
  description: `Official Terms and Conditions governing registrations, payments, campus entry, and participation at ${FEST_NAME} ${FEST_YEAR}, ${FEST_INSTITUTE} (${FEST_INSTITUTE_SHORT}).`,
};

const SUPPORT_EMAIL =
  CONTACT_EMAIL && CONTACT_EMAIL !== 'TBD' ? CONTACT_EMAIL : 'dhanak@iist.ac.in';

const sections = [
  {
    number: '01',
    title: 'Acceptance of Terms',
    body: [
      `Welcome to the official website of ${FEST_NAME} ${FEST_YEAR}, the Annual Cultural Festival of the ${FEST_INSTITUTE} (${FEST_INSTITUTE_SHORT}), Department of Space, Government of India, located at ${FEST_LOCATION}.`,
      `By accessing this website, creating an attendee profile, adding items to your cart, or completing a payment via Razorpay Standard Checkout, you agree to be bound by these Terms and Conditions, our Privacy Policy, our Refund & Cancellation Policy, and our Shipping & Delivery Policy. If you do not agree with any part of these terms, please refrain from using this website or registering for festival activities.`,
    ],
  },
  {
    number: '02',
    title: 'Eligibility & Attendee Profile Accuracy',
    bullets: [
      'Participation in Dhanak workshops, cultural competitions, pronites, and campus accommodation is open to bonafide school, college, polytechnic, and university students as well as eligible individual participants as specified in each event’s rules.',
      'Upon signing in, you must provide accurate, complete, and verifiable personal information—including your full name, valid mobile number, institution name, college ID number, and 12-digit Aadhaar / Government ID number.',
      'Upon registration, each user is assigned a unique Attendee ID (DHN-ID / CNS-ID). This ID is strictly personal and non-transferable.',
      'Providing forged, false, or misleading identity details may result in immediate cancellation of registration and denial of entry to the IIST Valiamala campus without refund.',
    ],
  },
  {
    number: '03',
    title: 'Pricing, Currency & Payment Terms (Razorpay)',
    bullets: [
      'All registration fees, workshop tickets, event fees, accommodation charges, foodfest orders, and merchandise prices on this website are listed in Indian Rupees (INR / ₹) and are inclusive of applicable taxes unless stated otherwise.',
      'Online payments are processed through Razorpay Software Private Limited ("Razorpay") supporting UPI, QR Code, Credit/Debit Cards, NetBanking, and Wallets.',
      'A registration or purchase is marked as "Confirmed / Paid" in our database only after our server cryptographically verifies the HMAC-SHA256 payment signature returned by Razorpay or receives an authenticated payment.captured / order.paid webhook event from Razorpay.',
      'You agree to use only valid payment instruments that you are legally authorized to use. Dhanak IIST is not liable for bank server downtime, declined authorizations, daily UPI limit restrictions, or incorrect VPA/OTP entries during checkout.',
    ],
  },
  {
    number: '04',
    title: 'Group Events & Team Roster Rules',
    bullets: [
      'For team competitions (where Group Size > 1, such as Group Dance, Battle of Bands, Fashion Show, and Esports Squads), one participant registers and pays the team registration fee as the designated Team Leader.',
      'Every teammate must create an individual account on the Dhanak website to obtain their own unique DHN-ID before being added to a team roster.',
      'The Team Leader may add teammates either before proceeding to payment or after payment from their Profile dashboard. Once a teammate is confirmed on a paid roster, that slot is locked and can only be modified by an authorized festival administrator.',
      'A participant cannot be part of more than one team for the same competition.',
    ],
  },
  {
    number: '05',
    title: 'Campus Entry, Security & Code of Conduct at IIST',
    bullets: [
      'IIST functions under the Department of Space, Government of India, and operates under strict high-security campus protocols.',
      'All attendees visiting the IIST Valiamala campus for in-person events, pronites, or accommodation must carry their physical College ID Card, original Government Photo ID (Aadhaar/PAN/Passport), and their digital Dhanak Fest Pass.',
      'Possession or consumption of alcohol, tobacco, narcotics, weapons, flammable props, or any prohibited substances on the IIST campus or in festival-arranged accommodation/transport is strictly forbidden and will lead to immediate expulsion and legal action.',
      'Participants must adhere to all hostel curfews, stage safety guidelines, and instructions issued by IIST Security and the Dhanak Organizing Committee.',
    ],
  },
  {
    number: '06',
    title: 'Event Schedules, Modifications & Force Majeure',
    body: [
      'While the Dhanak Organizing Committee makes every effort to adhere to published schedules, venues, speakers, and artist lineups, we reserve the right to reschedule, modify format (including shifting sessions online), or cancel any workshop or event due to unforeseen operational requirements, weather conditions, administrative directives, or Force Majeure events.',
    ],
  },
  {
    number: '07',
    title: 'Intellectual Property & Media Consent',
    body: [
      'All content on this website—including the Dhanak brand name, logos, 3D graphics, artwork, brochures, and code—is the property of Dhanak IIST. By participating in Dhanak events or workshops (online or on-campus), you grant Dhanak IIST permission to capture photographs, audio, and video recordings of sessions and performances for official archival, educational, and promotional use.',
    ],
  },
  {
    number: '08',
    title: 'Limitation of Liability & Governing Law',
    body: [
      `To the maximum extent permitted by applicable law, ${FEST_INSTITUTE} (${FEST_INSTITUTE_SHORT}) and the ${FEST_NAME} Organizing Committee shall not be liable for any indirect, incidental, or consequential damages arising out of your use of this website or participation in the festival.`,
      'These Terms and Conditions shall be governed by and construed in accordance with the laws of India. Any disputes arising in connection with these terms shall be subject to the exclusive jurisdiction of the competent courts in Thiruvananthapuram, Kerala, India.',
    ],
  },
];

export default function TermsAndConditionsPage() {
  return (
    <SimplePageShell
      eyebrow={`${FEST_NAME} ${FEST_YEAR} · Legal & Compliance`}
      title="Terms & Conditions"
      subtitle="Official rules and terms of service governing website usage, Razorpay payments, team registrations, and campus participation at Dhanak IIST."
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-orange-500/25 bg-[#120B07]/90 p-4 sm:p-5 text-xs sm:text-sm text-white/75 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-mono uppercase tracking-widest text-amber-300 font-bold">
              Effective Date:
            </span>{' '}
            November 1, 2026 · Jurisdiction: Thiruvananthapuram, Kerala
          </div>
          <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 font-mono text-[11px] text-amber-300">
            Official Festival Terms
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

        <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-[#1A0E08] to-[#0E0906] p-6 sm:p-8 space-y-3 text-sm">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-amber-300 font-bold">
            Questions About Our Terms?
          </p>
          <p className="text-white/80 leading-relaxed">
            For any clarifications regarding eligibility, event rules, or payment terms, reach out to the {FEST_NAME} Organizing Committee at{' '}
            <span className="font-mono text-amber-300">{SUPPORT_EMAIL}</span> or call{' '}
            <span className="font-mono text-amber-300">+91 94919 78534</span>.
          </p>
          <div className="pt-2 flex flex-wrap gap-3 text-xs">
            <Link
              href="/privacy-policy"
              className="text-orange-400 hover:underline font-semibold"
            >
              Privacy Policy →
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
