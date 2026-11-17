"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Check,
  Calendar,
  Clock,
  MapPin,
  Users,
  Award,
  ArrowLeft,
  Phone,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  FileText,
  Download,
  ExternalLink,
  Wrench,
  Target,
  Building2,
  ListChecks,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import FetchIntro from "@/app/components/FetchIntro";
import ChunkyImage from "@/app/components/ChunkyImage";
import { getCatalog, getCatalogItem } from "@/lib/catalogStore";
import { getWorkshopComboHint } from "@/lib/workshopCombos";
import { isProfileComplete, promptProfileCompletion } from "@/lib/profileCompletion";
import useSound from "@/app/hooks/useSound";
import { useAuth } from "@/app/context/AuthContext";
import { useCart } from "@/app/context/CartContext";
import useProfile from "@/app/hooks/useProfile";
import { showCartToast } from "@/lib/cartToast";
import { parsePriceLabel } from "@/lib/parsePriceLabel";
import useCapacity from "@/app/hooks/useCapacity";
import TeamReminderModal from "@/app/components/TeamReminderModal";
import LavaWorkshopTile from "@/app/components/LavaWorkshopTile";
import FaqSection from "@/app/components/FaqSection";
import { supabase } from "@/lib/supabaseClient";

function ExpandableSection({
  icon: Icon,
  title,
  subtitle,
  badge,
  defaultOpen = false,
  children,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="transition-colors duration-200 hover:bg-white/[0.015]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-4 p-5 sm:px-7 sm:py-5 text-left cursor-pointer select-none group"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/25 to-amber-500/10 border border-amber-400/35 flex items-center justify-center text-amber-300 shadow-[0_0_16px_rgba(255,140,0,0.2)] shrink-0">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-amber-200 transition-colors">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-amber-400/70 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {badge && (
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold text-amber-200/80 bg-amber-500/10 border border-amber-500/25">
              {badge}
            </span>
          )}
          <span className="w-8 h-8 rounded-lg border border-amber-500/25 bg-white/[0.03] group-hover:border-amber-400/50 flex items-center justify-center text-amber-300 transition-colors">
            <ChevronDown
              size={16}
              className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            />
          </span>
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ease-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-5 sm:px-7 pb-6 pt-1">{children}</div>
        </div>
      </div>
    </section>
  );
}

