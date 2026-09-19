import { createHash, createPublicKey, verify } from 'crypto';
import { isAbsolute, relative, resolve, sep } from 'path';

export const MANIFEST_MAX_BYTES = 1024 * 1024;
const FILE_MAX_BYTES = 20 * 1024 * 1024;
const TOTAL_MAX_BYTES = 50 * 1024 * 1024;
const MAX_FILES = 100;

const SEGMENT = /^[\w.-]+$/;
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;

export type ManifestFile = { sha256: string; size: number };
export type RendererManifest = { shellVersion: string; build: number; commit?: string; files: Record<string, ManifestFile> };

export const sha256 = (data: Buffer | string) => createHash('sha256').update(data).digest('hex');

// `..`, 절대 경로, 역슬래시, `C:`는 세그먼트 규칙에서 걸린다
export const isSafeBundlePath = (path: string) => path.split('/').every((segment) => SEGMENT.test(segment) && !segment.startsWith('.') && !segment.endsWith('.') && !WINDOWS_RESERVED.test(segment));

const isSize = (value: unknown, max: number): value is number => Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= max;

export function readManifest(raw: string, publicKey: string, shellVersion: string): RendererManifest {
  const { payload, signature } = JSON.parse(raw) ?? {};
  if (typeof payload !== 'string' || typeof signature !== 'string') throw new Error('manifest 형식이 올바르지 않습니다');
  if (!verify(null, Buffer.from(payload), createPublicKey(publicKey), Buffer.from(signature, 'base64'))) throw new Error('manifest 서명이 올바르지 않습니다');

  const manifest = JSON.parse(payload) ?? {};
  if (manifest.shellVersion !== shellVersion) throw new Error(`셸 버전 불일치: ${manifest.shellVersion} (현재 ${shellVersion})`);
  if (!Number.isSafeInteger(manifest.build) || manifest.build <= 0) throw new Error('build가 양의 정수가 아닙니다');
  if (typeof manifest.files !== 'object' || manifest.files === null || Array.isArray(manifest.files)) throw new Error('files가 객체가 아닙니다');

  const entries = Object.entries(manifest.files) as Array<[string, ManifestFile]>;
  if (entries.length > MAX_FILES) throw new Error(`파일이 ${MAX_FILES}개를 넘습니다`);
  if (!Object.hasOwn(manifest.files, 'index.html')) throw new Error('index.html이 없습니다');

  const lowerPaths = new Set<string>();
  let total = 0;
  for (const [path, file] of entries) {
    if (!isSafeBundlePath(path)) throw new Error(`허용되지 않는 경로: ${path}`);
    if (lowerPaths.has(path.toLowerCase())) throw new Error(`대소문자만 다른 경로: ${path}`);
    lowerPaths.add(path.toLowerCase());
    if (typeof file?.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(file.sha256)) throw new Error(`sha256 형식 오류: ${path}`);
    if (!isSize(file.size, FILE_MAX_BYTES)) throw new Error(`size 오류: ${path}`);
    total += file.size;
  }
  if (total > TOTAL_MAX_BYTES) throw new Error('파일 총합이 제한을 넘습니다');

  return manifest;
}

// root 밖으로 벗어나거나 root 자신이면 null
export const safeJoin = (root: string, path: string) => {
  const full = resolve(root, path);
  const rel = relative(root, full);
  return rel && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel) ? full : null;
};
