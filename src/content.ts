/// <reference types="chrome" />

let activeIcon: HTMLElement | null = null;
let modalIframe: HTMLIFrameElement | null = null;
let activeInput: HTMLElement | null = null;

const TRIGGER_PHRASE = "improve:";

function showIcon(target: HTMLElement) {
  if (activeIcon) {
    activeIcon.remove();
  }

  chrome.runtime.sendMessage({
    type: "logEvent",
    data: {
      event_type: "trigger_detected",
      domain: window.location.hostname,
    },
  });

  const icon = document.createElement("div");
  icon.innerHTML = "⚡";
  icon.style.position = "absolute";
  icon.style.cursor = "pointer";
  icon.style.fontSize = "16px";
  icon.style.zIndex = "9998";
  icon.style.backgroundColor = "white";
  icon.style.borderRadius = "50%";
  icon.style.width = "24px";
  icon.style.height = "24px";
  icon.style.display = "flex";
  icon.style.alignItems = "center";
  icon.style.justifyContent = "center";
  icon.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";

  const rect = target.getBoundingClientRect();
  icon.style.top = `${window.scrollY + rect.top + rect.height / 2 - 12}px`;
  icon.style.left = `${window.scrollX + rect.right - 40}px`;

  icon.addEventListener("click", (e) => {
    e.stopPropagation();
    activeInput = target;
    openModal(target);
  });

  document.body.appendChild(icon);
  activeIcon = icon;
}

function hideIcon() {
  if (activeIcon) {
    activeIcon.remove();
    activeIcon = null;
  }
}

function getElementText(element: HTMLElement): string {
  if (
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLInputElement
  ) {
    return element.value;
  } else if (element.isContentEditable) {
    return element.textContent || "";
  }
  return "";
}

function setElementText(element: HTMLElement, newText: string) {
  if (
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLInputElement
  ) {
    element.value = newText;
  } else if (element.isContentEditable) {
    element.textContent = newText;
  }
  // Dispatch an input event to notify any listeners on the element
  element.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
}

function openModal(target: HTMLElement) {
  if (modalIframe) return;

  const fullText = getElementText(target);
  const triggerIndex = fullText.lastIndexOf(TRIGGER_PHRASE);
  const textToImprove =
    triggerIndex !== -1
      ? fullText.substring(triggerIndex + TRIGGER_PHRASE.length)
      : "";
  const domain = window.location.hostname;

  modalIframe = document.createElement("iframe");
  modalIframe.src = chrome.runtime.getURL(
    `modal.html?text=${encodeURIComponent(
      textToImprove.trim(),
    )}&domain=${encodeURIComponent(domain)}`,
  );

  modalIframe.style.position = "absolute";
  modalIframe.style.border = "none";
  modalIframe.style.zIndex = "9999";
  modalIframe.style.backgroundColor = "transparent";
  modalIframe.style.width = "450px";
  modalIframe.style.height = "450px";
  modalIframe.style.boxShadow = "0 5px 15px rgba(0,0,0,0.3)";
  modalIframe.style.borderRadius = "8px";
  modalIframe.style.overflow = "hidden";

  const rect = target.getBoundingClientRect();
  const top = window.scrollY + rect.bottom + 8;
  const left = window.scrollX + rect.right - 450;

  modalIframe.style.top = `${top}px`;
  modalIframe.style.left = `${Math.max(8, left)}px`;

  document.body.appendChild(modalIframe);
  document.addEventListener("click", handleClickOutside, true);
}

function closeModal() {
  if (modalIframe) {
    modalIframe.remove();
    modalIframe = null;
  }
  hideIcon();
  document.removeEventListener("click", handleClickOutside, true);

  if (activeInput) {
    activeInput.focus();
    activeInput = null;
  }
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node;
  if (
    modalIframe &&
    !modalIframe.contains(target) &&
    activeIcon &&
    !activeIcon.contains(target)
  ) {
    closeModal();
  }
}

window.addEventListener(
  "message",
  (event) => {
    if (event.source !== modalIframe?.contentWindow) {
      return;
    }

    if (event.data.type === "prompt-pilot-close-modal") {
      closeModal();
    } else if (event.data.type === "prompt-pilot-replace-text" && activeInput) {
      const fullText = getElementText(activeInput);
      const triggerIndex = fullText.lastIndexOf(TRIGGER_PHRASE);
      const textBeforeTrigger =
        triggerIndex !== -1 ? fullText.substring(0, triggerIndex) : fullText;

      const newText = textBeforeTrigger + event.data.text;
      setElementText(activeInput, newText);

      closeModal();
    }
  },
  false,
);

function handleInput(event: Event) {
  const target = event.target as HTMLElement;
  const text = getElementText(target);

  if (text.includes(TRIGGER_PHRASE)) {
    showIcon(target);
  } else {
    hideIcon();
  }
}

function attachListener(element: HTMLElement) {
  element.addEventListener("input", handleInput);
}

function observeDocument() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          const inputs = node.querySelectorAll(
            'textarea, input, [contenteditable="true"]',
          );
          inputs.forEach((el) => attachListener(el as HTMLElement));
          if (node.matches('textarea, input, [contenteditable="true"]')) {
            attachListener(node as HTMLElement);
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function init() {
  document
    .querySelectorAll('textarea, input, [contenteditable="true"]')
    .forEach((el) => {
      attachListener(el as HTMLElement);
    });
  observeDocument();
}

init();