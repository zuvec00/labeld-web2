"use client";

import { useEffect, useRef, useState } from "react";
import { validateUsername, validateSlug } from "@/lib/validation/username";
import { checkUsernameUniqueCF } from "@/lib/firebase/callables/users";
import { isPublicSlugTaken } from "@/lib/firebase/slugs";

export type AvailabilityStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid"
  | "error";

interface Options {
  /** "user" checks the users collection via CF; "slug" checks publicSlugs */
  type: "user" | "slug";
  debounceMs?: number;
}

export function useUsernameAvailability(
  value: string,
  { type, debounceMs = 500 }: Options,
) {
  const [status, setStatus] = useState<AvailabilityStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastChecked = useRef<string>("");

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = value.trim().toLowerCase();

    if (!trimmed) {
      setStatus("idle");
      return;
    }

    const { ok } = type === "slug" ? validateSlug(trimmed) : validateUsername(trimmed);
    if (!ok) {
      setStatus("invalid");
      return;
    }

    if (trimmed === lastChecked.current && status === "available") return;

    setStatus("checking");

    timerRef.current = setTimeout(async () => {
      try {
        let taken: boolean;
        if (type === "user") {
          const free = await checkUsernameUniqueCF(trimmed);
          taken = !free;
        } else {
          taken = await isPublicSlugTaken(trimmed);
        }
        lastChecked.current = trimmed;
        setStatus(taken ? "taken" : "available");
      } catch {
        setStatus("error");
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return status;
}
