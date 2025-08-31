export const CREATION_STEPS = [
  { key: "details", label: "Details" },
  { key: "theme", label: "Theme" },
  { key: "tickets", label: "Tickets" },
  { key: "merch", label: "Merch", optional: true },
  { key: "moments", label: "Moments", optional: true },
  { key: "review", label: "Review" },
] as const;

export type CreationStepKey = (typeof CREATION_STEPS)[number]["key"];
