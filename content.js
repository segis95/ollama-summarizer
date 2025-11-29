(function () {
  const STYLE_ID = "__paragraph_summarizer_styles__";
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      p.__ph_target__ { outline: 2px dashed #c00; outline-offset: 2px; cursor: pointer; position: relative; }
      p.__ph_target__.--red { color: #c00 !important; }
      .__ph_summary__ { margin-top: 6px; font: 13px/1.4 system-ui, sans-serif; background: #fff6f6; border-left: 3px solid #c00; padding: 6px 8px; white-space: pre-wrap; }
    `;
    document.documentElement.appendChild(style);
  }

  // Collecting the page text from all <p>
  function collectAllParagraphText(root = document) {
    const paras = Array.from(root.querySelectorAll("p"));
    return paras.map(p => p.innerText.trim()).filter(Boolean).join("\n\n");
  }
  let pageText = collectAllParagraphText();

  // Update pageText on dynamic changes
  const observer = new MutationObserver(() => {
    pageText = collectAllParagraphText();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  function initParagraphs(root = document) {
    const paras = root.querySelectorAll("p:not(.__ph_target__)");
    paras.forEach(p => {
      p.classList.add("__ph_target__");
      p.addEventListener("click", onParagraphClick, { passive: true });
    });
  }

  function ensureSummaryBox(p) {
    let box = p.nextElementSibling;
    if (!box || !box.classList.contains("__ph_summary__")) {
      box = document.createElement("div");
      box.className = "__ph_summary__";
      p.insertAdjacentElement("afterend", box);
    }
    return box;
  }

  function detectLanguageSample(text) {
    const sample = (text || "").slice(0, 400);
    return sample;
  }

  async function onParagraphClick(e) {
    const p = e.currentTarget;
    p.classList.toggle("--red");

    const chunk = p.innerText.trim();
    if (!chunk) return;

    const box = ensureSummaryBox(p);
    box.textContent = "Summarizing locally via Ollama…";

    const langHint = detectLanguageSample(chunk);

    try {
      const response = await chrome.runtime.sendMessage({
        __type: "summarize_paragraph",
        payload: {
          pageText,
          chunk,
          langHint
        }
      });
      if (response && response.ok) {
        box.textContent = response.summary || "(empty)";
      } else {
        box.textContent = `Error: ${response?.error || "unknown"}`;
      }
    } catch (err) {
      box.textContent = `Error: ${String(err)}`;
    }
  }

  initParagraphs(document);

  const addObserver = new MutationObserver(muts => {
    for (const m of muts) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.tagName === "P") {
          initParagraphs(node.ownerDocument);
        } else {
          const inside = node.querySelectorAll?.("p");
          if (inside && inside.length) initParagraphs(node);
        }
      }
    }
  });
  addObserver.observe(document.documentElement, { childList: true, subtree: true });
})();
