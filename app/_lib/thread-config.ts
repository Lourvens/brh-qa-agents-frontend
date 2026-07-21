/**
 * Thread-wide caps.
 *
 * One module, one source of truth — `MAX_MESSAGES_PER_THREAD` is the
 * total number of `UIMessage` entries (user + assistant turns) we keep
 * in a single conversation before prompting the user to start a new
 * thread. Tuning this number is safe; the UI just reads it.
 *
 * The number is deliberately low for a French-only RAG surface:
 * the backend `/ask` adapter currently forwards only the latest
 * user message, so history is purely UI memory. Older turns exist
 * only to be rendered — past 12, scrolling becomes noise.
 */

export const MAX_MESSAGES_PER_THREAD = 12;