import { generateKeyPairSync, sign } from 'crypto';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { readManifest, safeJoin } from './rendererManifest';

const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const PUBLIC_KEY = publicKey.export({ type: 'spki', format: 'pem' }).toString();
const HASH = 'a'.repeat(64);
const MB = 1024 * 1024;

const signed = (payload: object) => {
  const text = JSON.stringify(payload);
  return JSON.stringify({ payload: text, signature: sign(null, Buffer.from(text), privateKey).toString('base64') });
};
const withFiles = (files: Record<string, unknown>) => signed({ shellVersion: '1.0.0', build: 20261001093000, files: { 'index.html': { sha256: HASH, size: 601 }, ...files } });

describe('readManifest', () => {
  it('서명과 스키마가 맞으면 manifest를 돌려준다', () => {
    const manifest = readManifest(withFiles({ 'assets/index-AB_c.js': { sha256: HASH, size: 0 } }), PUBLIC_KEY, '1.0.0');
    expect(manifest.build).toBe(20261001093000);
    expect(Object.keys(manifest.files)).toEqual(['index.html', 'assets/index-AB_c.js']);
  });

  it('payload가 바뀌면 거부한다', () => {
    const { payload, signature } = JSON.parse(withFiles({}));
    const tampered = JSON.stringify({ payload: payload.replace('601', '602'), signature });
    expect(() => readManifest(tampered, PUBLIC_KEY, '1.0.0')).toThrow('서명');
  });

  it('셸 버전이 다르면 거부한다', () => {
    expect(() => readManifest(withFiles({}), PUBLIC_KEY, '1.0.1')).toThrow('셸 버전');
  });

  it('index.html이 없으면 거부한다', () => {
    const manifest = signed({ shellVersion: '1.0.0', build: 1, files: { 'app.js': { sha256: HASH, size: 1 } } });
    expect(() => readManifest(manifest, PUBLIC_KEY, '1.0.0')).toThrow('index.html');
  });

  it.each(['../x', '/x', 'C:/x', 'a\\x', 'a/../x', '.x', 'x.', 'a//x', 'con.js', 'assets/LPT1'])('위험 경로 %s를 거부한다', (path) => {
    expect(() => readManifest(withFiles({ [path]: { sha256: HASH, size: 1 } }), PUBLIC_KEY, '1.0.0')).toThrow('경로');
  });

  it('대소문자만 다른 경로를 거부한다', () => {
    expect(() => readManifest(withFiles({ 'Index.html': { sha256: HASH, size: 1 } }), PUBLIC_KEY, '1.0.0')).toThrow('대소문자');
  });

  it('build, sha256, size 형식 오류를 거부한다', () => {
    expect(() => readManifest(signed({ shellVersion: '1.0.0', build: 1.5, files: { 'index.html': { sha256: HASH, size: 1 } } }), PUBLIC_KEY, '1.0.0')).toThrow('build');
    expect(() => readManifest(withFiles({ 'a.js': { sha256: 'A'.repeat(64), size: 1 } }), PUBLIC_KEY, '1.0.0')).toThrow('sha256');
    expect(() => readManifest(withFiles({ 'a.js': { sha256: HASH, size: -1 } }), PUBLIC_KEY, '1.0.0')).toThrow('size');
  });

  it('크기·개수·총합 제한을 넘으면 거부한다', () => {
    expect(() => readManifest(withFiles({ 'a.js': { sha256: HASH, size: 20 * MB + 1 } }), PUBLIC_KEY, '1.0.0')).toThrow('size');
    const many = Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`f${i}.js`, { sha256: HASH, size: 1 }]));
    expect(() => readManifest(withFiles(many), PUBLIC_KEY, '1.0.0')).toThrow('개');
    const big = Object.fromEntries(Array.from({ length: 3 }, (_, i) => [`f${i}.js`, { sha256: HASH, size: 20 * MB }]));
    expect(() => readManifest(withFiles(big), PUBLIC_KEY, '1.0.0')).toThrow('총합');
  });
});

describe('safeJoin', () => {
  const root = join(process.cwd(), 'bundle');

  it('root 안의 경로만 돌려준다', () => {
    expect(safeJoin(root, 'assets/index.js')).toBe(join(root, 'assets', 'index.js'));
    for (const path of ['', '.', '..', '../x', 'a/../../x', '/etc/passwd', 'C:/x']) expect(safeJoin(root, path)).toBeNull();
  });
});
