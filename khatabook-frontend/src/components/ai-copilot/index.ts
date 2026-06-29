// Public surface of the BizzChat AI Copilot module.
//
// Mount <CopilotProvider> once in the root layout. Any client component can
// then call useCopilot() to drive the assistant programmatically — e.g. open
// it, prefill a message, or kick off a support ticket from a CRM action.

export { default as CopilotProvider, useCopilot } from "./CopilotProvider";
export type { CopilotContextValue, CopilotMessage, CopilotAttachment } from "./types";
