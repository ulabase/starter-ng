// Preloaded into OpenWiki with NODE_OPTIONS=--import: retries an OpenRouter chat completion that
// comes back 429. DeepInfra's shared pool answers 429 engine_overloaded without a Retry-After,
// which LangChain does not retry and OpenWiki treats as fatal in the planner and as a skip in a
// page. The pool frees up within minutes, so waiting is enough.
const DELAYS_S = [30, 60, 120, 240];
const orig = globalThis.fetch;

const sleep = (ms, signal) => new Promise((resolve, reject) => {
  if (signal?.aborted) return reject(signal.reason);
  const timer = setTimeout(resolve, ms);
  signal?.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
});

globalThis.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input?.url ?? String(input);
  // Only a string body can be sent again: a stream or a Request is consumed by the first attempt.
  const replayable = typeof input === 'string' && (init?.body === undefined || typeof init.body === 'string');
  if (!url.includes('openrouter.ai/') || !url.includes('/chat/completions') || !replayable) return orig(input, init);
  for (let attempt = 0; ; attempt++) {
    const res = await orig(input, init);
    if (res.status !== 429 || attempt >= DELAYS_S.length) return res;
    await res.body?.cancel();
    console.error(`OpenRouter answered 429, retrying in ${DELAYS_S[attempt]}s (${attempt + 1}/${DELAYS_S.length})`);
    await sleep(DELAYS_S[attempt] * 1000, init?.signal);
  }
};
