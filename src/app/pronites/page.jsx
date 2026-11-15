import SimplePageShell from '../components/SimplePageShell';
import Link from 'next/link';

export const metadata = {
  title: 'Pronites | Dhanak 2026',
  description: 'Star celebrity nights, band clashes, and live EDM at Dhanak 2026.',
};

const pronites = [
  {
    day: 'Day 0',
    night: 'Choreo & Dance Night',
    description: 'High-octane choreography showdowns, western solo battles, and an electrifying dance arena that kicks off the festival with pure adrenaline.',
    status: 'Artist & Lineup Dropping Soon',
    accent: '#FF4500',
  },
  {
    day: 'Day 1',
    night: 'Battle of the Bands',
    description: 'Live headlining band clash, thunderous guitar riffs, heavy drums, and an unforgettable rock & indie concert under the open skies.',
    status: 'Headliner Reveal Expected Soon',
    accent: '#FF7A00',
  },
  {
    day: 'Day 2',
    night: 'Star Celebrity Night & Fashion Extravaganza',
    description: 'The festival crescendo. The grand cultural runway followed by our celebrity star performer and an epic celebratory send-off.',
    status: 'Celebrity Guest Dropping Soon',
    accent: '#FFB800',
  },
];

export default function PronitesPage() {
  return (
    <SimplePageShell
      title="Pronites & Star Nights"
      subtitle="When twilight settles over Valiamala, the stage ignites. Three nights of pure sound, spectacle, and celebration."
    >
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          {pronites.map((p) => (
            <div
              key={p.day}
              className="rounded-2xl border p-7 flex flex-col justify-between"
              style={{
                borderColor: `${p.accent}33`,
                background: `linear-gradient(145deg, rgba(20,10,5,0.85) 0%, #0C0A09 100%)`,
                boxShadow: `0 8px 30px ${p.accent}20`,
              }}
            >
              <div>
                <span
                  className="font-mono text-xs uppercase tracking-[0.3em] font-bold"
                  style={{ color: p.accent }}
                >
                  {p.day}
                </span>
                <h3 className="text-2xl font-black uppercase tracking-tight text-white mt-2 mb-3">
                  {p.night}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed mb-6">
                  {p.description}
                </p>
              </div>

              <div className="pt-4 border-t border-white/10">
                <span
                  className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    border: `1px solid ${p.accent}40`,
                    background: `${p.accent}15`,
                    color: p.accent,
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full animate-ping"
                    style={{ background: p.accent }}
                  />
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.04] p-8 text-center mt-12">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange-400 mb-2">Exclusive Announcements</p>
          <h4 className="text-xl font-bold text-white mb-2">Pronite Passes & Access</h4>
          <p className="text-sm text-white/60 max-w-xl mx-auto mb-6">
            Pronite passes will be included with your fest registration. Stay connected on our official Instagram for celebrity reveals.
          </p>
          <a
            href="https://www.instagram.com/dhanak.iist/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-black bg-gradient-to-r from-orange-500 to-amber-400 hover:scale-105 transition-transform"
          >
            Follow on Instagram ›
          </a>
        </div>
      </div>
    </SimplePageShell>
  );
}

