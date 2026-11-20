import SimplePageShell from '../components/SimplePageShell';
import { CONTACT_EMAIL, SOCIAL_LINKS } from '@/lib/festConfig';

export const metadata = {
  title: 'Contact Us | Dhanak IIST',
  description: 'Reach the Dhanak organizing team at IIST Thiruvananthapuram.',
};

const groups = [
  {
    title: 'Website & Technical Queries',
    people: [
      {
        name: 'Yuvraj Singh Tomar',
        role: 'Web Dev Head',
        phone: '+919201172630',
      },
    ],
  },
  {
    title: 'Sales & Merchandise Queries',
    people: [
      {
        name: 'Apalla Sai Yashwanth',
        role: 'Sales Head & Merchandise Queries',
        phone: '+918106955426',
      },
    ],
  },
  {
    title: 'Finance & Accommodation Queries',
    people: [
      {
        name: 'Ananya Bhatt',
        role: 'Vice Chief-Coordinator (Finance & Accommodation Queries)',
        phone: '+917038290052',
      },
      {
        name: 'Sanandhu Santosh',
        role: 'Vice Chief-Coordinator (Finance)',
        phone: '+918848291588',
      },
    ],
  },
  {
    title: 'Workshop and Events Queries',
    people: [
      {
        name: 'Adityan VV',
        role: 'Workshop & Events Queries',
        phone: '+917034148002',
      },
    ],
  },
  {
    title: 'General Queries & Overall Coordination',
    people: [
      {
        name: 'Vedhendra Vardhan',
        role: 'Chief Coordinator',
        phone: '+918317658835',
      },
      {
        name: 'Kurmananda',
        role: 'Vice Chief-Coordinator (For General Queries)',
        phone: '+919491978534',
      },
    ],
  },
];

function formatPhone(e164) {
  const digits = e164.replace('+91', '');
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

function ContactCard({ name, role, phone }) {
  const waNumber = phone.replace('+', '');
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/15 bg-[#140B07]/92 p-4 sm:p-5 transition-all duration-300 hover:border-orange-400/60 hover:bg-[#1C0F09]/95 hover:shadow-[0_0_40px_rgba(255,140,0,0.25)]">
      <div className="relative min-w-0">
        <p className="text-base sm:text-lg font-semibold text-white break-words">{name}</p>
        <p className="text-[10px] sm:text-xs uppercase tracking-widest text-white/85 mt-1">{role}</p>
        <p className="text-xs sm:text-sm text-amber-300 mt-2 font-mono font-semibold break-all">{formatPhone(phone)}</p>

        <div className="mt-4 flex gap-3">
          <a
            href={`tel:${phone}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] text-black hover:bg-white transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1C10.85 21 3 13.15 3 3.5a1 1 0 011-1h3.49a1 1 0 011 1 11.36 11.36 0 00.57 3.58 1 1 0 01-.25 1.02z" />
            </svg>
            Call
          </a>
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] text-emerald-300 hover:bg-emerald-400/20 transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 004.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.05c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.8-.11-.42-.13-.95-.31-1.64-.6-2.88-1.24-4.76-4.14-4.9-4.33-.14-.19-1.17-1.56-1.17-2.98s.73-2.12 1-2.41c.24-.27.53-.34.7-.34.18 0 .35 0 .5.01.16.01.38-.06.6.46.24.57.8 1.98.87 2.12.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.16-.3.36-.42.49-.14.14-.29.3-.13.58.17.28.75 1.24 1.62 2.01 1.11.99 2.04 1.3 2.33 1.44.28.14.45.12.62-.07.17-.19.71-.83.9-1.11.19-.28.38-.23.63-.14.26.09 1.65.78 1.93.92.28.14.47.21.54.33.07.12.07.7-.17 1.38z" />
            </svg>
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  const officialEmail = CONTACT_EMAIL || 'helpdesk.dhanak2027@gmail.com';
  const hasRealEmail = Boolean(officialEmail && officialEmail !== 'TBD' && officialEmail.includes('@'));

  return (
    <SimplePageShell
      eyebrow="Dhanak 2027 · IIST"
      title="Contact Us"
      subtitle="For any inquiries, collaborations, or queries related to Dhanak, feel free to reach out to us through the following contacts."
    >
      <div className="space-y-10">
        <div
          className="group flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-transparent p-4 sm:p-5 hover:border-orange-500/60 hover:from-orange-500/15 transition-colors"
        >
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-500/15 text-amber-300">
              <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16v16H4z" strokeLinecap="round" strokeLinejoin="round" opacity="0" />
                <path d="M3 6h18v12H3z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs uppercase tracking-widest text-white/40">Official Email</p>
              <p className="text-sm sm:text-lg text-orange-400/90 font-mono break-all">
                {officialEmail}
              </p>
            </div>
          </div>
          {hasRealEmail ? (
            <a
              href={`mailto:${officialEmail}`}
              className="shrink-0 text-[10px] font-black uppercase tracking-[0.2em] text-white/50 group-hover:text-white transition-colors"
            >
              Send mail →
            </a>
          ) : (
            <span className="shrink-0 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-amber-300/70">
              To Be Announced
            </span>
          )}
        </div>

        {/* Registered Institution & Operational Address (Required for Payment Gateway Verification) */}
        <div className="rounded-2xl border border-white/15 bg-[#140B07]/92 p-4 sm:p-5 space-y-1.5">
          <p className="text-[10px] sm:text-xs uppercase tracking-widest text-amber-300 font-mono font-bold">
            Registered Institution &amp; Campus Address
          </p>
          <p className="text-sm sm:text-base font-semibold text-white">
            Dhanak — Indian Institute of Space Science and Technology (IIST)
          </p>
          <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
            Department of Space, Government of India, Valiamala P.O., Thiruvananthapuram – 695547, Kerala, India
          </p>
        </div>

        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="text-base sm:text-xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="h-px flex-1 max-w-6 bg-gradient-to-r from-orange-500 to-amber-500/50" />
              {group.title}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {group.people.map((person) => (
                <ContactCard key={person.phone} {...person} />
              ))}
            </div>
          </div>
        ))}

        {/* Official Social Media Channels */}
        <div>
          <h3 className="text-base sm:text-xl font-semibold text-white mb-4 flex items-center gap-3">
            <span className="h-px flex-1 max-w-6 bg-gradient-to-r from-orange-500 to-amber-500/50" />
            Official Social Media
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                label: 'Instagram',
                handle: '@dhanak.iist',
                href: SOCIAL_LINKS.instagram,
                icon: '/icons/instagram.svg',
              },
              {
                label: 'LinkedIn',
                handle: 'Dhanak IIST',
                href: SOCIAL_LINKS.linkedin,
                icon: '/icons/linkedin.svg',
              },
              {
                label: 'YouTube',
                handle: '@dhanakiist',
                href: SOCIAL_LINKS.youtube,
                icon: '/icons/youtube.svg',
              },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 transition-all duration-300 hover:border-amber-400/60 hover:bg-orange-500/[0.08] hover:shadow-[0_0_36px_rgba(255,150,0,0.22)]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-500/30 bg-orange-500/10">
                  <img
                    src={social.icon}
                    alt={social.label}
                    className="h-5 w-5 transition-transform duration-300 group-hover:scale-115"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-white group-hover:text-amber-300 transition-colors">
                    {social.label}
                  </p>
                  <p className="text-xs text-orange-400/80 font-mono truncate">{social.handle}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </SimplePageShell>
  );
}
