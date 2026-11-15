'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Crown,
  ShieldCheck,
  Loader2,
  Info,
} from 'lucide-react';
import { DHANAK_EVENTS } from '@/lib/dhanakEvents';

/**
 * Resolves the group size for a given cart or checkout item.
 * Looks at item.groupSize or fallback matches in official Dhanak events lineup.
 */
export function getItemGroupSize(item) {
  if (!item) return 1;
  const directSize = Number(item.groupSize || item.group_size);
  if (Number.isFinite(directSize) && directSize > 1) return directSize;

  const eventMatch = DHANAK_EVENTS.find((e) => e.id === item.id);
  if (eventMatch?.groupSize && Number(eventMatch.groupSize) > 1) {
    return Number(eventMatch.groupSize);
  }

  return 1;
}

export default function TeamRosterBuilder({
  items = [],
  profile = null,
  user = null,
  onChange = () => {},
  className = '',
}) {
  // Filter all items in current checkout that require a team
  const groupItems = useMemo(() => {
    return (items || []).filter((item) => getItemGroupSize(item) > 1);
  }, [items]);

  const leaderCode = useMemo(() => {
    return (
      profile?.unique_code ||
      (typeof window !== 'undefined'
        ? window.localStorage.getItem('dhanak_user_code')
        : '') ||
      'DHN-LEADER'
    );
  }, [profile]);

  const leaderName = useMemo(() => {
    return profile?.name || user?.user_metadata?.name || 'You';
  }, [profile, user]);

  // Draft teams state: mapped by eventId
  const [draftTeams, setDraftTeams] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem('dhanak_draft_teams');
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {};
  });

  // Local UI state for adding members: { [eventId]: string }
  const [inputCodes, setInputCodes] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [errorMap, setErrorMap] = useState({});
  const [successMap, setSuccessMap] = useState({});

  // Sync state to localStorage whenever draftTeams changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          'dhanak_draft_teams',
          JSON.stringify(draftTeams)
        );
      } catch {
        // ignore
      }
    }
  }, [draftTeams]);

  // Compute validation across all team items
  useEffect(() => {
    if (groupItems.length === 0) {
      onChange({ teams: {}, isAllTeamsValid: true });
      return;
    }

    let allValid = true;
    const finalTeamsPayload = {};

    for (const item of groupItems) {
      const gSize = getItemGroupSize(item);
      const teamData = draftTeams[item.id] || {
        eventId: item.id,
        eventTitle: item.title,
        groupSize: gSize,
        leaderCode,
        leaderName,
        members: [],
        allowIncomplete: false,
      };

      const totalMembersCount = 1 + (teamData.members?.length || 0);
      const isComplete = totalMembersCount >= gSize;
      const isAllowedPartial = Boolean(teamData.allowIncomplete);

      if (!isComplete && !isAllowedPartial) {
        allValid = false;
      }

      finalTeamsPayload[item.id] = {
        eventId: item.id,
        eventTitle: item.title,
        groupSize: gSize,
        leaderCode,
        leaderName,
        memberCodes: (teamData.members || []).map((m) => m.code),
        members: teamData.members || [],
        allowIncomplete: isAllowedPartial,
        isComplete,
      };
    }

    onChange({ teams: finalTeamsPayload, isAllTeamsValid: allValid });
  }, [groupItems, draftTeams, leaderCode, leaderName, onChange]);

  // Handler: Add a member to a team
  const handleAddMember = async (eventId, requiredSize) => {
    setErrorMap((prev) => ({ ...prev, [eventId]: '' }));
    setSuccessMap((prev) => ({ ...prev, [eventId]: '' }));

    const rawCode = (inputCodes[eventId] || '').trim().toUpperCase();
    if (!rawCode) {
      setErrorMap((prev) => ({
        ...prev,
        [eventId]: 'Please enter a valid DHN-ID or CNS-ID (e.g. DHN-123456).',
      }));
      return;
    }

    const currentTeam = draftTeams[eventId] || {
      eventId,
      groupSize: requiredSize,
      members: [],
      allowIncomplete: false,
    };
    const currentMembers = currentTeam.members || [];

    // Trigger Check 1: Cannot add self / leader
    if (rawCode === leaderCode.toUpperCase()) {
      setErrorMap((prev) => ({
        ...prev,
        [eventId]: 'You are already registered as the Team Leader (Slot 1).',
      }));
      return;
    }

    // Trigger Check 2: Cannot add duplicates
    if (currentMembers.some((m) => m.code.toUpperCase() === rawCode)) {
      setErrorMap((prev) => ({
        ...prev,
        [eventId]: `Teammate (${rawCode}) is already on this team roster.`,
      }));
      return;
    }

    // Trigger Check 3: Cannot exceed capacity
    if (1 + currentMembers.length >= requiredSize) {
      setErrorMap((prev) => ({
        ...prev,
        [eventId]: `Team roster is already full (${requiredSize}/${requiredSize} members).`,
      }));
      return;
    }

    // Trigger Check 4: Validate with backend API (`/api/team?checkCode=...&eventId=...`)
    setLoadingMap((prev) => ({ ...prev, [eventId]: true }));
    try {
      const res = await fetch(
        `/api/team?checkCode=${encodeURIComponent(rawCode)}&eventId=${encodeURIComponent(eventId)}`
      );
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.success || !json.data?.exists) {
        setErrorMap((prev) => ({
          ...prev,
          [eventId]: `No Dhanak account found for ${rawCode}. Please ask your teammate to register/sign in first.`,
        }));
        return;
      }

      if (json.data?.clash) {
        setErrorMap((prev) => ({
          ...prev,
          [eventId]:
            json.data.clashMessage ||
            `${rawCode} is already registered on another team for this event.`,
        }));
        return;
      }

      const verifiedName = json.data?.profile?.name || rawCode;
      const verifiedCode = json.data?.profile?.uniqueCode || rawCode;

      // Append to team state
      const updatedMembers = [
        ...currentMembers,
        {
          code: verifiedCode,
          name: verifiedName,
          addedAt: new Date().toISOString(),
        },
      ];

      setDraftTeams((prev) => ({
        ...prev,
        [eventId]: {
          ...currentTeam,
          eventId,
          groupSize: requiredSize,
          leaderCode,
          leaderName,
          members: updatedMembers,
          // Reset incomplete flag if team is now complete
          allowIncomplete:
            1 + updatedMembers.length >= requiredSize
              ? false
              : currentTeam.allowIncomplete,
        },
      }));

      setInputCodes((prev) => ({ ...prev, [eventId]: '' }));
      setSuccessMap((prev) => ({
        ...prev,
        [eventId]: `Added ${verifiedName} (${verifiedCode}) to your roster!`,
      }));
    } catch (err) {
      setErrorMap((prev) => ({
        ...prev,
        [eventId]: err.message || 'Could not verify teammate. Please try again.',
      }));
    } finally {
      setLoadingMap((prev) => ({ ...prev, [eventId]: false }));
    }
  };

  // Handler: Remove a member
  const handleRemoveMember = (eventId, memberCode) => {
    setDraftTeams((prev) => {
      const current = prev[eventId];
      if (!current) return prev;
      const nextMembers = (current.members || []).filter(
        (m) => m.code !== memberCode
      );
      return {
        ...prev,
        [eventId]: {
          ...current,
          members: nextMembers,
        },
      };
    });
    setSuccessMap((prev) => ({ ...prev, [eventId]: '' }));
    setErrorMap((prev) => ({ ...prev, [eventId]: '' }));
  };

  // Handler: Toggle "Continue Explicitly" with incomplete roster
  const handleToggleAllowIncomplete = (eventId, checked) => {
    setDraftTeams((prev) => {
      const current = prev[eventId] || {
        eventId,
        members: [],
      };
      return {
        ...prev,
        [eventId]: {
          ...current,
          allowIncomplete: checked,
        },
      };
    });
  };

  // If no team events in cart, don't show anything
  if (groupItems.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-orange-500/20 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/30">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
              Team Roster Required
            </h3>
            <p className="text-[11px] text-white/50">
              One or more events in your cart require a team before payment.
            </p>
          </div>
        </div>
        <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-orange-300">
          {groupItems.length} Team Event{groupItems.length > 1 ? 's' : ''}
        </span>
      </div>

      {groupItems.map((item) => {
        const requiredSize = getItemGroupSize(item);
        const teamData = draftTeams[item.id] || {
          eventId: item.id,
          eventTitle: item.title,
          groupSize: requiredSize,
          members: [],
          allowIncomplete: false,
        };

        const members = teamData.members || [];
        const currentCount = 1 + members.length; // Leader + added members
        const isComplete = currentCount >= requiredSize;
        const allowIncomplete = Boolean(teamData.allowIncomplete);
        const inputVal = inputCodes[item.id] || '';
        const isLoading = Boolean(loadingMap[item.id]);
        const errorMsg = errorMap[item.id] || '';
        const successMsg = successMap[item.id] || '';

        return (
          <div
            key={item.id}
            className="rounded-xl border border-white/10 bg-[#0E1015] p-4 text-xs space-y-3.5 shadow-lg"
          >
            {/* Event Header & Progress */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-white text-sm line-clamp-1">
                  {item.title}
                </p>
                <p className="text-[11px] text-white/45">
                  Required Team Size:{' '}
                  <span className="font-semibold text-orange-400">
                    {requiredSize} participants
                  </span>
                </p>
              </div>
              <div className="text-right shrink-0">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold border ${
                    isComplete
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : allowIncomplete
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                        : 'border-orange-500/30 bg-orange-500/10 text-orange-400'
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <Users className="h-3 w-3" />
                  )}
                  {currentCount}/{requiredSize} Members
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isComplete
                    ? 'bg-emerald-500'
                    : allowIncomplete
                      ? 'bg-amber-400'
                      : 'bg-orange-500'
                }`}
                style={{
                  width: `${Math.min(100, (currentCount / requiredSize) * 100)}%`,
                }}
              />
            </div>

            {/* Members Roster List */}
            <div className="space-y-1.5 pt-1">
              {/* Slot 1: Team Leader */}
              <div className="flex items-center justify-between rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">
                      {leaderName}{' '}
                      <span className="font-mono text-amber-300 text-[11px]">
                        ({leaderCode})
                      </span>
                    </p>
                    <p className="text-[10px] text-white/50">Team Leader · Slot 1</p>
                  </div>
                </div>
                <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-orange-300">
                  You
                </span>
              </div>

              {/* Added Teammates */}
              <AnimatePresence>
                {members.map((m, idx) => (
                  <motion.div
                    key={m.code}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0B0D11] px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">
                          {m.name || 'Verified Teammate'}{' '}
                          <span className="font-mono text-amber-300 text-[11px]">
                            ({m.code})
                          </span>
                        </p>
                        <p className="text-[10px] text-white/45">
                          Teammate · Slot {idx + 2} of {requiredSize}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(item.id, m.code)}
                      className="p-1 text-white/40 hover:text-red-400 transition"
                      title="Remove teammate from team"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Add Teammate Input Box (if team not yet full) */}
            {!isComplete && (
              <div className="space-y-2 pt-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setInputCodes((prev) => ({ ...prev, [item.id]: val }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMember(item.id, requiredSize);
                      }
                    }}
                    placeholder={`Teammate ${currentCount + 1} DHN-ID (e.g. DHN-123456)`}
                    className="flex-1 rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-orange-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddMember(item.id, requiredSize)}
                    disabled={isLoading}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-orange-500/40 bg-orange-500/10 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-orange-400 hover:bg-orange-500/20 disabled:opacity-50 transition"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="h-3.5 w-3.5" />
                    )}
                    <span>{isLoading ? 'Checking…' : 'Add'}</span>
                  </button>
                </div>

                {/* Inline Errors & Success */}
                {errorMsg && (
                  <p className="text-[11px] text-red-400 flex items-center gap-1 font-medium">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    <span>{errorMsg}</span>
                  </p>
                )}
                {successMsg && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    <span>{successMsg}</span>
                  </p>
                )}
              </div>
            )}

            {/* Status Feedback Banners */}
            {isComplete ? (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-left text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <p className="text-[11px] font-medium leading-relaxed">
                  <strong>Full Roster Ready:</strong> All {requiredSize} team members have been validated and assigned.
                </p>
              </div>
            ) : (
              /* Trigger 2 & 3: Not Enough Members Warning & Continue Explicitly Trigger */
              <div className="space-y-2 pt-1 border-t border-white/5">
                <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-2.5 text-amber-300 flex items-start gap-2 text-left">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <p className="font-bold text-amber-200">
                      Team Incomplete ({currentCount}/{requiredSize} Members)
                    </p>
                    <p className="text-amber-200/70 mt-0.5">
                      This event requires {requiredSize} participants. You can add the remaining{' '}
                      {requiredSize - currentCount} teammate{requiredSize - currentCount > 1 ? 's' : ''} now, or check the box below to continue.
                    </p>
                  </div>
                </div>

                {/* Explicit Bypass Trigger */}
                <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-white/10 bg-black/40 hover:border-amber-500/30 transition cursor-pointer select-none text-left">
                  <input
                    type="checkbox"
                    checked={allowIncomplete}
                    onChange={(e) =>
                      handleToggleAllowIncomplete(item.id, e.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black accent-orange-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-white">
                      Continue with incomplete team ({currentCount}/{requiredSize})
                    </p>
                    <p className="text-[11px] text-white/50 leading-relaxed mt-0.5">
                      I will add the remaining {requiredSize - currentCount} teammate{requiredSize - currentCount > 1 ? 's' : ''} from my Profile dashboard before fest day.
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

