import { ATTENDEE_ID_PREFIX } from './festConfig';

// Human-friendly unique attendee code generator (no ambiguous 0/O/1/I characters)
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateUniqueCode() {
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `${ATTENDEE_ID_PREFIX}-${code}`;
}
