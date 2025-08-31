// lib/validation/username.ts
export function validateUsername(uRaw: string) {
  const u = uRaw.trim();
  const re = /^[a-zA-Z0-9](?!.*[_.]{2})[a-zA-Z0-9._]{1,13}[a-zA-Z0-9]$/;
  const ok = u.length >= 3 && u.length <= 15 && re.test(u) && !/\s/.test(u);
  return { ok, normalized: u.toLowerCase() };
}
