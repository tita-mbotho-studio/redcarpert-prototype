/** Safely decode a Vite development/preview request before filesystem checks. */
export function localRequestPath(requestUrl: string | undefined): string | null {
  const rawPath = (requestUrl ?? '/').split('?')[0];
  let pathname: string;
  try {
    pathname = decodeURIComponent(rawPath);
  } catch {
    return null;
  }
  if (pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').some(part => part === '.' || part === '..')) return null;
  return pathname.replace(/^\/redcarpert-prototype(?=\/|$)/, '');
}
