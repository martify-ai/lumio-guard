import { describe, expect, it } from 'vitest';
import { pickActivities, type Activity } from '../../src/lib/activities';
import {
  advance,
  cleanThresholds,
  dayKey,
  initialState,
  isEntertainmentUrl,
  KEEP_DAYS,
  MINUTE,
  promptMessage,
  recordBreak,
  SESSION_GAP_MS,
  thresholdsValid,
  TICK_CAP_MS,
  todayTotals,
  type WellbeingState,
} from '../../src/lib/wellbeing';

const T0 = new Date(2026, 10, 10, 9, 0, 0).getTime();
const TH = [15, 30, 60];

/** Run one-minute ticks; `active(i)` says whether minute i is active. Returns reminders fired. */
function run(state: WellbeingState, start: number, minutes: number, active: (i: number) => boolean, th: number[] | null = TH) {
  const fired: number[] = [];
  let s = state;
  for (let i = 0; i <= minutes; i++) {
    const r = advance(s, start + i * MINUTE, active(i), th);
    s = r.state;
    if (r.fire !== null) fired.push(r.fire);
  }
  return { state: s, fired };
}

describe('advance — counting time', () => {
  it('counts active minutes', () => {
    const { state } = run(initialState(T0), T0, 10, () => true);
    expect(state.sessionMs).toBe(10 * MINUTE);
    expect(todayTotals(state, T0).activeMs).toBe(10 * MINUTE);
  });
  it('does not count idle time', () => {
    const { state } = run(initialState(T0), T0, 10, (i) => i <= 4 || i >= 8);
    // active 0-4 (4 min), idle 5-7, active 8-10: minute 7→8 is not counted (was idle), 8→10 is.
    expect(state.sessionMs).toBe(6 * MINUTE);
  });
  it('caps a long gap between ticks (sleep, restart) instead of counting it', () => {
    let s = advance(initialState(T0), T0, true, TH).state;
    s = advance(s, T0 + 3 * MINUTE, true, TH).state; // 3 min gap but under session gap
    expect(s.sessionMs).toBe(TICK_CAP_MS);
  });
  it('never counts backwards if the clock moves back', () => {
    let s = advance(initialState(T0), T0, true, TH).state;
    s = advance(s, T0 - MINUTE, true, TH).state;
    expect(s.sessionMs).toBe(0);
  });
});

describe('advance — sessions', () => {
  it('a short pause keeps the session', () => {
    const { state } = run(initialState(T0), T0, 12, (i) => i <= 5 || i >= 9);
    expect(state.sessionMs).toBeGreaterThan(5 * MINUTE);
    expect(state.fired).toEqual([]);
  });
  it(`a pause of ${SESSION_GAP_MS / MINUTE} minutes starts a new session`, () => {
    const a = run(initialState(T0), T0, 20, () => true);
    expect(a.fired).toEqual([15]);
    const b = run(a.state, T0 + 21 * MINUTE, 6, () => false);
    expect(b.state.sessionMs).toBe(0);
    expect(b.state.fired).toEqual([]);
    const c = run(b.state, T0 + 28 * MINUTE, 16, () => true);
    expect(c.fired).toEqual([15]); // the 15-minute reminder can come again in the new session
  });
  it('waking after a long sleep starts a new session', () => {
    const a = run(initialState(T0), T0, 20, () => true);
    const woke = advance(a.state, T0 + 3 * 60 * MINUTE, true, TH);
    expect(woke.state.sessionMs).toBe(0);
    expect(woke.fire).toBeNull();
  });
});

describe('advance — reminders', () => {
  it('fires each threshold once, in order', () => {
    const { fired, state } = run(initialState(T0), T0, 70, () => true);
    expect(fired).toEqual([15, 30, 60]);
    expect(todayTotals(state, T0).prompts).toBe(3);
  });
  it('fires nothing when reminders are off, but still counts time', () => {
    const { fired, state } = run(initialState(T0), T0, 70, () => true, null);
    expect(fired).toEqual([]);
    expect(state.sessionMs).toBe(70 * MINUTE);
  });
  it('shows only the highest reminder if several are crossed at once', () => {
    const s = { ...initialState(T0), sessionMs: 61 * MINUTE, lastActiveAt: T0, wasActive: true };
    const r = advance(s, T0 + 1000, true, TH);
    expect(r.fire).toBe(60);
    expect(r.state.fired.sort()).toEqual([15, 30, 60]);
    expect(advance(r.state, T0 + 2000, true, TH).fire).toBeNull();
  });
  it('does not fire while the person is away', () => {
    const s = { ...initialState(T0), sessionMs: 16 * MINUTE, lastActiveAt: T0, wasActive: true };
    expect(advance(s, T0 + 1000, false, TH).fire).toBeNull();
  });
});

