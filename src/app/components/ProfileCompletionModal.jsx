"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import useProfile from "../hooks/useProfile";
import useBodyScrollLock from "../hooks/useBodyScrollLock";
import ProfileInstructionsModal, {
  ProfileInstructionsTrigger,
} from "./ProfileInstructionsModal";
import { FEST_NAME, FEST_YEAR } from "@/lib/festConfig";
import { isProfileComplete, PROFILE_REQUIRED_EVENT } from "@/lib/profileCompletion";

export default function ProfileCompletionModal() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") || pathname?.startsWith("/foodfestadmin");
  const { user, signOut } = useAuth();
  const { profile, loading, save } = useProfile();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    college: "",
    collegeId: "",
    aadhaarNumber: "",
    city: "",
    gender: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const missing = !loading && !!user && !isProfileComplete(profile);

  const isOpen = !isAdminRoute && missing;

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return undefined;
    document.body.setAttribute("data-profile-modal-open", "true");
    if (
      typeof window !== "undefined" &&
      !window.sessionStorage.getItem("dhanak_profile_instructions_seen")
    ) {
      window.sessionStorage.setItem("dhanak_profile_instructions_seen", "true");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowInstructions(true);
    }
    return () => {
      document.body.removeAttribute("data-profile-modal-open");
    };
  }, [isOpen]);

  useEffect(() => {
    const reopen = () => {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("dhanak_profile_modal_dismissed");
      }
    };
    window.addEventListener(PROFILE_REQUIRED_EVENT, reopen);
    return () => window.removeEventListener(PROFILE_REQUIRED_EVENT, reopen);
  }, []);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        phone: profile.phone || "",
        college: profile.college || "",
        collegeId: profile.college_id || "",
        aadhaarNumber: profile.aadhaar_number || "",
        city: profile.city || "",
        gender: profile.gender || "",
      });
    } else if (user?.user_metadata) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.user_metadata.name || user.user_metadata.full_name || "",
        phone: prev.phone || user.user_metadata.phone || "",
      }));
    }
  }, [profile, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanPhone = form.phone.replace(/\D/g, "").slice(-10);
    const cleanAadhaar = form.aadhaarNumber.replace(/\D/g, "");

    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!form.college.trim()) {
      setError("Please enter your college name.");
      return;
    }
    if (!form.collegeId.trim()) {
      setError("Please enter your college ID number.");
      return;
    }
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      setError("Aadhaar number must be exactly 12 digits.");
      return;
    }
    if (!form.gender) {
      setError("Please select your gender.");
      return;
    }

    setSaving(true);
    const result = await save({
      name: form.name.trim(),
      phone: cleanPhone,
      college: form.college.trim(),
      college_id: form.collegeId.trim(),
      aadhaar_number: cleanAadhaar,
      city: form.city.trim(),
      gender: form.gender || null,
    });
    setSaving(false);
    if (result.error) setError(result.error);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/80 p-4 pt-20 backdrop-blur-md sm:p-6 sm:pt-24 lg:pt-28"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-amber-500/25 bg-[#0F0A07] p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.85)]"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-400 font-bold mb-2">
                {FEST_NAME} {FEST_YEAR} · Mandatory Attendee Profile
              </p>
              <h2 className="mb-2 text-xl font-bold text-white sm:text-2xl tracking-tight">
                Complete Your Profile
              </h2>
              <p className="mb-3 text-xs sm:text-sm text-white/60 leading-relaxed">
                Completing your profile is required before registering for {FEST_NAME} workshops and events. Physical ID verification happens at the fest registration desk.
              </p>
              <ProfileInstructionsTrigger
                onClick={() => setShowInstructions(true)}
                className="mb-5"
              />

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <Field label="Full Name *">
                  <input
                    required
                    autoFocus
                    placeholder="Your Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400 transition-colors"
                  />
                </Field>

                <Field label="Mobile Phone Number *">
                  <div className="flex gap-2">
                    <span className="flex items-center rounded-xl border border-white/15 bg-black/50 px-3 text-xs font-mono text-amber-300">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      required
                      placeholder="9876543210"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                      }
                      className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm font-mono text-white outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                </Field>

                <Field label="College Name *">
                  <input
                    required
                    placeholder="Institute / College Name"
                    value={form.college}
                    onChange={(e) => setForm({ ...form, college: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400 transition-colors"
                  />
                </Field>

                <Field label="College ID Number *">
                  <input
                    required
                    placeholder="Roll Number / College ID"
                    value={form.collegeId}
                    onChange={(e) => setForm({ ...form, collegeId: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400 transition-colors"
                  />
                </Field>

                <Field label="Aadhaar Number (12 Digits) *">
                  <input
                    required
                    inputMode="numeric"
                    maxLength={12}
                    placeholder="12-digit Aadhaar number"
                    value={form.aadhaarNumber}
                    onChange={(e) =>
                      setForm({ ...form, aadhaarNumber: e.target.value.replace(/\D/g, "").slice(0, 12) })
                    }
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm font-mono text-white outline-none focus:border-amber-400 transition-colors"
                  />
                </Field>

                <Field label="City (Optional)">
                  <input
                    placeholder="City of Residence"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400 transition-colors"
                  />
                </Field>

                <Field label="Gender *">
                  <select
                    required
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-[#140D09] px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400 transition-colors"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="rather_not_say">Prefer not to say</option>
                  </select>
                </Field>

                {error && (
                  <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-black shadow-lg shadow-orange-500/25 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Saving Details…" : "Save & Continue ›"}
                </button>

                <button
                  type="button"
                  onClick={() => signOut()}
                  className="w-full text-center text-xs text-white/45 hover:text-white/80 transition-colors pt-1 cursor-pointer"
                >
                  Sign out / use a different account
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProfileInstructionsModal
        open={isOpen && showInstructions}
        onClose={() => setShowInstructions(false)}
      />
    </>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-mono uppercase tracking-[0.2em] text-white/50">
        {label}
      </label>
      {children}
    </div>
  );
}
