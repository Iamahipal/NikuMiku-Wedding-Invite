/**
 * Prefix a `public/` asset with the deployment base path.
 *
 * Next rewrites its own URLs (`/_next/*`, metadata icons) when `basePath` is
 * set, but it cannot rewrite a URL we fetch ourselves — and a GitHub project
 * page is served from `/<repo>/`. Anything loaded from `public/` by our own
 * code must go through here or it works locally and 404s in production.
 */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function asset(path: string) {
  return `${BASE_PATH}${path}`;
}
