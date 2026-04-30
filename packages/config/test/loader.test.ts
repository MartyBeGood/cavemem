import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadSettings, settingsPath } from '../src/loader.js';

const tmp = join(tmpdir(), 'cavemem-config-test');

beforeEach(() => mkdirSync(tmp, { recursive: true }));
afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
  delete process.env.CAVEMEM_SETTINGS;
});

describe('CAVEMEM_SETTINGS env var', () => {
  it('settingsPath() returns env path when set (V3)', () => {
    const p = join(tmp, 'custom.json');
    process.env.CAVEMEM_SETTINGS = p;
    expect(settingsPath()).toBe(p);
  });

  it('settingsPath(dataDir) ignores env var when arg supplied (C2/V3)', () => {
    process.env.CAVEMEM_SETTINGS = join(tmp, 'should-be-ignored.json');
    const explicit = join(tmp, 'explicit', 'settings.json');
    expect(settingsPath(join(tmp, 'explicit'))).toBe(explicit);
  });

  it('loadSettings() uses env path when set and file exists (V1)', () => {
    const p = join(tmp, 'proj.json');
    writeFileSync(p, JSON.stringify({ workerPort: 39999 }));
    process.env.CAVEMEM_SETTINGS = p;
    const s = loadSettings();
    expect(s.workerPort).toBe(39999);
  });

  it('explicit path arg wins over env var (C3/V1)', () => {
    process.env.CAVEMEM_SETTINGS = join(tmp, 'env.json');
    writeFileSync(join(tmp, 'env.json'), JSON.stringify({ workerPort: 11111 }));
    const explicit = join(tmp, 'explicit.json');
    writeFileSync(explicit, JSON.stringify({ workerPort: 22222 }));
    const s = loadSettings(explicit);
    expect(s.workerPort).toBe(22222);
  });

  it('loadSettings() uses default when env unset (V2)', () => {
    // env var absent — must not throw, must return defaults
    const s = loadSettings(join(tmp, 'nonexistent.json'));
    expect(s.workerPort).toBe(37777);
  });

  it('loadSettings() throws on invalid JSON in env path (C4)', () => {
    const p = join(tmp, 'bad.json');
    writeFileSync(p, 'not json');
    process.env.CAVEMEM_SETTINGS = p;
    expect(() => loadSettings()).toThrow();
  });
});
