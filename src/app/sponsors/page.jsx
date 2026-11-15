import SponsorsSection from '../components/SponsorsSection';

export const metadata = {
  title: 'Sponsors & Partners | Dhanak 2026',
  description:
    'Official sponsors, industry partners, and collaborative supporters of Dhanak 2026 at IIST Valiamala.',
};

export default function SponsorsPage() {
  return (
    <div className="relative min-h-[calc(100dvh-12rem)] text-white overflow-hidden">
      {/* Top Ambient Ember Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[85vw] h-[380px] z-0"
        style={{
          background:
            'radial-gradient(ellipse 65% 45% at 50% 0%, rgba(255, 115, 0, 0.15) 0%, transparent 75%)',
        }}
      />

      <div className="relative z-10 pt-10 sm:pt-14 pb-20">
        <SponsorsSection />
      </div>
    </div>
  );
}

