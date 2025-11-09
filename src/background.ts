/// <reference types="chrome" />

import { supabase } from "./integrations/supabase/client";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "logEvent") {
    handleLogEvent(message.data)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Indicates that the response is sent asynchronously
  }
});

async function handleLogEvent(data: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log("No user found, skipping log.");
    return;
  }

  const logData = {
    user_id: user.id,
    domain: data.domain,
    event_type: data.event_type,
    intent: data.intent,
    structure: data.structure,
    tone: data.tone,
    action_taken: data.action_taken,
  };

  const { error } = await supabase.from("improvement_logs").insert([logData]);

  if (error) {
    console.error("Error logging event to Supabase:", error);
    throw error;
  }
}