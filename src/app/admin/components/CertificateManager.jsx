'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Award,
  Search,
  Download,
  Printer,
  Eye,
  FileSpreadsheet,
  CheckCircle2,
  Copy,
  Sliders,
  RefreshCw,
  ExternalLink,
  X,
  Palette,
  Check,
} from 'lucide-react';
import {
  renderCertificateCanvas,
  downloadCanvasAsPNG,
  printCanvasCertificate,
  generateCertificateId,
  CERT_WIDTH,
  CERT_HEIGHT,
} from '@/lib/certificateGenerator';
import { downloadAsExcel } from '@/lib/exportExcel';

export default function CertificateManager({ users = [], catalog = [], workshopIds = new Set(), session }) {
  const [selectedWorkshopId, setSelectedWorkshopId] = useState('all');
  const [search, setSearch] = useState('');
  const [activeModalUser, setActiveModalUser] = useState(null);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Filter workshops from catalog
  const workshops = useMemo(() => {
    return catalog
      .filter((item) => item.kind === 'workshop' || workshopIds.has(String(item.id)))
      .map((item) => ({
        id: String(item.id),
        title: item.title || item.id,
        event_date: item.event_date || 'Dhanak 2027',
      }));
  }, [catalog, workshopIds]);

  // Map workshop ID to workshop metadata
  const workshopMap = useMemo(() => {
    return new Map(workshops.map((w) => [w.id, w]));
  }, [workshops]);

  // Extract all participants who paid for at least one workshop
  const eligibleParticipants = useMemo(() => {
    const list = [];
    for (const u of users) {
      if (u.registration?.payment_status !== 'paid') continue;
      const ids = Array.isArray(u.registration?.workshop_ids) ? u.registration.workshop_ids.map(String) : [];
      const userWorkshops = ids.filter((id) => workshopIds.has(id) || workshopMap.has(id));

      if (userWorkshops.length === 0) continue;

      for (const wsId of userWorkshops) {
        const ws = workshopMap.get(wsId) || { id: wsId, title: `Workshop (${wsId})`, event_date: '2027' };
        list.push({
          user: u,
          userId: u.user_id,
          name: u.name || u.registration?.details?.name || 'Unnamed Participant',
          email: u.email || '',
          phone: u.phone || u.registration?.details?.phone || '',
          college: u.college || u.registration?.details?.college || '',
          city: u.city || u.registration?.details?.city || '',
          uniqueCode: u.unique_code || u.registration?.details?.unique_code || '—',
          workshopId: wsId,
          workshopTitle: ws.title,
          workshopDate: ws.event_date,
        });
      }
    }
    return list;
  }, [users, workshopIds, workshopMap]);

  // Filter participants based on workshop selector and search term
  const filteredParticipants = useMemo(() => {
    const term = search.trim().toLowerCase();
    return eligibleParticipants.filter((item) => {
      if (selectedWorkshopId !== 'all' && item.workshopId !== selectedWorkshopId) {
        return false;
      }
      if (!term) return true;
      return (
        item.name.toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term) ||
        item.phone.toLowerCase().includes(term) ||
        item.uniqueCode.toLowerCase().includes(term) ||
        item.college.toLowerCase().includes(term) ||
        item.workshopTitle.toLowerCase().includes(term)
      );
    });
  }, [eligibleParticipants, selectedWorkshopId, search]);

  // Modal customizer state
  const [certConfig, setCertConfig] = useState({
    participantName: '',
    college: '',
    workshopTitle: '',
    workshopDate: '',
    issueDate: 'March 29, 2027',
    certificateId: '',
    certificateType: 'Certificate of Participation',
    theme: 'luxury-dark',
    nameYOffset: 0,
    nameFontSize: 64,
    signatories: [
      { name: 'Dr. Kurmananda V.', title: 'Faculty Coordinator, IIST' },
      { name: 'Chief Coordinator', title: 'Convener, Dhanak 2027' },
    ],
  });

  const previewCanvasRef = useRef(null);
  const hiddenCanvasRef = useRef(null);

  // Initialize modal when a participant is selected
  const openCertificateModal = (item) => {
    const certId = generateCertificateId(item.user, item.workshopId);
    setCertConfig({
      participantName: item.name,
      college: item.college,
      workshopTitle: item.workshopTitle,
      workshopDate: item.workshopDate,
      issueDate: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
      certificateId: certId,
      certificateType: 'Certificate of Participation',
      theme: 'luxury-dark',
      nameYOffset: 0,
      nameFontSize: item.name.length > 25 ? 54 : 64,
      signatories: [
        { name: 'Dr. Kurmananda V.', title: 'Faculty Coordinator, IIST' },
        { name: 'Chief Coordinator', title: 'Convener, Dhanak 2027' },
      ],
    });
    setActiveModalUser(item);
  };

  // Re-render canvas whenever certConfig changes
  useEffect(() => {
    if (activeModalUser && previewCanvasRef.current) {
      renderCertificateCanvas(previewCanvasRef.current, certConfig);
    }
  }, [activeModalUser, certConfig]);

  // Download high-res PNG for active modal
  const handleDownloadPNG = () => {
    if (!previewCanvasRef.current) return;
    const cleanName = certConfig.participantName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Certificate_${cleanName}_${certConfig.certificateId}.png`;
    downloadCanvasAsPNG(previewCanvasRef.current, filename);
  };

  // Print / Save as PDF
  const handlePrint = () => {
    if (!previewCanvasRef.current) return;
    printCanvasCertificate(
      previewCanvasRef.current,
      `${certConfig.participantName} - ${certConfig.workshopTitle} Certificate`
    );
  };

  // Copy Certificate ID to clipboard
  const handleCopyId = () => {
    if (!certConfig.certificateId) return;
    navigator.clipboard.writeText(certConfig.certificateId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Export current list to Excel
  const handleExportExcel = () => {
    const rows = filteredParticipants.map((p, index) => ({
      'S.No': index + 1,
      'Participant Name': p.name,
      'Attendee ID (CNS)': p.uniqueCode,
      'Email': p.email,
      'Phone': p.phone,
      'College / Institution': p.college,
      'Workshop': p.workshopTitle,
      'Workshop Date': p.workshopDate,
      'Generated Certificate ID': generateCertificateId(p.user, p.workshopId),
    }));
    const sheetName = selectedWorkshopId === 'all' ? 'All Workshops' : 'Workshop Registrants';
    downloadAsExcel(rows, `Workshop_Certificates_${Date.now()}.xlsx`, sheetName);
  };

  // Bulk download certificates sequentially
  const handleBulkDownload = async () => {
    if (filteredParticipants.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to download certificates for all ${filteredParticipants.length} filtered participant(s)?`
      )
    ) {
      return;
    }

    setBulkDownloading(true);
    try {
      const canvas = hiddenCanvasRef.current || document.createElement('canvas');
      for (let i = 0; i < filteredParticipants.length; i++) {
        const item = filteredParticipants[i];
        const certId = generateCertificateId(item.user, item.workshopId);
        await renderCertificateCanvas(canvas, {
          participantName: item.name,
          college: item.college,
          workshopTitle: item.workshopTitle,
          workshopDate: item.workshopDate,
          issueDate: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
          certificateId: certId,
          certificateType: 'Certificate of Participation',
          theme: certConfig.theme,
          nameFontSize: item.name.length > 25 ? 54 : 64,
          nameYOffset: 0,
          signatories: certConfig.signatories,
        });

        const cleanName = item.name.replace(/[^a-zA-Z0-9_-]/g, '_');
        downloadCanvasAsPNG(canvas, `Certificate_${cleanName}_${certId}.png`);

        // Small breathing delay between downloads so the browser doesn't choke
        await new Promise((r) => setTimeout(r, 350));
      }
    } finally {
      setBulkDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Explanation */}
      <div className="glass-card rounded-2xl border border-orange-500/20 p-5 bg-gradient-to-r from-orange-500/[0.08] via-amber-500/[0.04] to-transparent">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award className="text-orange-400" size={18} />
              <h2 className="text-lg font-bold text-white tracking-tight">Workshop Certificate Generator</h2>
              <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                Admin Exclusive
              </span>
            </div>
            <p className="text-xs text-white/60 max-w-2xl leading-relaxed">
              Dynamically maps workshop registrations to high-resolution web certificates. Participant names,
              institutions, and workshop details are placed automatically at exact calibrated coordinates, with
              customizable styles, instant PNG exports, and print/PDF support.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/80 transition-colors hover:border-white/20 hover:text-white"
              title="Download roster of participants with Certificate IDs"
            >
              <FileSpreadsheet size={14} className="text-emerald-400" />
              Export Roster (Excel)
            </button>
            <button
              type="button"
              disabled={bulkDownloading || filteredParticipants.length === 0}
              onClick={handleBulkDownload}
              className="btn-primary inline-flex items-center gap-1.5 text-xs px-4 py-2"
              title="Download certificates for all matching participants"
            >
              <Download size={14} />
              {bulkDownloading ? 'Generating Batch…' : `Bulk Download (${filteredParticipants.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Workshop Dropdown */}
        <div className="min-w-[240px]">
          <select
            value={selectedWorkshopId}
            onChange={(e) => setSelectedWorkshopId(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-xs text-white font-medium outline-none transition-colors focus:border-orange-500/50"
          >
            <option value="all">All Workshops ({eligibleParticipants.length} participants)</option>
            {workshops.map((w) => {
              const count = eligibleParticipants.filter((p) => p.workshopId === w.id).length;
              return (
                <option key={w.id} value={w.id}>
                  {w.title} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search participant name, CNS ID, email, or college…"
            className="w-full rounded-xl border border-white/15 bg-black/40 pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-white/30 outline-none transition-colors focus:border-orange-500/50"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Participants Table */}
      <div className="glass-card overflow-hidden rounded-2xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-white/[0.02] text-[10px] font-bold uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-4 py-3.5">Participant</th>
                <th className="px-4 py-3.5">Attendee ID</th>
                <th className="px-4 py-3.5">College / Institution</th>
                <th className="px-4 py-3.5">Workshop</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/80">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-white/40">
                    No workshop participants match your search or filter.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((item, idx) => (
                  <tr key={`${item.userId}-${item.workshopId}-${idx}`} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-white">{item.name}</div>
                      <div className="text-[11px] text-white/40">{item.email}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-amber-400/90">{item.uniqueCode}</td>
                    <td className="px-4 py-3.5 text-white/60 max-w-[200px] truncate" title={item.college}>
                      {item.college || '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-white/90 font-medium">{item.workshopTitle}</div>
                      <div className="text-[10px] text-white/40">{item.workshopDate}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => openCertificateModal(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 text-[11px] font-semibold text-amber-300 transition-colors hover:bg-orange-500/20 hover:border-orange-500/60"
                      >
                        <Eye size={13} />
                        Preview & Issue
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden offscreen canvas for bulk processing */}
      <canvas ref={hiddenCanvasRef} className="hidden" width={CERT_WIDTH} height={CERT_HEIGHT} />

      {/* Interactive Certificate Customizer & Preview Modal */}
      {activeModalUser && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/90">
          <div className="relative flex flex-col lg:flex-row w-full max-w-7xl max-h-[94vh] overflow-hidden rounded-2xl border border-orange-500/30 bg-[#0C0A09] shadow-2xl">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActiveModalUser(null)}
                className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
              >
                <X size={16} />
              </button>

              {/* Left Side: Live Certificate Canvas View */}
              <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-black/60 border-b lg:border-b-0 lg:border-r border-white/10 overflow-auto">
                <div className="relative w-full max-w-3xl aspect-[2000/1414] rounded-xl overflow-hidden shadow-2xl border border-white/20">
                  <canvas ref={previewCanvasRef} className="w-full h-full object-contain" />
                </div>
                <p className="mt-3 text-[11px] text-white/40 font-mono flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  Live 2000×1414 HD Canvas · Exact Coordinates Pointing at Participant Name
                </p>
              </div>

              {/* Right Side: Customizer & Controls Inspector */}
              <div className="w-full lg:w-[380px] p-5 sm:p-6 flex flex-col overflow-y-auto space-y-4 max-h-[50vh] lg:max-h-full">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sliders size={16} className="text-orange-400" />
                    Certificate Controls
                  </h3>
                  <p className="text-xs text-white/50">Tune dynamic text placement & metadata</p>
                </div>

                {/* Participant Info */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-white/40 mb-1">
                      Participant Name (Target Pointer)
                    </label>
                    <input
                      type="text"
                      value={certConfig.participantName}
                      onChange={(e) => setCertConfig({ ...certConfig, participantName: e.target.value })}
                      className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-orange-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-white/40 mb-1">
                      College / Institution
                    </label>
                    <input
                      type="text"
                      value={certConfig.college}
                      onChange={(e) => setCertConfig({ ...certConfig, college: e.target.value })}
                      className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-orange-500/50"
                    />
                  </div>
                </div>

                {/* Workshop Details */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-white/40 mb-1">
                      Workshop Title
                    </label>
                    <input
                      type="text"
                      value={certConfig.workshopTitle}
                      onChange={(e) => setCertConfig({ ...certConfig, workshopTitle: e.target.value })}
                      className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-orange-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-white/40 mb-1">
                        Event Date
                      </label>
                      <input
                        type="text"
                        value={certConfig.workshopDate}
                        onChange={(e) => setCertConfig({ ...certConfig, workshopDate: e.target.value })}
                        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-orange-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-white/40 mb-1">
                        Issue Date
                      </label>
                      <input
                        type="text"
                        value={certConfig.issueDate}
                        onChange={(e) => setCertConfig({ ...certConfig, issueDate: e.target.value })}
                        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-orange-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Styling & Layout Adjustments */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-white/40 mb-1">
                        Theme
                      </label>
                      <select
                        value={certConfig.theme}
                        onChange={(e) => setCertConfig({ ...certConfig, theme: e.target.value })}
                        className="w-full rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none focus:border-orange-500/50"
                      >
                        <option value="luxury-dark">Obsidian Gold (Dark)</option>
                        <option value="classic-parchment">Ivory Parchment (Light)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-white/40 mb-1">
                        Category
                      </label>
                      <select
                        value={certConfig.certificateType}
                        onChange={(e) => setCertConfig({ ...certConfig, certificateType: e.target.value })}
                        className="w-full rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none focus:border-orange-500/50"
                      >
                        <option value="Certificate of Participation">Participation</option>
                        <option value="Certificate of Completion">Completion</option>
                        <option value="Certificate of Excellence">Excellence</option>
                        <option value="Certificate of Merit">Merit</option>
                      </select>
                    </div>
                  </div>

                  {/* Dynamic Pointer Offset Slider */}
                  <div>
                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-white/40 mb-1">
                      <span>Name Vertical Offset (Pointing Anchor)</span>
                      <span className="font-mono text-amber-300">{certConfig.nameYOffset}px</span>
                    </div>
                    <input
                      type="range"
                      min="-40"
                      max="40"
                      value={certConfig.nameYOffset}
                      onChange={(e) => setCertConfig({ ...certConfig, nameYOffset: Number(e.target.value) })}
                      className="w-full accent-orange-500"
                    />
                  </div>
                </div>

                {/* Certificate ID & Verification */}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/40">Credential ID</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-amber-300 select-all truncate">
                      {certConfig.certificateId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="p-1 rounded text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                      title="Copy ID"
                    >
                      {copiedId ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Download and Print Buttons */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={handleDownloadPNG}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-xs"
                  >
                    <Download size={14} />
                    Download PNG (High-Res 2000×1414)
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl border border-white/20 bg-white/5 text-white/90 hover:bg-white/10 transition-colors"
                  >
                    <Printer size={14} />
                    Print / Save as PDF
                  </button>
                </div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}

