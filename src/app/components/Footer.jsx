'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SOCIAL_LINKS, FEST_YEAR } from '@/lib/festConfig';

const footerLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Pronites', href: '/pronites' },
  { label: 'Events', href: '/events' },
  { label: 'Workshops', href: '/workshop' },
  { label: 'Merch', href: '/merch' },
  { label: 'Accommodation', href: '/accommodation' },
  { label: 'Sponsors', href: '/sponsors' },
];

const policyLinks = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms & Conditions', href: '/terms-and-conditions' },
  { label: 'Refund & Cancellation Policy', href: '/refund-policy' },
  { label: 'Shipping & Delivery Policy', href: '/shipping-policy' },
  { label: 'Contact Us', href: '/contact-us' },
];

const officialSocials = [
  {
    label: 'Instagram',
    href: SOCIAL_LINKS.instagram,
    icon: '/icons/instagram.svg',
  },
  {
    label: 'LinkedIn',
    href: SOCIAL_LINKS.linkedin,
    icon: '/icons/linkedin.svg',
  },
  {
    label: 'YouTube',
    href: SOCIAL_LINKS.youtube,
    icon: '/icons/youtube.svg',
  },
];

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  return (
    <footer
      id="site-footer"
      className="relative z-20 px-4 pt-8 pb-[max(2rem,calc(env(safe-area-inset-bottom)+1.25rem))] sm:px-6 sm:py-14 text-white"
    >
      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Floating Dark Obsidian Tile Shielding Against Background Fire & Light */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-[#0C0A09]/95 backdrop-blur-md sm:backdrop-blur-2xl p-6 sm:p-10 lg:p-12 shadow-[0_25px_70px_rgba(0,0,0,0.95)]">
          {/* Subtle Ambient Corner Accents (hidden on small mobile GPUs for smoother scroll) */}
          <div
            aria-hidden="true"
            className="hidden sm:block pointer-events-none absolute -top-24 -left-24 w-64 h-64 rounded-full blur-[80px] opacity-25 bg-gradient-to-br from-orange-500 to-amber-600"
          />
          <div
            aria-hidden="true"
            className="hidden sm:block pointer-events-none absolute -bottom-24 -right-24 w-64 h-64 rounded-full blur-[80px] opacity-20 bg-gradient-to-tl from-amber-500 to-red-600"
          />

          <div className="relative z-10 grid grid-cols-1 gap-8 text-center sm:grid-cols-2 sm:text-left lg:grid-cols-12 lg:gap-10">
            {/* Brand & Official Social Links */}
            <div className="mx-auto max-w-md space-y-4 sm:mx-0 lg:col-span-5">
              <div className="space-y-2">
                <span className="text-xl sm:text-2xl font-bold uppercase tracking-wider brand-text">
                  Dhanak<span className="text-[#FF6B00]">.</span>
                </span>
                <p className="brand-tagline-cinzel text-[11px] font-bold tracking-[0.22em]">
                  Ember from Ashes · IIST Cultural Fest
                </p>
              </div>
              <p className="text-sm leading-relaxed text-white/55">
                Workshops, cultural competitions, and flagship pro-shows at the Indian Institute of Space Science and Technology.
              </p>
              {/* Official Dhanak Social Links */}
              <div className="pt-2 flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-start gap-2.5">
                {officialSocials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="group inline-flex min-h-[44px] sm:min-h-[38px] touch-manipulation [-webkit-tap-highlight-color:transparent] items-center justify-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/[0.06] px-3.5 py-2 text-[10px] font-syncopate font-bold uppercase tracking-[0.14em] text-white/80 transition-all duration-200 hover:border-amber-400/70 hover:bg-orange-500/15 hover:text-amber-300 active:scale-95 whitespace-nowrap"
                  >
                    <img
                      src={social.icon}
                      alt=""
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110"
                    />
                    <span>{social.label}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Explore Navigation (8 unique links in a clean 2x4 grid) */}
            <div className="border-t border-white/[0.08] pt-6 sm:border-t-0 sm:pt-0 lg:col-span-4">
              <p className="section-eyebrow mb-4 justify-center sm:justify-start">Explore</p>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-1 sm:gap-y-2.5 text-center sm:text-left">
                {footerLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="inline-flex min-h-[44px] sm:min-h-[30px] w-full sm:w-auto items-center justify-center sm:justify-start touch-manipulation [-webkit-tap-highlight-color:transparent] text-[12px] font-semibold uppercase tracking-wider text-white/65 transition-colors duration-200 hover:text-amber-300 active:text-amber-300"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Institute & Festival Metadata */}
            <div className="border-t border-white/[0.08] pt-6 sm:col-span-2 lg:col-span-3 lg:border-t-0 lg:pt-0 flex flex-col items-center sm:items-start lg:items-end justify-between gap-3 lg:text-right">
              <span className="chip inline-block">Cultural Fest {FEST_YEAR}</span>
              <div className="space-y-1.5 text-[11px] leading-relaxed text-white/45">
                <p>
                  © {FEST_YEAR} Indian Institute of Space Science and Technology
                </p>
                <p>Dept. of Space, Govt. of India</p>
                <p className="text-white/35">
                  Valiamala, Thiruvananthapuram – 695547
                </p>
              </div>
            </div>
          </div>

          {/* Mandatory Legal, Privacy & Razorpay Verification Policy Bar */}
          <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex flex-col lg:flex-row items-center justify-between gap-4 text-center lg:text-left">
            <ul className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-1 sm:gap-y-2">
              {policyLinks.map((policy) => (
                <li key={policy.href}>
                  <Link
                    href={policy.href}
                    className="inline-flex min-h-[44px] sm:min-h-0 items-center touch-manipulation [-webkit-tap-highlight-color:transparent] text-[11px] font-semibold uppercase tracking-wider text-white/60 transition-colors hover:text-amber-300 active:text-amber-300"
                  >
                    {policy.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 sm:whitespace-nowrap">
              Secured by Razorpay · PCI-DSS Compliant
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
