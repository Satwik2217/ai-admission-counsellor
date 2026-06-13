(function () {
  "use strict";

  var script = document.currentScript || document.scripts[document.scripts.length - 1];
  var ORG_SLUG = script.getAttribute("data-org");
  if (!ORG_SLUG) return;

  var API_BASE = script.src.substring(0, script.src.lastIndexOf("/widget.js"));

  if (API_BASE.includes("localhost") || API_BASE.match(/^https?:\/\/\d+\.\d+\.\d+\.\d+/)) {
    API_BASE = API_BASE.replace(/\/+$/, "");
  } else {
    API_BASE = API_BASE.replace(/\/+$/, "");
  }

  var CONFIG = {
    name: "AI Assistant",
    greetingMessage: "Hi! How can I help you today?",
    primaryColor: "#7C3AED",
    darkMode: false,
    logo: null,
  };

  var state = {
    minimized: true,
    darkMode: false,
    messages: [],
    conversationId: null,
    isLoading: false,
    visitorId: null,
  };

  var root, shadow, elements = {};

  function getVisitorId() {
    try {
      var id = localStorage.getItem("wv_" + ORG_SLUG);
      if (!id) {
        id = "v_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
        localStorage.setItem("wv_" + ORG_SLUG, id);
      }
      return id;
    } catch (e) {
      return "v_" + Date.now();
    }
  }

  function loadConfig() {
    state.visitorId = getVisitorId();
    var xhr = new XMLHttpRequest();
    xhr.open("GET", API_BASE + "/api/widget/config?org=" + encodeURIComponent(ORG_SLUG), true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          CONFIG.name = data.name || CONFIG.name;
          CONFIG.greetingMessage = data.greetingMessage || CONFIG.greetingMessage;
          CONFIG.primaryColor = data.primaryColor || CONFIG.primaryColor;
          CONFIG.darkMode = data.darkMode || false;
          CONFIG.logo = data.logo || null;
          state.darkMode = CONFIG.darkMode;
          applyTheme();
        } catch (e) { /* ignore */ }
      }
    };
    xhr.send();
  }

  function applyTheme() {
    if (!shadow) return;
    var host = shadow.host;
    if (state.darkMode) {
      host.classList.add("w-dark");
    } else {
      host.classList.remove("w-dark");
    }
    if (elements.toggleDark) {
      elements.toggleDark.textContent = state.darkMode ? "\u2600" : "\u263E";
    }
  }

  function createWidget() {
    var host = document.createElement("div");
    host.id = "ai-admission-widget";

    var style = document.createElement("style");
    style.textContent = getWidgetStyles();

    var template = document.createElement("div");
    template.id = "w-root";
    template.innerHTML = getWidgetHTML();

    shadow = host.attachShadow({ mode: "closed" });
    shadow.appendChild(style);
    shadow.appendChild(template);

    document.body.appendChild(host);

    elements.button = shadow.getElementById("w-btn");
    elements.panel = shadow.getElementById("w-panel");
    elements.header = shadow.getElementById("w-header");
    elements.messages = shadow.getElementById("w-msgs");
    elements.input = shadow.getElementById("w-input");
    elements.sendBtn = shadow.getElementById("w-send");
    elements.closeBtn = shadow.getElementById("w-close");
    elements.toggleDark = shadow.getElementById("w-dark");
    elements.greeting = shadow.getElementById("w-greeting");

    elements.greeting.textContent = CONFIG.greetingMessage;

    elements.button.addEventListener("click", togglePanel);
    elements.closeBtn.addEventListener("click", function () { state.minimized = true; togglePanel(); });
    elements.sendBtn.addEventListener("click", sendMessage);
    elements.input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    elements.toggleDark.addEventListener("click", function () {
      state.darkMode = !state.darkMode;
      applyTheme();
    });

    setPrimaryColor(CONFIG.primaryColor);

    applyTheme();
  }

  function setPrimaryColor(color) {
    if (!shadow) return;
    var host = shadow.host;
    host.style.setProperty("--w-primary", color);
  }

  function togglePanel() {
    state.minimized = !state.minimized;
    if (state.minimized) {
      elements.panel.classList.remove("w-open");
      elements.button.classList.remove("w-hidden");
    } else {
      elements.panel.classList.add("w-open");
      elements.button.classList.add("w-hidden");
      elements.input.focus();
      restoreConversation();
    }
  }

  function restoreConversation() {
    if (state.messages.length > 0) {
      renderMessages();
      return;
    }
    try {
      var saved = sessionStorage.getItem("wc_" + ORG_SLUG);
      if (saved) {
        var data = JSON.parse(saved);
        if (data.conversationId) state.conversationId = data.conversationId;
        if (data.messages && data.messages.length > 0) {
          state.messages = data.messages;
          renderMessages();
          return;
        }
      }
    } catch (e) { /* ignore */ }
    addBotMessage(CONFIG.greetingMessage);
  }

  function saveState() {
    try {
      sessionStorage.setItem("wc_" + ORG_SLUG, JSON.stringify({
        conversationId: state.conversationId,
        messages: state.messages,
      }));
    } catch (e) { /* ignore */ }
  }

  function addBotMessage(text) {
    state.messages.push({ role: "assistant", content: text });
    renderMessages();
    saveState();
  }

  function renderMessages() {
    elements.messages.innerHTML = "";
    state.messages.forEach(function (msg, i) {
      var bubble = document.createElement("div");
      bubble.className = "w-msg " + (msg.role === "user" ? "w-user" : "w-bot");
      var text = document.createElement("div");
      text.className = "w-text";
      text.textContent = msg.content;
      bubble.appendChild(text);
      elements.messages.appendChild(bubble);
    });
    elements.messages.scrollTop = elements.messages.scrollHeight;
  }

  function sendMessage() {
    var text = elements.input.value.trim();
    if (!text || state.isLoading) return;

    elements.input.value = "";
    state.messages.push({ role: "user", content: text });
    renderMessages();
    saveState();

    state.isLoading = true;
    elements.sendBtn.disabled = true;
    elements.sendBtn.textContent = "...";
    elements.input.disabled = true;

    var msgBubble = document.createElement("div");
    msgBubble.className = "w-msg w-bot";
    var textEl = document.createElement("div");
    textEl.className = "w-text";
    textEl.textContent = "";
    msgBubble.appendChild(textEl);
    elements.messages.appendChild(msgBubble);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", API_BASE + "/api/widget/chat", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.responseType = "text";

    var fullResponse = "";
    var lastProcessedIndex = 0;

    xhr.onprogress = function () {
      var newData = xhr.responseText.substring(lastProcessedIndex);
      lastProcessedIndex = xhr.responseText.length;
      fullResponse += newData;
      textEl.textContent = fullResponse;
      elements.messages.scrollTop = elements.messages.scrollHeight;
    };

    xhr.onloadend = function () {
      state.isLoading = false;
      elements.sendBtn.disabled = false;
      elements.sendBtn.textContent = "\u2191";
      elements.input.disabled = false;
      elements.input.focus();

      var convId = xhr.getResponseHeader("X-Conversation-Id");
      if (convId) state.conversationId = convId;

      if (fullResponse) {
        state.messages.push({ role: "assistant", content: fullResponse });
        saveState();
        renderMessages();
      }
    };

    xhr.onerror = function () {
      state.isLoading = false;
      elements.sendBtn.disabled = false;
      elements.sendBtn.textContent = "\u2191";
      elements.input.disabled = false;
      textEl.textContent = "Sorry, something went wrong. Please try again.";
    };

    xhr.send(JSON.stringify({
      org: ORG_SLUG,
      message: text,
      conversationId: state.conversationId,
    }));
  }

  function getWidgetHTML() {
    return '\
      <div id="w-btn" class="w-fab">\
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">\
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>\
        </svg>\
      </div>\
      <div id="w-panel" class="w-panel">\
        <div id="w-header" class="w-header">\
          <div class="w-header-left">\
            <div class="w-avatar" id="w-avatar">\
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">\
                <path d="M12 2a10 10 0 00-7.07 17.07L2 22l2.93-2.93A10 10 0 1012 2z"/>\
              </svg>\
            </div>\
            <div>\
              <div class="w-title">' + CONFIG.name.replace(/</g, "&lt;") + '</div>\
              <div class="w-subtitle">AI Assistant</div>\
            </div>\
          </div>\
          <div class="w-header-right">\
            <button id="w-dark" class="w-icon-btn" title="Toggle theme">\u263E</button>\
            <button id="w-close" class="w-icon-btn" title="Minimize">\u2014</button>\
          </div>\
        </div>\
        <div id="w-msgs" class="w-msgs">\
          <div class="w-msg w-bot">\
            <div class="w-text" id="w-greeting"></div>\
          </div>\
        </div>\
        <div class="w-footer">\
          <div class="w-input-wrap">\
            <textarea id="w-input" class="w-input" placeholder="Type a message..." rows="1"></textarea>\
            <button id="w-send" class="w-send-btn">\u2191</button>\
          </div>\
          <div class="w-brand">Powered by AI Admission Counselor</div>\
        </div>\
      </div>\
    ';
  }

  function getWidgetStyles() {
    return '\
      :host {\
        --w-primary: #7C3AED;\
        --w-bg: #ffffff;\
        --w-text: #1a1a2e;\
        --w-card: #f8f9fa;\
        --w-border: #e2e8f0;\
        --w-shadow: 0 4px 24px rgba(0,0,0,0.12);\
        --w-radius: 16px;\
        all: initial;\
        display: block;\
        position: fixed;\
        z-index: 2147483647;\
        bottom: 20px;\
        right: 20px;\
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\
        font-size: 14px;\
        line-height: 1.5;\
        color: var(--w-text);\
        -webkit-font-smoothing: antialiased;\
      }\
      :host(.w-dark) {\
        --w-bg: #1a1a2e;\
        --w-text: #e2e8f0;\
        --w-card: #2d2d44;\
        --w-border: #3d3d54;\
        --w-shadow: 0 4px 24px rgba(0,0,0,0.4);\
      }\
      *, *::before, *::after { box-sizing: border-box; }\
      .w-fab {\
        width: 56px; height: 56px; border-radius: 50%;\
        background: var(--w-primary); color: #fff;\
        display: flex; align-items: center; justify-content: center;\
        cursor: pointer; box-shadow: 0 4px 16px rgba(124,58,237,0.3);\
        transition: transform 0.2s, opacity 0.2s;\
        position: absolute; bottom: 0; right: 0;\
        border: none; outline: none;\
      }\
      .w-fab:hover { transform: scale(1.05); }\
      .w-fab.w-hidden { opacity: 0; transform: scale(0.8); pointer-events: none; }\
      .w-panel {\
        width: 360px; height: 560px; max-height: calc(100vh - 100px);\
        background: var(--w-bg); border-radius: var(--w-radius);\
        box-shadow: var(--w-shadow); border: 1px solid var(--w-border);\
        display: flex; flex-direction: column; overflow: hidden;\
        opacity: 0; transform: translateY(20px) scale(0.95);\
        transition: opacity 0.25s, transform 0.25s;\
        pointer-events: none;\
        position: absolute; bottom: 0; right: 0;\
      }\
      .w-panel.w-open {\
        opacity: 1; transform: translateY(0) scale(1);\
        pointer-events: all;\
      }\
      .w-header {\
        display: flex; align-items: center; justify-content: space-between;\
        padding: 16px 20px;\
        background: var(--w-primary); color: #fff;\
        border-radius: var(--w-radius) var(--w-radius) 0 0;\
      }\
      .w-header-left { display: flex; align-items: center; gap: 10px; }\
      .w-avatar {\
        width: 36px; height: 36px; border-radius: 50%;\
        background: rgba(255,255,255,0.2);\
        display: flex; align-items: center; justify-content: center;\
      }\
      .w-title { font-weight: 600; font-size: 14px; }\
      .w-subtitle { font-size: 11px; opacity: 0.85; }\
      .w-header-right { display: flex; gap: 4px; }\
      .w-icon-btn {\
        width: 30px; height: 30px; border-radius: 8px;\
        background: transparent; color: #fff;\
        border: none; cursor: pointer; display: flex;\
        align-items: center; justify-content: center;\
        font-size: 16px; transition: background 0.15s;\
      }\
      .w-icon-btn:hover { background: rgba(255,255,255,0.15); }\
      .w-msgs {\
        flex: 1; overflow-y: auto; padding: 16px;\
        display: flex; flex-direction: column; gap: 8px;\
        background: var(--w-bg);\
      }\
      .w-msg { display: flex; }\
      .w-user { justify-content: flex-end; }\
      .w-text {\
        max-width: 85%; padding: 10px 14px; border-radius: 12px;\
        font-size: 13px; line-height: 1.5; word-wrap: break-word;\
        white-space: pre-wrap;\
      }\
      .w-user .w-text {\
        background: var(--w-primary); color: #fff;\
        border-bottom-right-radius: 4px;\
      }\
      .w-bot .w-text {\
        background: var(--w-card); color: var(--w-text);\
        border-bottom-left-radius: 4px;\
      }\
      .w-footer {\
        padding: 12px 16px;\
        border-top: 1px solid var(--w-border);\
        background: var(--w-bg);\
      }\
      .w-input-wrap {\
        display: flex; align-items: flex-end; gap: 8px;\
        background: var(--w-card); border-radius: 12px;\
        padding: 4px; border: 1px solid var(--w-border);\
        transition: border-color 0.15s;\
      }\
      .w-input-wrap:focus-within { border-color: var(--w-primary); }\
      .w-input {\
        flex: 1; border: none; outline: none; resize: none;\
        padding: 8px 10px; font-size: 13px; line-height: 1.4;\
        font-family: inherit; background: transparent;\
        color: var(--w-text); max-height: 80px;\
      }\
      .w-input::placeholder { color: #94a3b8; }\
      .w-send-btn {\
        width: 34px; height: 34px; border-radius: 10px;\
        background: var(--w-primary); color: #fff;\
        border: none; cursor: pointer; font-size: 16px;\
        display: flex; align-items: center; justify-content: center;\
        transition: opacity 0.15s; flex-shrink: 0;\
      }\
      .w-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }\
      .w-brand {\
        text-align: center; font-size: 10px;\
        color: #94a3b8; margin-top: 6px;\
      }\
      @media (max-width: 480px) {\
        :host { bottom: 0; right: 0; left: 0; top: auto; }\
        .w-panel {\
          width: 100%; max-height: calc(100vh - 60px);\
          border-radius: 16px 16px 0 0;\
          position: fixed; bottom: 0; left: 0; right: 0;\
        }\
        .w-fab { bottom: 16px; right: 16px; position: fixed; }\
      }\
    ';
  }

  loadConfig();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createWidget);
  } else {
    createWidget();
  }
})();
