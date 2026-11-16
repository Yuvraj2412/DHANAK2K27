// Single source of truth for "has this attendee filled in their profile?".
// Used by every registration entry point (cards, detail pages, cart, payment)
// and by /api/razorpay/create-order on the server, so nobody can register for
// an event/workshop without a complete profile.

export const PROFILE_REQUIRED_FIELDS = [
  'name',
  'phone',
  'college',
  'college_id',
  'aadhaar_number',
  'gender',
];

export function isProfileComplete(profile) {
  if (!profile || typeof profile !== 'object') return false;
  const hasAll = PROFILE_REQUIRED_FIELDS.every(
    (field) => String(profile[field] ?? '').trim().length > 0
  );
  if (!hasAll) return false;
  const digitsPhone = String(profile.phone || '').replace(/\D/g, '').slice(-10);
  const digitsAadhaar = String(profile.aadhaar_number || '').replace(/\D/g, '');
  return digitsPhone.length === 10 && digitsAadhaar.length === 12;
}

export const PROFILE_INCOMPLETE_MESSAGE =
  'Please complete your profile (name, phone, college, college ID, Aadhaar number and gender) before registering.';

// Window event the global ProfileCompletionModal listens for — fired when a
// user with an incomplete profile tries to register, so the modal re-opens
// even if they dismissed it earlier with "I'll complete this later".
export const PROFILE_REQUIRED_EVENT = 'dhanak:profile-required';

export function promptProfileCompletion() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PROFILE_REQUIRED_EVENT));
}
