// Ollama config
const OLLAMA_API = "http://localhost:11434/api/chat";
let MODEL = "llama3.1:8b";

// Loading a model on start
chrome.storage.sync.get(['MODEL'], (result) => {
  if (result.MODEL) MODEL = result.MODEL;
});

// Listening changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.MODEL) MODEL = changes.MODEL.newValue;
});

function buildSystemPrompt(allText) {
  return `Here is all text on the page:
${allText}

You are a helpful assistant that summarizes text concisely. Always preserve the original language of the input.`;
}

const sessions = new Map(); // key -> { messages: [...] }

function getSessionKey(payload) {
  const u = payload?.url || "about:blank";
  try { const x = new URL(u);
    return `${x.origin}${x.pathname}`;
  }
  catch {
    return u;
  }
}

async function callOllamaChat(messages, options = {}) {
  const body = {
    model: MODEL,
    messages,
    stream: false,
    ...options
  };
  const res = await fetch(OLLAMA_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Ollama HTTP ${res.status}: ${txt}`);
  }
  const data = await res.json();
  // data.message.content contains the response
  return data;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.__type === "summarize_paragraph") {
    (async () => {
      const { pageText, chunk, langHint } = msg.payload || {};
      if (!chunk) return sendResponse({ ok: false, error: "Empty chunk" });

      // Session key
      const key = getSessionKey(msg.payload);
      let sess = sessions.get(key);
      if (!sess) {
        // First query: creates a session with a reusable system prompt
        const system = buildSystemPrompt(pageText || "");
        sess = { messages: [{ role: "system", content: system }] };
        sessions.set(key, sess);
      }

      // User prompt
      const userContent = `1. Given the following chunk, write a concise summary of the chunk. 
                                  2. Do not write more than 20 words.
                                  3. Avoid any preamble or introduction. Start directly with the summary.
                                  4. Use the original language of the chunk.

                                  Chunk:
                                  ${chunk}`;

      const messages = [
        ...sess.messages,
        { role: "user", content: userContent }
      ];

      try {
        const data = await callOllamaChat(messages, { keep_alive: "1h" });
        const summary = data?.message?.content?.trim?.() || "";
        // Updating history so that KV-cache is reused in the future
        sess.messages.push({ role: "user", content: userContent });
        sess.messages.push({ role: "assistant", content: summary });
        sendResponse({ ok: true, summary });
      } catch (err) {
        sendResponse({ ok: false, error: String(err) });
      }
    })();
    return true; // async
  }
});
