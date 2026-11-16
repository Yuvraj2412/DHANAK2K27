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
  title: `Shipping & Delivery Policy | ${FEST_NAME} ${FEST_YEAR} · ${FEST_INSTITUTE_SHORT}`,
  description: `Official Digital Pass Fulfilment and Merchandise Shipping & Delivery Policy for ${FEST_NAME} ${FEST_YEAR} at ${FEST_INSTITUTE} (${FEST_INSTITUTE_SHORT}).`,
};

const SUPPORT_EMAIL =
  CONTACT_EMAIL && CONTACT_EMAIL !== 'TBD' ? CONTACT_EMAIL : 'dhanak@iist.ac.in';

const sections = [
  {
    number: '01',
    title: 'Digital Passes, Workshop & Competition Registrations (Instant Delivery)',
    bullets: [
      'Immediate Digital Fulfilment: All workshop registrations, competition tickets, pronite passes, and accommodation confirmations are delivered digitally immediately (0 hours) upon successful payment verification via Razorpay.',
      'Where to Access Your Passes: Once your payment is verified, your registered items, unique Attendee ID (DHN-ID), and digital QR pass are immediately visible in your Profile Dashboard (/profile) on our website.',
      'Teammate Pass Fulfilment: When a Team Leader adds verified teammates to a group competition roster, the competition pass is automatically synced to each teammate’s Profile Dashboard immediately.',
      'Zero Shipping Cost for Digital Items: No shipping or handling fee applies to digital event passes, online workshops, or campus accommodation bookings.',
    ],
  },
  {
    number: '02',
    title: 'Official Festival Merchandise (On-Campus Pickup & Courier Delivery)',
    bullets: [
      'On-Campus Pickup at IIST Valiamala: Attendees visiting the campus can collect their pre-ordered official Dhanak merchandise (hoodies, t-shirts, accessories) directly at the Dhanak Merchandise Desk at IIST Valiamala, Thiruvananthapuram during the festival days by presenting their digital payment receipt and College/Government Photo ID.',
      'Domestic Courier Shipping (Across India): For merchandise orders placed with home delivery selected in the cart, orders are processed and dispatched within 3 to 5 business days of batch completion and delivered within 7 to 14 business days across India via reputed domestic courier partners (India Post / Delhivery / BlueDart).',
      'Delivery Charges: Any applicable courier shipping charge is transparently added as a line item in your cart prior to initiating Razorpay checkout.',
    ],
  },
  {
    number: '03',
    title: 'FoodFest Orders & Campus Hospitality',
    bullets: [
      'FoodFest Pre-Orders & Stall Tokens: Digital food tokens purchased on the website are fulfilled on-site at the designated FoodFest stalls on the IIST campus upon scanning/confirming your order token.',
      'Hostel Check-In: Accommodation check-in is fulfilled in person at the IIST Hospitality Desk upon verification of your confirmed booking receipt, DHN-ID, College ID, and Aadhaar card.',
    ],
  },
  {
    number: '04',
    title: 'Delayed Fulfilment & Support Contact',
    body: [
      'If your payment has been deducted and confirmed by your bank, but your digital pass does not appear on your Profile Dashboard within 15 minutes, simply visit the Payment Success page or contact our technical desk with your Razorpay Payment ID for instant verification.',
    ],
  },
];

export default function ShippingPolicyPage() {
  return (
    <SimplePageShell
      eyebrow={`${FEST_NAME} ${FEST_YEAR} · Legal & Compliance`}
      title="Shipping & Delivery Policy"
      subtitle="Fulfilment timelines for instant digital festival passes, workshop registrations, and official Dhanak merchandise delivery."
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-orange-500/25 bg-[#120B07]/90 p-4 sm:p-5 text-xs sm:text-sm text-white/75 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-mono uppercase tracking-widest text-amber-300 font-bold">
              Digital Passes:
            </span>{' '}
            Instant Delivery ·{' '}
            <span className="font-mono uppercase tracking-widest text-amber-300 font-bold">
              Merch Shipping:
            </span>{' '}
            7–14 Business Days
          </div>
          <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 font-mono text-[11px] text-amber-300">
            Instant Pass Fulfilment
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
            Merchandise &amp; Pass Delivery Queries
          </p>
          <p className="text-white/80 leading-relaxed">
            For merchandise shipping or pass fulfilment inquiries, contact Apalla Sai Yashwanth (Sales &amp; Merchandise Head: <span className="font-mono text-amber-300">+91 81069 55426</span>), Yuvraj Singh Tomar (Web &amp; Pass Fulfilment: <span className="font-mono text-amber-300">+91 92011 72630</span>), or email{' '}
            <span className="font-mono text-amber-300">{SUPPORT_EMAIL}</span>.
          </p>
          <p className="text-xs text-white/55">
            Campus Pickup Location: {FEST_INSTITUTE} ({FEST_INSTITUTE_SHORT}), Valiamala P.O., Thiruvananthapuram – 695547, Kerala, India ({FEST_LOCATION}).
          </p>
          <div className="pt-2 flex flex-wrap gap-3 text-xs">
            <Link
              href="/privacy-policy"
              className="text-orange-400 hover:underline font-semibold"
            >
              Privacy Policy →
            </Link>
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