export default function WorkshopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const [card, setCard] = useState(null);
  const [relatedWorkshops, setRelatedWorkshops] = useState([]);
  const [cardLoading, setCardLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCardLoading(true);
    Promise.all([getCatalogItem("workshop", id), getCatalog("workshop")]).then(
      ([found, allWorkshops]) => {
        if (!active) return;
        setCard(found);
        if (found && Array.isArray(allWorkshops)) {
          setRelatedWorkshops(
            allWorkshops.filter((w) => w.id !== found.id).slice(0, 3)
          );
        }
        setCardLoading(false);
      }
    );
    return () => {
      active = false;
    };
  }, [id]);

  const { user } = useAuth();
  const { addItem, hasItem } = useCart();
  const { profile } = useProfile();
  const [paidWorkshopIds, setPaidWorkshopIds] = useState([]);

  useEffect(() => {
    if (!user?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPaidWorkshopIds([]);
      return;
    }
    fetch(`/api/get-registrations?user_id=${encodeURIComponent(user.id)}`)
      .then((res) => res.json())
      .then((json) => {
        const reg = json?.data;
        if (reg?.payment_status === "paid" && Array.isArray(reg.workshop_ids)) {
          setPaidWorkshopIds(reg.workshop_ids);
        } else {
          setPaidWorkshopIds([]);
        }
      })
      .catch(() => setPaidWorkshopIds([]));
  }, [user?.id]);

  const isRegistered = card ? paidWorkshopIds.includes(card.id) : false;

  const [teamIncomplete, setTeamIncomplete] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);

  useEffect(() => {
    if (!isRegistered || !card || Number(card.groupSize) <= 1 || !user?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTeamIncomplete(false);
      return;
    }
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) return;
      const res = await fetch(`/api/team?eventId=${encodeURIComponent(card.id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (active && json.success) {
        setTeamIncomplete(!json.data?.team?.confirmed);
      }
    })();
    return () => {
      active = false;
    };
  }, [isRegistered, card, user?.id]);

  const { remaining } = useCapacity();
  const isClosed = !isRegistered && remaining(card) <= 0;

  const playClick = useSound("/sounds/click.wav", 0.1, 0.08);

  const cartKey = card ? `workshop:${card.id}` : null;
  const inCart = cartKey ? hasItem(cartKey) : false;

  const toCartItem = () => ({
    key: cartKey,
    id: card.id,
    kind: "workshop",
    ticketId: card.ticketId,
    title: card.title,
    subtitle: card.subtitle,
    priceLabel: card.price,
    unitPrice: parsePriceLabel(card.price),
    image: card.image,
    accentColor: card.accentColor,
  });

  const handleAddToCart = () => {
    if (!card || inCart || isClosed || isRegistered) return;
    playClick();
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/workshop/${card.id}`)}`);
      return;
    }
    if (!isProfileComplete(profile)) {
      showCartToast("Please complete your profile before registering");
      promptProfileCompletion();
      router.push("/profile");
      return;
    }
    addItem(toCartItem());
    showCartToast("Workshop added to cart");
  };

  const handleRegisterNow = async () => {
    playClick();
    if (!card || isClosed || inCart || isRegistered) return;
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/workshop/${card.id}`)}`);
      return;
    }
    if (!isProfileComplete(profile)) {
      showCartToast("Please complete your profile before registering");
      promptProfileCompletion();
      router.push("/profile");
      return;
    }
    await addItem(toCartItem());
    showCartToast("Added to cart — proceeding to checkout");
    router.push("/cart");
  };

  if (cardLoading) {
    return <FetchIntro loading label="Loading Workshop" accentColor="#FF7A00" />;
  }

  if (!card) {
    return (
      <div className="relative min-h-screen bg-[#080604] text-white flex items-center justify-center px-4">
        <div className="relative z-10 text-center max-w-md">
          <h1 className="text-3xl font-bold mb-3">Workshop Not Found</h1>
          <p className="text-white/65 mb-6">
            The requested workshop could not be located in the Dhanak 2027 catalog.
          </p>
          <Link
            href="/workshop"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 bg-gradient-to-r from-[#FF4500] to-[#FFB300] text-black font-bold text-sm hover:brightness-110 transition"
          >
            <ArrowLeft size={16} />
            Back to Workshops
          </Link>
        </div>
      </div>
    );
  }

  const isLocalBrochure =
    typeof card.brochureUrl === "string" && card.brochureUrl.startsWith("/");

  const specs = [
    { label: "Domain", value: card.section || card.type || "Technical Workshop" },
    { label: "Level / Type", value: card.level || card.type || "Basic" },
    { label: "Format", value: card.format || "Online Live Interactive Session" },
    { label: "Date", value: card.eventDate || "Dhanak 2027" },
    { label: "Schedule & Timing", value: card.timing || "10:00 AM – 05:00 PM IST" },
    { label: "Venue / Platform", value: card.venue || "Online Live Session" },
    { label: "Registration Fee", value: card.price || "₹299" },
    {
      label: "Certificate",
      value: card.certificate || "Official IIST Dhanak Certificate Included",
    },
  ];

  const defaultWorkshopFaqs = [
    {
      q: "How do I register for this workshop?",
      a: "Click 'Add to Cart' or 'Register Now' on the sidebar, proceed to checkout, and complete your registration. You will receive an instant confirmation email with your booking receipt and DHN-ID.",
    },
    {
      q: "Will I receive an official certificate?",
      a: `Yes! Every registered participant who attends the workshop will be awarded an official Certificate of Participation from IIST (${card.certificate || "Indian Institute of Space Science and Technology"}).`,
    },
    {
      q: "Can students from any school, college, or stream participate?",
      a: "Yes. Registrations are open to school students (classes 8–12), undergraduate and postgraduate students from any recognized institution, polytechnics, and technology enthusiasts.",
    },
    {
      q: "What are the software tools or hardware requirements?",
      a: card.softwareAndTools
        ? `This workshop works with: ${card.softwareAndTools}. Detailed installation steps and guides will be shared with registered participants prior to the session.`
        : "All necessary open-source software, simulator links, and installation steps will be shared with registered participants prior to the session.",
    },
    {
      q: "How will I join the session or access the venue?",
      a: `The workshop is scheduled as ${card.venue || "an Online Live Interactive Session"}. For online sessions, secure access links (Google Meet/Zoom) will be emailed 24 hours prior. For on-campus sessions, report to the designated IIST venue with your registration pass.`,
    },
    {
      q: "Can I enroll in multiple workshops or events?",
      a: "Absolutely! All workshops and events are standalone modules. You can enroll in multiple sessions across the festival as long as their scheduled timings do not clash.",
    },
    {
      q: "Are session recordings or study materials provided?",
      a: "Live participation is mandatory for hands-on certification. Presentation decks, reference documents, and code notebooks will be shared with all registered participants after the session.",
    },
    {
      q: "What is the refund and cancellation policy?",
      a: "In accordance with festival policy, registrations are strictly non-refundable and non-transferable once confirmed.",
    },
    {
      q: "Who should I contact if I have further questions?",
      a: "Feel free to reach out directly to the workshop student coordinators listed below or contact us via our Contact Us page for any questions or support.",
    },
  ];

  const workshopFaqs =
    Array.isArray(card.faqs) && card.faqs.length > 0
      ? card.faqs
      : defaultWorkshopFaqs;

  return (
    <div className="relative min-h-screen bg-[#080604] text-white overflow-x-hidden">
      {/* Top Warm Ambient Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[85vw] h-[380px] z-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 45% at 50% 0%, rgba(255, 115, 0, 0.14) 0%, transparent 75%)",
        }}
      />

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-24">
        {/* ── Top Breadcrumb Bar ──────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/workshop"
            onClick={() => playClick()}
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-[#160D08]/90 px-4 py-1.5 text-xs sm:text-sm font-semibold text-amber-200 hover:border-amber-400/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={15} />
            <span>Back to All Workshops</span>
          </Link>

          <span className="text-xs font-mono uppercase tracking-widest text-amber-300/65 hidden sm:inline">
            Dhanak 2027 · Masterclass Series
          </span>
        </div>

        {/* ── Unified Hero Banner with Warm Ember-Gold Finish ── */}
        <section className="relative rounded-2xl bg-gradient-to-br from-[#1B100A]/95 via-[#130C08]/95 to-[#0D0806]/95 border border-amber-500/25 overflow-hidden mb-8 shadow-[0_20px_60px_rgba(0,0,0,0.75)]">
          {/* Top Golden-Ember Shimmer Line */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />

          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left: Title, Subtitle & Key Pills */}
            <div className="lg:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-gradient-to-r from-orange-500/20 to-amber-500/15 text-amber-300 border border-amber-400/35">
                  {card.badgeIcon && <span>{card.badgeIcon}</span>}
                  <span>{card.type || card.section || "Workshop"}</span>
                </span>
                {card.eventDate && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-white/[0.06] text-amber-200 border border-amber-500/25">
                    <Calendar size={13} className="text-amber-400" />
                    <span>{card.eventDate}</span>
                  </span>
                )}
              </div>

              <h1
                className="text-2xl sm:text-4xl font-black tracking-tight leading-tight mb-3"
                style={{
                  background: "linear-gradient(135deg, #FFFFFF 0%, #FFE599 65%, #FFB300 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {card.title}
              </h1>

              {card.subtitle && (
                <p className="text-sm sm:text-base text-white/80 leading-relaxed mb-5">
                  {card.subtitle}
                </p>
              )}

              {/* Brochure & Syllabus Action Bar in Hero */}
              {(card.brochureUrl || card.syllabusPdfUrl) && (
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  {card.brochureUrl && (
                    <a
                      href={card.brochureUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={isLocalBrochure ? true : undefined}
                      onClick={() => playClick()}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500/25 to-orange-500/20 hover:from-amber-500/35 hover:to-orange-500/30 border border-amber-400/50 px-4 py-2.5 text-xs sm:text-sm font-bold text-amber-200 hover:text-white transition-all shadow-[0_0_20px_rgba(255,160,0,0.2)]"
                    >
                      <Download size={16} className="text-amber-400 shrink-0" />
                      <span>Download / View Brochure</span>
                      <ExternalLink size={13} className="text-amber-300/70 shrink-0" />
                    </a>
                  )}
                  {card.syllabusPdfUrl && (
                    <a
                      href={card.syllabusPdfUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => playClick()}
                      className="inline-flex items-center gap-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white/90 hover:text-white transition-all"
                    >
                      <FileText size={15} className="text-amber-400 shrink-0" />
                      <span>Download Detailed Guide (PDF)</span>
                    </a>
                  )}
                </div>
              )}

              {/* Clean Metadata Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5 border-t border-amber-500/15 text-xs sm:text-sm">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-amber-500/15">
                  <Clock size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-amber-300/65 font-semibold">
                      Schedule & Timings
                    </p>
                    <p className="font-semibold text-white break-words mt-0.5">
                      {card.timing || card.eventDate || "Dhanak 2027"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-amber-500/15">
                  <MapPin size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-amber-300/65 font-semibold">
                      Mode / Venue
                    </p>
                    <p className="font-semibold text-white break-words mt-0.5">
                      {card.venue || "Online Live Session"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Cover Image with Adaptive Chunky Loading */}
            <div className="lg:col-span-5 relative min-h-[250px] sm:min-h-[310px] bg-black">
              {card.image && (
                <ChunkyImage
                  src={card.image}
                  alt={card.title}
                  priority
                  targetWidth={1080}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#130C08] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#130C08] lg:via-transparent lg:to-transparent pointer-events-none" />
            </div>
          </div>
        </section>

        {/* ── Main 2-Column Content & Sticky Registration Sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 Cols): Clean & Minimalist Expandable Editorial Card */}
          <div
            key={card.id}
            className="lg:col-span-8 rounded-2xl bg-[#130D09]/95 border border-amber-500/20 divide-y divide-amber-500/15 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.7)]"
          >
            {/* 1. Overview (expanded by default) */}
            <ExpandableSection
              icon={FileText}
              title="Workshop Overview"
              subtitle="About the Masterclass"
              defaultOpen={true}
            >
              <div className="space-y-4 text-sm sm:text-[15px] text-white/90 leading-relaxed">
                {card.description && <p>{card.description}</p>}
                {Array.isArray(card.aboutExtra) &&
                  card.aboutExtra.map((para, i) => (
                    <p key={i} className="text-white/80">
                      {para}
                    </p>
                  ))}
              </div>
            </ExpandableSection>

            {/* 2. Organizing Club Section (if applicable) */}
            {(card.clubName || card.clubDescription) && (
              <ExpandableSection
                icon={Building2}
                title="Organizing Club"
                subtitle="Host Community at IIST"
                badge="IIST Club"
              >
                <div className="flex flex-col sm:flex-row items-start gap-5 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-[#1C120B] to-[#120B07] border border-amber-500/20">
                  {card.clubLogo && (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black/60 border border-amber-500/25 p-1.5 shrink-0">
                      <ChunkyImage
                        src={card.clubLogo}
                        alt={card.clubName || "Club Logo"}
                        targetWidth={128}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="space-y-2 min-w-0">
                    {card.clubName && (
                      <h3 className="text-base sm:text-lg font-bold text-amber-300">
                        {card.clubName}
                      </h3>
                    )}
                    {card.clubDescription && (
                      <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                        {card.clubDescription}
                      </p>
                    )}
                  </div>
                </div>
              </ExpandableSection>
            )}

            {/* 3. Key Takeaways & Curriculum Modules */}
            {Array.isArray(card.highlights) && card.highlights.length > 0 && (
              <ExpandableSection
                icon={Sparkles}
                title="What You Will Learn"
                subtitle="Curriculum & Technical Topics"
                badge={`${card.highlights.length} Topics`}
              >
                <div className="grid grid-cols-1 gap-3.5">
                  {card.highlights.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-[#1E130C] to-[#140D08] border border-amber-500/20 hover:border-amber-400/45 transition-colors"
                    >
                      <CheckCircle2
                        size={17}
                        className="text-amber-400 shrink-0 mt-0.5"
                      />
                      <span className="text-xs sm:text-sm text-white/90 leading-relaxed break-words">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </ExpandableSection>
            )}

            {/* 4. Detailed Execution Timeline / Schedule (if present) */}
            {Array.isArray(card.schedule) && card.schedule.length > 0 && (
              <ExpandableSection
                icon={ListChecks}
                title="Workshop Schedule & Timeline"
                subtitle="Session-by-Session Flow"
                badge={`${card.schedule.length} Sessions`}
              >
                <div className="space-y-2.5">
                  {card.schedule.map((slot, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-white/[0.025] border border-amber-500/15"
                    >
                      <span className="text-xs font-mono font-bold text-amber-300 shrink-0">
                        {slot.time}
                      </span>
                      <span className="text-xs sm:text-sm text-white/90 sm:text-right">
                        {slot.activity}
                      </span>
                    </div>
                  ))}
                </div>
              </ExpandableSection>
            )}

            {/* 5. Software & Tools (if present) */}
            {card.softwareAndTools && (
              <ExpandableSection
                icon={Wrench}
                title="Software & Tools"
                subtitle="Environment & Stack"
                badge="Tools"
              >
                <div className="p-4 rounded-xl bg-white/[0.03] border border-amber-500/20 text-xs sm:text-sm text-white/90 leading-relaxed">
                  {card.softwareAndTools}
                </div>
              </ExpandableSection>
            )}

            {/* 6. Prerequisites & Guidelines */}
            {Array.isArray(card.requirements) && card.requirements.length > 0 && (
              <ExpandableSection
                icon={ShieldCheck}
                title="Eligibility & Prerequisites"
                subtitle="Who Can Attend"
                badge={`${card.requirements.length} Requirements`}
              >
                <ul className="space-y-3">
                  {card.requirements.map((req, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.06] text-xs sm:text-sm text-white/90 leading-relaxed"
                    >
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500/30 to-amber-500/15 border border-amber-400/40 text-[11px] font-mono font-bold text-amber-300 shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="break-words">{req}</span>
                    </li>
                  ))}
                </ul>
              </ExpandableSection>
            )}

            {/* 7. Expected Learning Outcomes (if present) */}
            {Array.isArray(card.outcomes) && card.outcomes.length > 0 && (
              <ExpandableSection
                icon={Target}
                title="Expected Learning Outcomes"
                subtitle="Skills You Will Gain"
                badge={`${card.outcomes.length} Outcomes`}
              >
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {card.outcomes.map((outcome, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-amber-500/15 text-xs sm:text-sm text-white/90 leading-relaxed"
                    >
                      <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </ExpandableSection>
            )}

            {/* 8. Workshop Specifications Grid */}
            <ExpandableSection
              icon={Award}
              title="Workshop Specifications"
              subtitle="Session Details"
              badge={`${specs.length} Details`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {specs.map((s) => (
                  <div
                    key={s.label}
                    className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] border-l-2 border-l-amber-500/70 flex flex-col gap-1"
                  >
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-300/70">
                      {s.label}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-white leading-snug break-words">
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </ExpandableSection>

            {/* 9. Frequently Asked Questions */}
            <ExpandableSection
              icon={HelpCircle}
              title="Frequently Asked Questions"
              subtitle="Everything You Need to Know"
              badge={`${workshopFaqs.length} FAQs`}
            >
              <FaqSection faqs={workshopFaqs} hideHeader={true} />
            </ExpandableSection>

            {/* 10. Point of Contact */}
            {Array.isArray(card.contacts) && card.contacts.length > 0 && (
              <ExpandableSection
                icon={Phone}
                title="Workshop Coordinators"
                subtitle="Direct Support"
                badge={`${card.contacts.length} Contacts`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {card.contacts.map((c, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-gradient-to-br from-[#1C120B] to-[#130C08] border border-amber-500/20 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {c.name}
                        </p>
                        <p className="text-xs text-white/60 truncate mt-0.5">
                          {c.role}
                        </p>
                        {c.phone && (
                          <p className="text-xs font-mono text-amber-400 mt-1">
                            {c.phone}
                          </p>
                        )}
                      </div>
                      {c.phone && (
                        <a
                          href={`tel:${c.phone.replace(/\s+/g, "")}`}
                          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-3.5 py-2 text-xs font-bold text-black hover:brightness-110 transition"
                        >
                          <Phone size={13} />
                          <span>Call</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </ExpandableSection>
            )}
          </div>

          {/* Right Column (4 Cols): Sticky Registration Sidebar */}
          <aside className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="rounded-2xl bg-gradient-to-b from-[#1B110B]/95 to-[#120B07]/95 border border-amber-500/30 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
              {/* Top Golden-Orange Accent Bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#FF4500] via-[#FF9800] to-[#FFD54F]" />

              <div className="p-6 space-y-6">
                {/* Price & Status */}
                <div className="flex items-baseline justify-between gap-3 pb-5 border-b border-amber-500/15">
                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-300/70 mb-1">
                      Registration Fee
                    </p>
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-3xl font-black text-white">
                        {card.price || "₹299"}
                      </span>
                      {card.strikePrice && (
                        <span className="text-sm text-white/40 line-through">
                          {card.strikePrice}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/35">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {isClosed ? "Closed" : "Open"}
                  </span>
                </div>

                {/* Combo Offer Note */}
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-3.5 py-2.5 text-[11px] leading-relaxed text-emerald-200">
                  {getWorkshopComboHint(card.id).message}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {isRegistered ? (
                    <div className="w-full py-3.5 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                      <Check size={16} />
                      <span>Registered</span>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={isClosed}
                        onClick={handleRegisterNow}
                        className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#FF4500] via-[#FF7A00] to-[#FFB300] hover:brightness-110 disabled:opacity-50 text-black text-sm font-extrabold uppercase tracking-wider transition-all shadow-[0_8px_28px_rgba(255,90,0,0.35)] cursor-pointer"
                      >
                        {isClosed ? "Registrations Closed" : "Register Now ›"}
                      </button>

                      <button
                        type="button"
                        disabled={isClosed || inCart}
                        onClick={handleAddToCart}
                        className="w-full py-3 px-5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-amber-500/25 text-amber-100 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        {inCart ? (
                          <>
                            <Check size={15} className="text-emerald-400" />
                            <span>Added to Cart</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={15} className="text-amber-400" />
                            <span>Add to Cart</span>
                          </>
                        )}
                      </button>
                    </>
                  )}

                  {/* Download Brochure Button in Sidebar */}
                  {card.brochureUrl && (
                    <a
                      href={card.brochureUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={isLocalBrochure ? true : undefined}
                      onClick={() => playClick()}
                      className="w-full py-3 px-5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/40 text-amber-200 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                    >
                      <Download size={15} className="text-amber-400 shrink-0" />
                      <span>Download Brochure</span>
                    </a>
                  )}

                  {/* Download Detailed Curriculum Guide PDF if available */}
                  {card.syllabusPdfUrl && (
                    <a
                      href={card.syllabusPdfUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => playClick()}
                      className="w-full py-2.5 px-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/15 text-white/80 hover:text-white text-[11px] font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                    >
                      <FileText size={14} className="text-amber-400 shrink-0" />
                      <span>Download Curriculum PDF</span>
                    </a>
                  )}
                </div>

                {/* Stacked Summary Info */}
                <div className="space-y-3.5 pt-5 border-t border-amber-500/15 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/12 border border-orange-400/25 text-amber-300 shrink-0">
                      <Calendar size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-amber-300/65">
                        Date & Timings
                      </p>
                      <p className="text-white font-semibold mt-0.5 break-words">
                        {card.timing || card.eventDate || "Dhanak 2027"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/12 border border-orange-400/25 text-amber-300 shrink-0">
                      <MapPin size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-amber-300/65">
                        Mode
                      </p>
                      <p className="text-white font-semibold mt-0.5 break-words">
                        {card.venue || "Online Live Session"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/12 border border-orange-400/25 text-amber-300 shrink-0">
                      <Users size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-amber-300/65">
                        Level
                      </p>
                      <p className="text-white font-semibold mt-0.5 break-words">
                        {card.level ? `${card.level} Track` : card.type || "Open Enrollment"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/12 border border-orange-400/25 text-amber-300 shrink-0">
                      <Award size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-amber-300/65">
                        Certification
                      </p>
                      <p className="text-white font-semibold mt-0.5 break-words">
                        {card.certificate || "Official IIST Dhanak Certificate"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* ── More Workshops Section ─────────────────────────── */}
        {relatedWorkshops.length > 0 && (
          <section className="mt-16 pt-12 border-t border-amber-500/15">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                More Workshops
              </h2>
              <Link
                href="/workshop"
                className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 hover:underline"
              >
                View all workshops ›
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedWorkshops.map((w) => (
                <LavaWorkshopTile key={w.id} workshop={w} />
              ))}
            </div>
          </section>
        )}
      </main>

      {showTeamModal && (
        <TeamReminderModal
          open={showTeamModal}
          onClose={() => setShowTeamModal(false)}
          event={card}
        />
      )}
    </div>
  );
}
