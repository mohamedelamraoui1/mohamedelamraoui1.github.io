// ─── Chatbot Widget ─────────────────────────────────────────────────────────
// Streams answers from the mcoding-chat-worker Cloudflare Worker, which
// proxies to NVIDIA's API and keeps the API key server-side. See
// D:\me-github-portfolio\mcoding-chat-worker for the backend.
(function () {
  const WORKER_URL = "https://mcoding-chat-worker.mohamedelamraouifreelancer.workers.dev";
  const MAX_HISTORY = 6;

  let history = []; // { role: "user" | "assistant", content: string }
  let isStreaming = false;
  let greetingShown = false;

  function getLang() {
    return document.documentElement.lang || localStorage.getItem("lang") || "fr";
  }

  function t(key) {
    const lang = getLang();
    return (translations[lang] && translations[lang][key]) || translations.fr[key] || "";
  }

  if (typeof marked !== "undefined") {
    marked.setOptions({ gfm: true, breaks: true });
  }

  // Full markdown (tables, links, lists, code, bold/italic...) via `marked`,
  // then sanitized with DOMPurify since this text comes from an LLM and is
  // rendered as HTML — never trust it as-is.
  function renderMarkdown(text) {
    if (typeof marked === "undefined" || typeof DOMPurify === "undefined") {
      // Fallback if the CDN scripts failed to load: escape only.
      return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    const html = marked.parse(text);
    return DOMPurify.sanitize(html, { ADD_ATTR: ["target"] });
  }

  function renderBubbleContent(bubble, text) {
    bubble.innerHTML = renderMarkdown(text);
    bubble.querySelectorAll("a").forEach((a) => {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    });
  }

  function scrollToBottom() {
    const el = document.getElementById("chatbot-messages");
    el.scrollTop = el.scrollHeight;
  }

  function addMessageBubble(role, text) {
    const container = document.getElementById("chatbot-messages");
    const bubble = document.createElement("div");
    bubble.className = `chatbot-msg chatbot-msg-${role}`;
    renderBubbleContent(bubble, text);
    container.appendChild(bubble);
    scrollToBottom();
    return bubble;
  }

  function addTypingIndicator() {
    const container = document.getElementById("chatbot-messages");
    const el = document.createElement("div");
    el.className = "chatbot-msg chatbot-msg-assistant chatbot-typing";
    el.innerHTML = "<span></span><span></span><span></span>";
    container.appendChild(el);
    scrollToBottom();
    return el;
  }

  function showGreetingIfNeeded() {
    if (greetingShown || history.length > 0) return;
    greetingShown = true;
    addMessageBubble("assistant", t("chatbot_greeting"));
  }

  function setStreaming(streaming) {
    isStreaming = streaming;
    document.getElementById("chatbot-send").disabled = streaming;
    document.getElementById("chatbot-input").disabled = streaming;
  }

  async function sendMessage(message) {
    addMessageBubble("user", message);
    const priorHistory = history.slice(-MAX_HISTORY);
    history.push({ role: "user", content: message });

    setStreaming(true);
    const typingEl = addTypingIndicator();
    let assistantBubble = null;
    let rawText = "";

    try {
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: priorHistory }),
      });

      if (!res.ok || !res.body) throw new Error("Request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") continue;

          try {
            const parsed = JSON.parse(payload);
            if (typeof parsed.content === "string" && parsed.content.length > 0) {
              if (!assistantBubble) {
                typingEl.remove();
                assistantBubble = addMessageBubble("assistant", "");
              }
              rawText += parsed.content;
              renderBubbleContent(assistantBubble, rawText);
              scrollToBottom();
            }
          } catch {
            // Ignore malformed/partial SSE fragments.
          }
        }
      }

      if (!assistantBubble) {
        typingEl.remove();
        addMessageBubble("assistant", t("chatbot_error"));
      } else {
        history.push({ role: "assistant", content: rawText });
        if (history.length > 20) history = history.slice(-20);
      }
    } catch {
      typingEl.remove();
      if (!assistantBubble) addMessageBubble("assistant", t("chatbot_error"));
    } finally {
      setStreaming(false);
      document.getElementById("chatbot-input").focus();
    }
  }

  function autoResize(el) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  function handleSend() {
    const input = document.getElementById("chatbot-input");
    const message = input.value.trim();
    if (!message || isStreaming) return;
    input.value = "";
    autoResize(input);
    sendMessage(message);
  }

  const TEASER_SEEN_KEY = "mcodingChatbotTeaserSeen";

  function initTeaser(openPanel) {
    const teaser = document.getElementById("chatbot-teaser");
    const closeBtn = document.getElementById("chatbot-teaser-close");
    if (!teaser || !closeBtn) return;

    function dismiss() {
      teaser.classList.remove("show");
    }

    if (!localStorage.getItem(TEASER_SEEN_KEY)) {
      setTimeout(() => {
        teaser.classList.add("show");
        localStorage.setItem(TEASER_SEEN_KEY, "1");
        setTimeout(dismiss, 12000);
      }, 4000);
    }

    teaser.addEventListener("click", () => {
      dismiss();
      openPanel();
    });
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dismiss();
    });
  }

  function initChatbot() {
    const toggle = document.getElementById("chatbot-toggle");
    const panel = document.getElementById("chatbot-panel");
    const closeBtn = document.getElementById("chatbot-close");
    const sendBtn = document.getElementById("chatbot-send");
    const input = document.getElementById("chatbot-input");
    if (!toggle || !panel) return;

    function openPanel() {
      panel.classList.add("open");
      toggle.classList.add("open");
      document.getElementById("chatbot-teaser")?.classList.remove("show");
      showGreetingIfNeeded();
      setTimeout(() => input.focus(), 300);
    }
    function closePanel() {
      panel.classList.remove("open");
      toggle.classList.remove("open");
    }

    initTeaser(openPanel);

    toggle.addEventListener("click", () => {
      if (panel.classList.contains("open")) closePanel();
      else openPanel();
    });
    closeBtn.addEventListener("click", closePanel);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && panel.classList.contains("open")) closePanel();
    });

    sendBtn.addEventListener("click", handleSend);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
    input.addEventListener("input", () => autoResize(input));

    // Re-render the greeting in the new language if the conversation hasn't
    // started yet (data-i18n already handles title/status/placeholder/disclaimer).
    document.addEventListener("click", (e) => {
      if (!e.target.matches(".lang-btn") || history.length > 0) return;
      const messagesEl = document.getElementById("chatbot-messages");
      messagesEl.innerHTML = "";
      greetingShown = false;
      if (panel.classList.contains("open")) showGreetingIfNeeded();
    });
  }

  document.addEventListener("DOMContentLoaded", initChatbot);
})();
