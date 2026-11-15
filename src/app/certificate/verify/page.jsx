'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { Award, ShieldCheck, CheckCircle2, Building2, Calendar, FileText, ArrowLeft } from 'lucide-react';

function VerifyCertificateContent() {
  const searchParams = useSearchParams();
  const certId = searchParams.get('id') || 'CERT-DHN-WS-0001';
  const name = searchParams.get('name') || 'Registered Participant';
  const workshop = searchParams.get('ws') || searchParams.get('workshop') || 'Official Workshop Track';
  const date = searchParams.get('date') || 'March 2027';

  return (
    <div className="relative min-h-screen bg-[#030508] text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,107,0,0.18),transparent_55%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <div className="relative z-10 w-full max-w-xl mx-auto">
        {/* Navigation link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Back to Dhanak
          </Link>
        </div>

        {/* Verification Card */}
        <div className="glass-card rounded-2xl border border-orange-500/30 p-6 sm:p-8 bg-[#0C0A09]/90 shadow-[0_0_60px_rgba(255,107,0,0.12)]">
          {/* Header Badge */}
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                  Official Verification
                </p>
                <h1 className="text-lg font-bold text-white tracking-tight">Verified Credential</h1>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
              <CheckCircle2 size={13} /> Authentic
            </span>
          </div>

          {/* Details Grid */}
          <div className="space-y-4">
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-mono">
                Awarded To
              </span>
              <p className="text-xl font-bold text-white tracking-tight">{name}</p>
            </div>

            <div>
              <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-mono">
                Workshop / Event
              </span>
              <p className="text-sm font-semibold text-amber-300">{workshop}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-mono">
                  Issuing Authority
                </span>
                <p className="text-xs text-white/80 font-medium">IIST Thiruvananthapuram</p>
                <p className="text-[11px] text-white/40">Dhanak 2027 Annual Fest</p>
              </div>

              <div>
                <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-mono">
                  Event Session
                </span>
                <p className="text-xs text-white/80 font-medium">{date}</p>
                <p className="text-[11px] text-white/40">Participation Track</p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-mono">
                Certificate Verification ID
              </span>
              <div className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 font-mono text-xs text-amber-400 select-all">
                {certId}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <p className="text-[11px] text-white/40">
              This credential is authenticated against the official registration records of the Indian Institute of Space
              Science and Technology (IIST).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CertificateVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#030508] text-white flex items-center justify-center text-sm text-white/40">
          Loading certificate verification…
        </div>
      }
    >
      <VerifyCertificateContent />
    </Suspense>
  );
}

