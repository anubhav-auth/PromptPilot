import { useState } from "react";
import { showError } from "@/utils/toast";
import {
  Intent,
  Structure,
  UserPlan,
  DailyUsage,
  DAILY_LIMIT,
} from "@/components/improve-modal/constants";

interface UseImproveAIProps {
  apiKey: string | null;
  userPlan: UserPlan | null;
  domain: string;
}

const buildSystemPrompt = (intent: Intent, structure: Structure): string => {
  let systemPrompt = `You are an AI assistant.`;

  // Handle Intent
  switch (intent) {
    case "general-improve":
      systemPrompt += ` Your task is to refine the following text. Provide a standard polish for better clarity and readability.`;
      break;
    case "fix-grammar-tone":
      systemPrompt += ` Your task is to refine the following text. Correct spelling/grammar errors and ensure a professional tone without changing the core message.`;
      break;
    case "summarize-request":
      systemPrompt += ` Your task is to condense the following text into its essential ask.`;
      break;
    case "expand-context":
      systemPrompt += ` Your task is to take the following vague one-liner and add necessary background details.`;
      break;
    case "simplify-language":
      systemPrompt += ` Your task is to simplify the following text. Make it easier to understand for a general audience, using simpler words and shorter sentences.`;
      break;
    case "make-more-formal":
      systemPrompt += ` Your task is to rewrite the following text in a more formal and professional tone. Avoid slang, contractions, and overly casual language.`;
      break;
    case "chain-of-thought":
      systemPrompt += ` You must explicitly write out your reasoning steps before giving a final answer. This is crucial for complex logic/math.`;
      break;
    case "persona-adoption":
      systemPrompt += ` You will adopt a specific role based on the user's text. For example, if the user provides 'Act as a Senior React Developer', you will adopt that persona.`;
      break;
    case "socratic-tutor":
      systemPrompt += ` Act as a Socratic tutor. Instead of giving the answer, ask insightful questions to help the user improve their writing themselves.`;
      break;
    case "code-expert":
      systemPrompt += ` Act as a code expert. Review and improve the following code snippet, providing explanations for your changes. Ensure the code is clean, commented, and efficient.`;
      break;
    case "creative-writer":
      systemPrompt += ` Act as a creative writer. Your style should be more evocative, descriptive, and less robotic.`;
      break;
    case "analogy-generator":
      systemPrompt += ` Act as an expert in explaining complex topics. Your task is to generate a clear and insightful analogy for the user's text.`;
      break;
    case "brainstorm-ideas":
      systemPrompt += ` Act as a creative partner. Your task is to brainstorm a list of diverse and innovative ideas based on the user's topic or request.`;
      break;
  }

  // Handle Structure
  switch (structure) {
    case "paragraph":
      systemPrompt += ` Format the output as natural language prose.`;
      break;
    case "bullet-points":
      systemPrompt += ` Format the output as a clear, itemized list of bullet points.`;
      break;
    case "step-by-step":
      systemPrompt += ` Structure the output as a sequential set of step-by-step actions.`;
      break;
    case "numbered-list":
      systemPrompt += ` Format the output as a numbered list, suitable for ordered sequences or instructions.`;
      break;
    case "json-format":
      systemPrompt += ` The output must be strictly valid JSON.`;
      break;
    case "markdown-table":
      systemPrompt += ` Organize the data into a clean, copy-pasteable markdown table.`;
      break;
    case "code-block-only":
      systemPrompt += ` Return only the code snippet without any conversational filler text before or after.`;
      break;
    case "mermaid-diagram":
      systemPrompt += ` The output must be in Mermaid.js syntax, which can be rendered visually as flowcharts or sequence diagrams.`;
      break;
    case "csv-format":
      systemPrompt += ` The output must be in valid CSV (Comma-Separated Values) format. Include a header row.`;
      break;
    case "yaml-format":
      systemPrompt += ` The output must be strictly valid YAML.`;
      break;
  }
  return systemPrompt;
};

export function useImproveAI({ apiKey, userPlan, domain }: UseImproveAIProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);

  const improveText = async (
    originalText: string,
    intent: Intent,
    structure: Structure,
  ) => {
    if (!apiKey) {
      setError(
        "OpenAI API key not found. Please add it in the extension settings.",
      );
      return;
    }
    if (!originalText) {
      setError("No text to improve.");
      return;
    }

    if (userPlan?.tier === "free") {
      const usageData: DailyUsage = await new Promise((resolve) => {
        chrome.storage.local.get("daily_usage", (res) => {
          resolve(res.daily_usage || { count: 0, lastReset: Date.now() });
        });
      });

      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      if (now - usageData.lastReset > oneDay) {
        usageData.count = 0;
        usageData.lastReset = now;
      }

      if (usageData.count >= DAILY_LIMIT) {
        const message =
          "Daily limit of 10 improvements reached. Upgrade to Pro for unlimited usage.";
        setError(message);
        showError(message);
        return;
      }
    }

    chrome.runtime.sendMessage({
      type: "logEvent",
      data: {
        event_type: "improve_clicked",
        domain,
        intent,
        structure,
      },
    });

    setIsLoading(true);
    setError(null);
    setResultText(null);

    const systemPrompt = buildSystemPrompt(intent, structure);

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: originalText },
            ],
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || "Failed to fetch from OpenAI.",
        );
      }

      const data = await response.json();
      const result = data.choices[0]?.message?.content;
      if (result) {
        setResultText(result);
        if (userPlan?.tier === "free") {
          chrome.storage.local.get("daily_usage", (res) => {
            const usageData: DailyUsage =
              res.daily_usage || { count: 0, lastReset: Date.now() };
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            if (now - usageData.lastReset > oneDay) {
              usageData.count = 1;
              usageData.lastReset = now;
            } else {
              usageData.count += 1;
            }
            chrome.storage.local.set({ daily_usage: usageData });
          });
        }
      } else {
        throw new Error("Received an empty response from OpenAI.");
      }
    } catch (e: any) {
      setError(e.message);
      showError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, resultText, improveText };
}