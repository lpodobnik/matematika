import { hr } from '@/content/text/hr';
import type { RoomTitle } from '@/workshop/design';

/** A room's name as it reads: his own words, or (older rooms) the list's title at that index. */
export function roomTitleText(title: RoomTitle): string {
  return typeof title === 'string' ? title : (hr.workshop.titles[title] ?? '');
}
