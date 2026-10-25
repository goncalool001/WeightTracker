/**
 * Note categories: reasons a weigh-in may sit off its trend. They are stored
 * on a weigh-in as stable ids (`WeightEntry.tags`), so the same reason reads
 * the same in English and Portuguese and can be analysed. Labels live in i18n.
 */

export const CATEGORY_GROUPS = [
  {
    id: 'food',
    items: ['clean_day', 'late_meal', 'big_meal', 'salty', 'carbs', 'alcohol', 'fasting', 'restaurant'],
  },
  { id: 'hydration', items: ['low_water', 'heat'] },
  { id: 'activity', items: ['hard_workout', 'strength', 'cardio', 'rest_day', 'low_movement'] },
  { id: 'wellbeing', items: ['poor_sleep', 'stress'] },
  { id: 'health', items: ['sick', 'constipation', 'medication'] },
  { id: 'context', items: ['travel', 'social', 'holidays'] },
  { id: 'measurement', items: ['other_time', 'other_scale', 'after_eating'] },
] as const;

export type CategoryGroupId = (typeof CATEGORY_GROUPS)[number]['id'];
export type CategoryId = (typeof CATEGORY_GROUPS)[number]['items'][number];

/** Every category id, in display order. */
export const CATEGORY_IDS: readonly CategoryId[] = CATEGORY_GROUPS.flatMap((g) => g.items);

const KNOWN = new Set<string>(CATEGORY_IDS);

/** The group a category belongs to. */
export function groupOf(id: CategoryId): CategoryGroupId {
  return CATEGORY_GROUPS.find((g) => (g.items as readonly string[]).includes(id))!.id;
}

/** Known ids only, without repeats, in display order; undefined when none. */
export function cleanTags(tags: unknown): CategoryId[] | undefined {
  if (!Array.isArray(tags)) return undefined;
  const set = new Set(tags.filter((t): t is string => typeof t === 'string' && KNOWN.has(t)));
  const out = CATEGORY_IDS.filter((id) => set.has(id));
  return out.length ? out : undefined;
}
