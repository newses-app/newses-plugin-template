import { readFileSync } from 'node:fs';
import {
  fixtureDigestEntry,
  fixtureEntryWithText,
  MemoryStore,
  runHook,
} from '@newses/plugin-api/testing';
import { describe, expect, it } from 'vitest';
import plugin from './index.js';

const added = (n: number) => ({
  userId: 1,
  entries: Array.from({ length: n }, () => fixtureEntryWithText()),
});
const digest = (language: string, frequency: 'daily' | 'weekly' = 'daily') => ({
  userId: 1,
  language,
  frequency,
  entries: [fixtureDigestEntry()],
  more: 0,
});

describe('example plugin', () => {
  it('has the version package.json has', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
      version: string;
    };
    expect(plugin.version).toBe(pkg.version);
  });

  it('counts arrivals and opens the digest with them, in its language', async () => {
    const userStorage = new MemoryStore();
    await runHook(plugin, 'entries.added', added(3), { userStorage });
    await runHook(plugin, 'entries.added', added(2), { userStorage });

    const english = await runHook(plugin, 'digest.compose', digest('en-GB'), { userStorage });
    expect(english.value).toEqual({ overview: '5 articles arrived for you since yesterday.' });
    const german = await runHook(plugin, 'digest.compose', digest('de', 'weekly'), {
      userStorage,
    });
    expect(german.value?.overview).toBe('5 Artikel kamen in den letzten sieben Tagen für dich an.');
  });

  it('adds nothing when the user turned the overview off, or nothing arrived', async () => {
    const userStorage = new MemoryStore();
    await runHook(plugin, 'entries.added', added(1), { userStorage });
    const off = await runHook(plugin, 'digest.compose', digest('en'), {
      userStorage,
      userSettings: { overview: false },
    });
    expect(off.value).toBeNull();
    const empty = await runHook(plugin, 'digest.compose', digest('en'), {
      userStorage: new MemoryStore(),
    });
    expect(empty.value).toBeNull();
  });
});
