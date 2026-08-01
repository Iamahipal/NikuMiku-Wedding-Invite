/**
 * Prefix a `public/` asset with the deployment base path.
 *
 * Next rewrites its own URLs (`/_next/*`, metadata icons, next/image) when
 * `basePath` is set, but it cannot rewrite a hand-written `<img src>` — those
 * would 404 on a GitHub project page. Anything loaded from `public/` by raw
 * markup must go through here.
 */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function asset(path: string) {
  return `${BASE_PATH}${path}`;
}
