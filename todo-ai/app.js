const form = document.querySelector("#chatForm");
const input = document.querySelector("#messageInput");
const messagesElement = document.querySelector("#messages");
const welcome = document.querySelector("#welcome");
const sendButton = document.querySelector("#sendButton");
const newChatButton = document.querySelector("#newChatButton");
const template = document.querySelector("#messageTemplate");

let messages = [];
let busy = false;

form.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(input.value);
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

input.addEventListener("input", resizeInput);

document.querySelectorAll(".suggestion").forEach((button) => {
  button.addEventListener("click", () => sendMessage(button.dataset.prompt));
});

newChatButton.addEventListener("click", () => {
  messages = [];
  messagesElement.replaceChildren(welcome);
  welcome.hidden = false;
  input.value = "";
  resizeInput();
  input.focus();
});

async function sendMessage(rawText) {
  const text = rawText.trim();
  if (!text || busy) return;

  busy = true;
  sendButton.disabled = true;
  welcome.hidden = true;
  input.value = "";
  resizeInput();

  messages.push({ role: "user", text });
  addMessage("user", text);
  const loader = addLoader();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Kuch galat ho gaya.");

    messages.push({ role: "assistant", text: data.reply });
    loader.remove();
    addMessage("assistant", data.reply);
  } catch (error) {
    loader.remove();
    addMessage("assistant", `⚠ ${error.message}`, true);
  } finally {
    busy = false;
    sendButton.disabled = false;
    input.focus();
  }
}

function addMessage(role, text, isError = false) {
  const element = template.content.firstElementChild.cloneNode(true);
  element.classList.add(role);
  element.querySelector(".avatar").textContent = role === "user" ? "आप" : "T";
  const bubble = element.querySelector(".bubble");
  bubble.textContent = text;
  if (isError) bubble.style.color = "#ffb4a8";
  messagesElement.append(element);
  scrollToBottom();
  return element;
}

function addLoader() {
  const element = addMessage("assistant", "");
  element.classList.add("loading");
  element.querySelector(".bubble").innerHTML = '<i class="dot"></i><i class="dot"></i><i class="dot"></i>';
  return element;
}

function resizeInput() {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 130)}px`;
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    messagesElement.scrollTop = messagesElement.scrollHeight;
  });
}
