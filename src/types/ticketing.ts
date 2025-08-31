export type CreateEventStepData = {
  details: {
    title: string;
    slug: string;
    description: string;
    startDate: string;
    endDate: string;
    timezone: string;
    venue: {
      name: string;
      address: string;
      city: string;
      state: string;
      country: string;
      type: "physical" | "online";
    };
    capacity: { type: "unlimited" } | { type: "limited"; total: number };
    visibility: "public" | "unlisted";
  };
  // add `theme`, `tickets`, etc. as you build those steps
};
