// lib/validation/username.ts

/** User profile handles: letters, numbers, . and _ — no hyphens (matches mobile global_user_setup) */
export function validateUsername(uRaw: string) {
  const u = uRaw.trim();
  const re = /^[a-zA-Z0-9](?!.*[_.]{2})[a-zA-Z0-9._]{1,13}[a-zA-Z0-9]$/;
  const ok = u.length >= 3 && u.length <= 15 && re.test(u) && !/\s/.test(u);
  return { ok, normalized: u.toLowerCase() };
}

/** Brand / event organizer slugs: lowercase letters, numbers, hyphens — matches mobile SlugService.normalize() */
export function validateSlug(sRaw: string) {
  const s = sRaw.trim().toLowerCase();
  const re = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
  const ok = s.length >= 3 && s.length <= 30 && re.test(s) && !/-{2,}/.test(s);
  return { ok, normalized: s };
}
