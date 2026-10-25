import { cleanTags, type CategoryId } from '@/domain';
import type { T } from '@/i18n';
import type { WeightEntry } from '@/types';

/** A weigh-in's categories as labels, then its free text: "Very salty · Alcohol · after the party". */
export function noteText(e: Pick<WeightEntry, 'note' | 'tags'>, t: T): string {
  const tags = cleanTags(e.tags) ?? [];
  return [...tags.map((id: CategoryId) => t.cat[id]), e.note].filter(Boolean).join(' · ');
}
