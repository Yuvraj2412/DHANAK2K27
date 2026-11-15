"use client";

import { useCallback } from "react";

const noop = () => {};

/**
 * useSound hook — sound effects removed per user request.
 * Returns a stable no-op function to safely preserve call-sites without audio output.
 */
export default function useSound() {
  return useCallback(noop, []);
}
