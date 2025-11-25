/// <reference types="chrome" />

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "logEvent") {
    console.log("PromptPilot Log:", message.data);
    sendResponse({ success: true });
    return false;
  }
});

// Listen for keyboard shortcuts defined in manifest.json
chrome.commands.onCommand.addListener((command) => {
  if (command === "open-prompt-pilot") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        // Send a trigger message to the content script in the active tab
        chrome.tabs.sendMessage(tabs[0].id, { type: "trigger_cmd_modal" });
      }
    });
  }
});