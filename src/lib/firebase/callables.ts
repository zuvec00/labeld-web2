// lib/firebase/callables.ts
// Re-export callable functions from shipping module
export {
  upsertFulfillmentLine,
  setFulfillmentStatus,
  addTimelineNote,
  quoteShipping,
  type FulfillmentLineRequest as UpsertFulfillmentLineRequest,
  type SetFulfillmentStatusRequest,
  type AddTimelineNoteRequest,
  type ShippingQuoteRequest as QuoteShippingRequest,
} from "./callables/shipping";
