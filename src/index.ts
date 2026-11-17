import { definePlugin } from '@newses/plugin-api';
import { z } from 'zod';

/** How long a day's count is kept: long enough for a weekly digest to read the last seven. */
const KEEP_SECONDS = 8 * 24 * 60 * 60;

/** The storage key of a day's count, by its UTC date. */
const dayKey = (date: Date) => `arrived:${date.toISOString().slice(0, 10)}`;

/** The overview, in the digest's language when the plugin has it, else English. */
function overview(language: string, arrived: number, days: number): string {
  const period = days === 1 ? 'day' : 'week';
  switch (language.split('-')[0]) {
    case 'de':
      return `${String(arrived)} Artikel kamen ${period === 'day' ? 'seit gestern' : 'in den letzten sieben Tagen'} für dich an.`;
    default:
      return `${String(arrived)} articles arrived for you ${period === 'day' ? 'since yesterday' : 'in the last week'}.`;
  }
}

/**
 * An example: counts the articles that arrive for each user, a day at a time in their storage,
 * and opens their digest with the count of the last day or week. It reaches no hosts.
 */
export default definePlugin({
  id: 'example',
  // Keep in step with package.json; a test checks they match.
  version: '0.1.0',
  apiVersion: '^0.1',
  scopes: ['user'],
  settings: {
    user: z.object({ overview: z.boolean().default(true) }),
  },
  messages: {
    en: {
      name: 'Arrival counts',
      description:
        'Counts the articles that arrive for you, and opens your digest with how many. Sends nothing anywhere.',
      'settings.overview': 'Open my digest with the count',
    },
    de: {
      name: 'Ankunftszähler',
      description:
        'Zählt die Artikel, die für dich ankommen, und beginnt deinen Digest mit ihrer Zahl. Sendet nichts weiter.',
      'settings.overview': 'Digest mit der Zahl beginnen',
    },
  },
  hooks: {
    'entries.added': {
      // New entries within 5 minutes of the first arrive as one event.
      debounceSeconds: 300,
      async run(event, context) {
        const store = context.userStorage;
        if (!store) return;
        // Events arrive at least once, so after a retry the count may be a little high.
        const key = dayKey(new Date());
        const counted = Number((await store.get(key)) ?? 0);
        await store.set(key, counted + event.entries.length, { ttlSeconds: KEEP_SECONDS });
      },
    },
    'digest.compose': {
      async run(input, context) {
        const store = context.userStorage;
        if (!store || !context.userSettings?.overview) return null;
        // Today's count and the days before it the digest covers, by UTC date.
        const days = input.frequency === 'weekly' ? 7 : 1;
        let arrived = 0;
        for (let day = 0; day <= days; day++) {
          const date = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
          arrived += Number((await store.get(dayKey(date))) ?? 0);
        }
        return arrived > 0 ? { overview: overview(input.language, arrived, days) } : null;
      },
    },
  },
});
