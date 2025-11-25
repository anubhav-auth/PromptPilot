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
  icon.style.transition = "transform 0.2s ease";

  // Position icon inside the right edge of the input
  const rect = target.getBoundingClientRect();
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;
  
  icon.style.top = `${scrollY + rect.top + (rect.height > 30 ? 10 : rect.height / 2 - 12)}px`;
  icon.style.left = `${scrollX + rect.right - 32}px`;

  icon.addEventListener("mouseenter", () => {
    icon.style.transform = "scale(1.1)";
  });
  icon.addEventListener("mouseleave", () => {
    icon.style.transform = "scale(1)";
  });

  icon.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
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

  const modalWidth = 450;
  const modalHeight = 500; // Slightly taller for better UX
  const padding = 16; // Padding from screen edges

  modalIframe.style.position = "absolute";
  modalIframe.style.border = "none";
  modalIframe.style.zIndex = "2147483647"; // Max safe z-index
  modalIframe.style.backgroundColor = "transparent";
  modalIframe.style.width = `${modalWidth}px`;
  modalIframe.style.height = `${modalHeight}px`;
  modalIframe.style.borderRadius = "12px";
  modalIframe.style.boxShadow = "0 10px 40px rgba(0,0,0,0.25)";

  const rect = target.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;

  // --- INTELLIGENT POSITIONING LOGIC ---

  // 1. Vertical Alignment
  const spaceBelow = viewportHeight - rect.bottom;
  const spaceAbove = rect.top;
  let topPos;

  if (spaceBelow >= modalHeight + padding) {
    // Prefer below
    topPos = scrollY + rect.bottom + 8;
  } else if (spaceAbove >= modalHeight + padding) {
    // Fallback above
    topPos = scrollY + rect.top - modalHeight - 8;
  } else {
    // If neither fits perfectly, center vertically relative to viewport, but clamp to document bounds
    const viewportCenter = scrollY + viewportHeight / 2 - modalHeight / 2;
    topPos = Math.max(scrollY + padding, viewportCenter);
  }

  // 2. Horizontal Alignment
  // Default: Align right edge of modal with right edge of input
  let leftPos = scrollX + rect.right - modalWidth;

  // Clamp to left viewport edge
  if (leftPos < scrollX + padding) {
    leftPos = scrollX + padding;
  }

  // Clamp to right viewport edge
  if (leftPos + modalWidth > scrollX + viewportWidth - padding) {
    leftPos = scrollX + viewportWidth - modalWidth - padding;
  }

  modalIframe.style.top = `${topPos}px`;
  modalIframe.style.left = `${leftPos}px`;

  document.body.appendChild(modalIframe);
  
  // Add overlay to catch clicks outside
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
  // Check if click is outside the iframe and icon
  const target = event.target as Node;
  if (
    modalIframe &&
    activeIcon &&
    !activeIcon.contains(target)
  ) {
    // We can't detect clicks *inside* the iframe from here due to cross-origin/frame rules usually,
    // but this listener is on the main document. 
    // If the user clicks anywhere on the main page, close the modal.
    closeModal();
  }
}

window.addEventListener(
  "message",
  (event) => {
    // Security check: ensure message is from our extension
    if (event.data.type === "prompt-pilot-close-modal") {
      closeModal();
    } else if (event.data.type === "prompt-pilot-replace-text" && activeInput) {
      const fullText = getElementText(activeInput);
      const triggerIndex = fullText.lastIndexOf(TRIGGER_PHRASE);
      const textBeforeTrigger =
        triggerIndex !== -1 ? fullText.substring(0, triggerIndex) : fullText;

      // Replace everything after trigger with new text
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
  // Debounce could be added here if performance issues arise
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