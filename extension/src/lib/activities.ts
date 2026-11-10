// Picks a few break ideas. Pure, so it can be tested.

export interface Activity {
  id: string;
  group: string;
  title: string;
  detail: string;
}

/**
 * Pick `count` ideas, from different groups where possible, avoiding the ids in
 * `avoid` (what was just shown) when there are enough others.
 */
export function pickActivities(
  all: Activity[],
  count: number,
  avoid: string[] = [],
  random: () => number = Math.random,
): Activity[] {
  const fresh = all.filter((a) => !avoid.includes(a.id));
  const pool = fresh.length >= count ? fresh : all;
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const picked: Activity[] = [];
  for (const a of shuffled) {
    if (picked.length < count && !picked.some((p) => p.group === a.group)) picked.push(a);
  }
  for (const a of shuffled) {
    if (picked.length < count && !picked.includes(a)) picked.push(a);
  }
  return picked;
}