describe('daily totals', () => {
  it('starts a new day at local midnight and keeps only recent days', () => {
    let s = initialState(T0);
    for (let d = 0; d < KEEP_DAYS + 3; d++) {
      const start = T0 + d * 24 * 60 * MINUTE;
      s = run(s, start, 2, () => true).state;
    }
    expect(Object.keys(s.days)).toHaveLength(KEEP_DAYS);
    expect(s.days[dayKey(T0)]).toBeUndefined();
  });
  it('records breaks', () => {
    const s = recordBreak(initialState(T0), T0);
    expect(todayTotals(s, T0).breaks).toBe(1);
  });
  it('stores only numbers: no addresses or site names', () => {
    const { state } = run(initialState(T0), T0, 70, () => true);
    const json = JSON.stringify(state);
    expect(json).not.toMatch(/http|www|\.com/);
  });
});

describe('thresholds', () => {
  it.each([[[15, 30, 60]], [[1, 2, 3]], [[20]], [[5, 10, 15, 20, 600]]])('accepts %j', (v) => {
    expect(thresholdsValid(v)).toBe(true);
    expect(cleanThresholds(v)).toEqual(v);
  });
  it.each([[[30, 15]], [[15, 15]], [[0, 5]], [[1.5, 3]], [[5, 601]], [[]], ['15,30'], [null], [[1, 2, 3, 4, 5, 6]]])(
    'rejects %j and falls back to 15/30/60',
    (v) => {
      expect(thresholdsValid(v)).toBe(false);
      expect(cleanThresholds(v)).toEqual([15, 30, 60]);
    },
  );
});

describe('wording', () => {
  it('gets firmer but never blames', () => {
    const msgs = TH.map((t) => promptMessage(t, TH));
    expect(msgs[0]).toContain('15 minutes');
    expect(msgs[1]).toContain('30 minutes');
    expect(msgs[2]).toContain('an hour');
    for (const m of msgs) expect(m).not.toMatch(/too much|wasting|addict|bad|should not|must/i);
  });
});

describe('isEntertainmentUrl', () => {
  it('matches the listed sites and their subdomains only', () => {
    expect(isEntertainmentUrl('https://www.youtube.com/watch?v=1')).toBe(true);
    expect(isEntertainmentUrl('https://m.tiktok.com/')).toBe(true);
    expect(isEntertainmentUrl('https://x.com/home')).toBe(true);
    expect(isEntertainmentUrl('https://notyoutube.com/')).toBe(false);
    expect(isEntertainmentUrl('https://www.google.com/search?q=youtube.com')).toBe(false);
    expect(isEntertainmentUrl(undefined)).toBe(false);
    expect(isEntertainmentUrl('not a url')).toBe(false);
  });
});

describe('pickActivities', () => {
  const all: Activity[] = ['Move', 'Move', 'Create', 'Rest', 'Learn'].map((group, i) => ({
    id: `a${i}`, group, title: `t${i}`, detail: '',
  }));
  it('picks the asked number, from different groups when it can', () => {
    for (let n = 0; n < 20; n++) {
      const picks = pickActivities(all, 3);
      expect(picks).toHaveLength(3);
      expect(new Set(picks.map((p) => p.group)).size).toBe(3);
    }
  });
  it('avoids what was just shown when enough others exist', () => {
    const picks = pickActivities(all, 2, ['a0', 'a2', 'a3']);
    expect(picks.map((p) => p.id).sort()).toEqual(['a1', 'a4']);
  });
  it('still returns ideas when everything was just shown', () => {
    expect(pickActivities(all, 3, all.map((a) => a.id))).toHaveLength(3);
  });
});
