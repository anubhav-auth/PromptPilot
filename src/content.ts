/// <reference types="chrome" />

let activeIcon: HTMLElement | null = null;
let modalIframe: HTMLIFrameElement | null = null;

const TRIGGER_PHRASE = "improve:";

function showIcon(target: HTMLElement) {
  if (activeIcon) {
    activeIcon.remove();
  }

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
  icon.style.top = `${window.scrollY + rect.top + (rect.height / 2) - 12}px`;
  icon.style.left = `${window.scrollX + rect.right - 30}px`;

  icon.addEventListener("click", (e) => {
    e.stopPropagation();
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

function openModal(target: HTMLElement) {
  if (modalIframe) return;

  modalIframe = document.createElement("iframe");
  modalIframe.src = chrome.runtime.getURL("modal.html");
  
  // Style the iframe to be a floating box
  modalIframe.style.position = "absolute";
  modalIframe.style.border = "none";
  modalIframe.style.zIndex = "9999";
  modalIframe.style.backgroundColor = "transparent";
  modalIframe.style.width = "450px";
  modalIframe.style.height = "300px";
  modalIframe.style.boxShadow = "0 5px 15px rgba(0,0,0,0.3)";
  modalIframe.style.borderRadius = "8px";
  modalIframe.style.overflow = "hidden";

  // Position the iframe near the target element
  const rect = target.getBoundingClientRect();
  const top = window.scrollY + rect.bottom + 8; // 8px below the target
  const left = window.scrollX + rect.right - 450; // Align right edge with target's right edge
  
  modalIframe.style.top = `${top}px`;
  // Ensure the modal doesn't render off-screen
  modalIframe.style.left = `${Math.max(8, left)}px`;

  document.body.appendChild(modalIframe);

  // Add a listener to close the modal if the user clicks outside
  document.addEventListener('click', handleClickOutside, true);
}

function closeModal() {
  if (modalIframe) {
    modalIframe.remove();
    modalIframe = null;
  }
  hideIcon();
  document.removeEventListener('click', handleClickOutside, true);
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node;
  // Close if the click is outside the iframe and not on the icon
  if (modalIframe && !modalIframe.contains(target) && activeIcon && !activeIcon.contains(target)) {
    closeModal();
  }
}

// Listen for close messages from the iframe
window.addEventListener("message", (event) => {
  if (event.source !== modalIframe?.contentWindow) {
    return;
  }
  if (event.data.type === "prompt-pilot-close-modal") {
    closeModal();
  }
}, false);


function handleInput(event: Event) {
  const target = event.target as HTMLElement;
  let text = "";

  if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
    text = target.value;
  } else if (target.isContentEditable) {
    text = target.textContent || "";
  }

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
          const inputs = node.querySelectorAll('textarea, [contenteditable="true"]');
          inputs.forEach(el => attachListener(el as HTMLElement));
          if (node.matches('textarea, [contenteditable="true"]')) {
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
  document.querySelectorAll('textarea, [contenteditable="true"]').forEach((el) => {
    attachListener(el as HTMLElement);
  });
  observeDocument();
}

init();