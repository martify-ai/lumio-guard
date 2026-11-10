// Wellbeing timer logic. Pure functions only: no Chrome calls, easy to test.
//
// What is measured: time this browser is actively used. Never which sites.
// "Active" is decided by the caller (see wellbeing-runtime.ts) and passed in.

export const MINUTE = 60_000;
/** Most time one tick may add. Longer gaps mean we were not running (sleep, restart). */
export const TICK_CAP_MS = 90_000;
/** A session ends after this long with no activity. */
export const SESSION_GAP_MS = 5 * MINUTE;
export const DEFAULT_THRESHOLDS = [15, 30, 60];
/** How many past days of totals are kept on this computer. */
export const KEEP_DAYS = 7;

/** Sites where the reminder may appear on the page itself. Elsewhere it is a notification. */
export const ENTERTAINMENT_DOMAINS = [
  'youtube.com',
  'tiktok.com',
  'instagram.com',
  'facebook.com',
  'x.com',
  'twitter.com',
];

export interface DayTotals {
  activeMs: number;
  prompts: number;
  breaks: number;
}

export interface WellbeingState {
  /** active time in the current session */
  sessionMs: number;
  lastTickAt: number;
  lastActiveAt: number;
  wasActive: boolean;
  /** thresholds (minutes) already shown this session */
  fired: number[];
  /** local date (YYYY-MM-DD) → totals. Counts only; no sites, no times of day. */
  days: Record<string, DayTotals>;
}

export function initialState(now: number): WellbeingState {
  return { sessionMs: 0, lastTickAt: now, lastActiveAt: 0, wasActive: false, fired: [], days: {} };
}

export function dayKey(now: number): string {
  const d = new Date(now);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function today(state: WellbeingState, now: number): DayTotals {
  const key = dayKey(now);
  state.days[key] ??= { activeMs: 0, prompts: 0, breaks: 0 };
  const keep = Object.keys(state.days).sort().slice(-KEEP_DAYS);
  for (const k of Object.keys(state.days)) if (!keep.includes(k)) delete state.days[k];
  return state.days[key];
}

export function todayTotals(state: WellbeingState, now: number): DayTotals {
  return state.days[dayKey(now)] ?? { activeMs: 0, prompts: 0, breaks: 0 };
}

/** 1–5 whole-minute values, each 1–600, strictly rising. */
export function thresholdsValid(input: unknown): input is number[] {
  return (
    Array.isArray(input) &&
    input.length >= 1 &&
    input.length <= 5 &&
    input.every((v, i) => Number.isInteger(v) && v >= 1 && v <= 600 && (i === 0 || v > input[i - 1]))
  );
}

/** The given thresholds if valid, otherwise the defaults. */
export function cleanThresholds(input: unknown): number[] {
  return thresholdsValid(input) ? [...input] : [...DEFAULT_THRESHOLDS];
}

export interface Advance {
  state: WellbeingState;
  /** threshold (minutes) to show a reminder for now, or null */
  fire: number | null;
}

/** Move the timer forward to `now`. `thresholds` is null when reminders are switched off. */
export function advance(
  prev: WellbeingState,
  now: number,
  activeNow: boolean,
  thresholds: number[] | null,
): Advance {
  const s: WellbeingState = { ...prev, fired: [...prev.fired], days: structuredClone(prev.days) };
  const sinceActive = now - s.lastActiveAt;

  if (sinceActive >= SESSION_GAP_MS) {
    s.sessionMs = 0;
    s.fired = [];
  } else if (activeNow && s.wasActive) {
    const add = Math.min(Math.max(now - s.lastTickAt, 0), TICK_CAP_MS);
    s.sessionMs += add;
    today(s, now).activeMs += add;
  }
  if (activeNow) s.lastActiveAt = now;
  s.wasActive = activeNow;
  s.lastTickAt = now;

  let fire: number | null = null;
  if (thresholds && activeNow) {
    const crossed = thresholds.filter((t) => s.sessionMs >= t * MINUTE && !s.fired.includes(t));
    if (crossed.length) {
      fire = Math.max(...crossed);
      s.fired.push(...crossed);
      today(s, now).prompts += 1;
    }
  }
  return { state: s, fire };
}

export function recordBreak(prev: WellbeingState, now: number): WellbeingState {
  const s: WellbeingState = { ...prev, days: structuredClone(prev.days) };
  today(s, now).breaks += 1;
  return s;
}

export function minutesText(mins: number): string {
  if (mins === 60) return 'an hour';
  if (mins > 60 && mins % 60 === 0) return `${mins / 60} hours`;
  return `${mins} minutes`;
}

/**
 * Reminder wording. Calm, never blaming. The first reminder is the lightest and
 * the last is the firmest; none of them stops the person from carrying on.
 */
export function promptMessage(threshold: number, thresholds: number[]): string {
  const i = thresholds.indexOf(threshold);
  const time = minutesText(threshold);
  if (i <= 0) return `You've been browsing for ${time}. Still doing what you came to do?`;
  if (i < thresholds.length - 1) return `That's ${time} of browsing. A short break might feel good.`;
  return `You've been browsing for ${time}. This is a good moment for a longer break.`;
}

export const BREAK_LABEL = 'Take a break';
export const CONTINUE_LABEL = 'Keep going';

/** True when the address is one of the entertainment sites (or a subdomain). */
export function isEntertainmentUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return ENTERTAINMENT_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

export function wholeMinutes(ms: number): number {
  return Math.floor(ms / MINUTE);
}
