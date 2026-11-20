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
  title: `Refund & Cancellation Policy | ${FEST_NAME} ${FEST_YEAR} · ${FEST_INSTITUTE_SHORT}`,
  description: `Official Refund and Cancellation Policy for workshop registrations, event passes, merchandise, and accommodation at ${FEST_NAME} ${FEST_YEAR}, ${FEST_INSTITUTE} (${FEST_INSTITUTE_SHORT}).`,
};

const SUPPORT_EMAIL = CONTACT_EMAIL || 'TBD';

const sections = [
  {
    number: '01',
    title: 'Overview & General Cancellation Policy',
    body: [
      `This Refund and Cancellation Policy applies to all online registrations, workshop tickets, competition entry fees, pronite passes, accommodation bookings, foodfest orders, and official merchandise purchased on the ${FEST_NAME} ${FEST_YEAR} website (${FEST_INSTITUTE}, ${FEST_LOCATION}).`,
      'Because festival seat capacities, workshop batches, hostel accommodation slots, and production quantities are allocated immediately upon payment confirmation, confirmed registrations and purchases are generally non-cancellable and non-refundable by the attendee, except under the specific circumstances detailed below.',
    ],
  },
  {
    number: '02',
    title: 'Failed, Interrupted, or Duplicate Transactions (Auto-Refund)',
    bullets: [
      'No Registration Recorded on Payment Failure: Our database records a registration only after cryptographic verification of a successful payment. If a payment fails or is interrupted, no pass is issued.',
      'Amount Debited but Pass Not Generated: If an amount is debited from your bank account, credit/debit card, or UPI ID due to a network drop or bank timeout without order confirmation, the transaction is automatically reconciled by Razorpay and your issuing bank.',
      'Duplicate Payments: If you are accidentally charged twice for the same workshop, event, or item, 100% of the duplicate transaction amount is eligible for a full refund upon verification of the Razorpay Payment IDs.',
      'Refund Timeline (5–7 Business Days): All eligible refunds for failed, uncaptured, or duplicate transactions are processed through Razorpay and credited back to the original source of payment (Bank Account, UPI, Card, or Wallet) within 5 to 7 working days.',
    ],
  },
  {
    number: '03',
    title: 'Event or Workshop Cancellation by Organizers',
    bullets: [
      '100% Full Refund on Cancellation: In the rare event that a specific workshop, competition, or paid session is cancelled outright by the Dhanak Organizing Committee and cannot be rescheduled, registered participants for that specific activity will receive a 100% refund of the registration fee paid for that item.',
      'Rescheduled Sessions: If an event or workshop time slot is adjusted within the festival window or transitioned to a live online session due to unavoidable administrative reasons, registrations remain valid for the updated slot.',
    ],
  },
  {
    number: '04',
    title: 'Merchandise & Accommodation Bookings',
    bullets: [
      'Official Merchandise: Once an order for custom festival apparel (hoodies/t-shirts) is confirmed, size changes or cancellations cannot be guaranteed after batch printing has commenced. However, if you receive a physically damaged or defective item, you may request a free replacement at the campus merchandise desk within 48 hours of pickup/delivery.',
      'Campus Accommodation & Hospitality: Accommodation bookings at IIST Valiamala are non-refundable once confirmed, as hostel beds and mess catering are reserved in advance.',
    ],
  },
  {
    number: '05',
    title: 'How to Request a Refund or Report a Payment Discrepancy',
    body: [
      'If your account was debited for a failed transaction that has not auto-reversed after 5 business days, or if you were charged twice for the same item, please contact our Finance & Technical Support Desk with the following details:',
    ],
    bullets: [
      'Your Registered Full Name, Email Address, and Mobile Number',
      'Your Unique Attendee ID (e.g., DHN-XXXXXX)',
      'Razorpay Order ID (e.g., order_...) and Razorpay Payment ID (e.g., pay_...) or UTR / Bank Reference Number',
      'Screenshot of the payment debit confirmation',
    ],
  },
];

export default function RefundPolicyPage() {
  return (
    <SimplePageShell
      eyebrow={`${FEST_NAME} ${FEST_YEAR} · Legal & Compliance`}
      title="Refund & Cancellation Policy"
      subtitle="Clear guidelines on cancellations, duplicate payment reversals, and Razorpay refund timelines (5–7 business days)."
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-orange-500/25 bg-[#120B07]/90 p-4 sm:p-5 text-xs sm:text-sm text-white/75 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-mono uppercase tracking-widest text-amber-300 font-bold">
              Standard Refund Window:
            </span>{' '}
            5 to 7 Business Days to Original Payment Method
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] text-emerald-300">
            Razorpay Verified Refunds
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
            Finance &amp; Payment Support Escalation
          </p>
          <p className="text-white/80 leading-relaxed">
            Reach out to our Finance &amp; Technical Coordinators at{' '}
            <span className="font-mono text-amber-300">{SUPPORT_EMAIL}</span>, Ananya Bhatt (Finance: <span className="font-mono text-amber-300">+91 70382 90052</span>), Sanandhu Santosh (Finance: <span className="font-mono text-amber-300">+91 88482 91588</span>), or Yuvraj Singh Tomar (Web &amp; Gateway Queries: <span className="font-mono text-amber-300">+91 92011 72630</span>).
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
