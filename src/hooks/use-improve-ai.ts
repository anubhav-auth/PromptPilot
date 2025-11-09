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

  // Intent behavior
  switch (intent) {
    // TEXT REFINEMENT (FREE)
    case "general_polish":
      systemPrompt += ` Improve clarity, flow, and readability without changing meaning.`;
      break;
    case "fix_grammar":
      systemPrompt += ` Fix spelling and grammar while preserving the original voice.`;
      break;
    case "professional_tone":
      systemPrompt += ` Rewrite in a formal, professional, business-appropriate tone.`;
      break;
    case "casual_tone":
      systemPrompt += ` Rewrite in a friendly, conversational tone.`;
      break;
    case "academic_tone":
      systemPrompt += ` Elevate vocabulary and structure for an academic/scholarly tone.`;
      break;
    case "urgent_tone":
      systemPrompt += ` Make the message direct and urgent, removing filler and hedging.`;
      break;
    case "empathetic_tone":
      systemPrompt += ` Adjust language to be empathetic and understanding.`;
      break;
    case "simplify":
      systemPrompt += ` Explain as if to a 5-year-old; use simple words and short sentences.`;
      break;
    case "summarize":
      systemPrompt += ` Condense to the essential points while preserving key meaning.`;
      break;
    case "expand":
      systemPrompt += ` Expand with necessary background and helpful context.`;
      break;
    case "dejargonize":
      systemPrompt += ` Replace jargon and complex terms with plain, accessible language.`;
      break;

    // PROMPT ENGINEERING (PRO)
    case "cot":
      systemPrompt += ` Think step by step and write out your reasoning before the final answer.`;
      break;
    case "tree_of_thoughts":
      systemPrompt += ` Explore multiple solution paths, compare them, and select the best approach.`;
      break;
    case "socratic":
      systemPrompt += ` Use Socratic questioning to guide rather than directly answer.`;
      break;
    case "feynman":
      systemPrompt += ` Explain as if teaching someone else; ensure clarity and depth.`;
      break;
    case "devils_advocate":
      systemPrompt += ` Challenge the assumptions and provide counterarguments.`;
      break;
    case "compression":
      systemPrompt += ` Compress the prompt to minimal tokens while retaining essential meaning.`;
      break;
    case "few_shot":
      systemPrompt += ` Provide a few generic examples to guide the expected format.`;
      break;
    case "persona":
      systemPrompt += ` Adopt an expert persona appropriate to the user's topic.`;
      break;
    case "critic":
      systemPrompt += ` Critique the input; identify weaknesses and suggest improvements.`;
      break;

    // DOMAIN SPECIFIC (PRO)
    case "code_expert":
      systemPrompt += ` Produce efficient, idiomatic code with standard naming and best practices.`;
      break;
    case "code_commenter":
      systemPrompt += ` Add clear, helpful documentation comments explaining the code.`;
      break;
    case "bug_hunter":
      systemPrompt += ` Find, explain, and fix bugs with concise rationale.`;
      break;
    case "unit_test":
      systemPrompt += ` Generate comprehensive unit tests with edge cases.`;
      break;
    case "sec_auditor":
      systemPrompt += ` Identify security vulnerabilities (e.g., XSS, SQLi) and propose fixes.`;
      break;
    case "copywriter":
      systemPrompt += ` Write persuasive, conversion-focused copy that drives action.`;
      break;
    case "seo_optimizer":
      systemPrompt += ` Optimize for SEO; weave given keywords naturally into the output.`;
      break;
    case "exec_summary":
      systemPrompt += ` Provide a concise executive-level brief suitable for the C-suite.`;
      break;
    case "storyteller":
      systemPrompt += ` Write vivid, non-repetitive narrative with strong imagery.`;
      break;
    case "world_builder":
      systemPrompt += ` Create rich descriptive detail for settings and lore.`;
      break;
    case "screenplay":
      systemPrompt += ` Format as a screenplay using industry conventions.`;
      break;
  }

  // Output structure
  switch (structure) {
    // FREE
    case "para":
      systemPrompt += ` Output as natural language prose.`;
      break;
    case "bullets":
      systemPrompt += ` Output as concise bullet points.`;
      break;
    case "steps":
      systemPrompt += ` Output as numbered steps in sequence.`;
      break;
    case "checklist":
      systemPrompt += ` Output as a checklist using '- [ ] ' items.`;
      break;

    // PRO
    case "json":
      systemPrompt += ` Output must be strictly valid JSON (no extra text).`;
      break;
    case "csv":
      systemPrompt += ` Output must be valid CSV with a header row.`;
      break;
    case "markdown_table":
      systemPrompt += ` Output as a clean Markdown table with headers.`;
      break;
    case "yaml":
      systemPrompt += ` Output must be strictly valid YAML (no extra text).`;
      break;
    case "xml":
      systemPrompt += ` Output must be valid XML with appropriate tags.`;
      break;
    case "mermaid":
      systemPrompt += ` Output must be Mermaid diagram syntax only.`;
      break;
    case "latex":
      systemPrompt += ` Use LaTeX formatting for mathematical or structured content.`;
      break;
    case "code_only":
      systemPrompt += ` Return only the code block with no additional commentary.`;
      break;
    case "tldr":
      systemPrompt += ` Output only a single-sentence TL;DR summary.`;
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