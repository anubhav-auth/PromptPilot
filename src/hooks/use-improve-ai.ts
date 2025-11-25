import { useState } from "react";
import { showError } from "@/utils/toast";
import { Intent, Structure } from "@/components/improve-modal/constants";

interface UseImproveAIProps {
  apiKey: string | null;
  domain: string;
}

const buildSystemPrompt = (intent: string, structure: Structure, customInstruction?: string): string => {
  const BASE_SYSTEM = `You are PromptPilot, an expert AI text transformation engine.
Your goal is to strictly process the User Input according to the defined ACTION and FORMAT constraints.
Do NOT converse. Do NOT provide explanations unless the format specifically asks for them.
Return ONLY the final transformed output.`;

  let actionInstruction = "";
  let constraints = "";

  if (customInstruction) {
    actionInstruction = `ACTION: ${customInstruction}`;
    constraints = "Follow the user's custom instruction precisely. Do NOT chat.";
  } else {
    switch (intent) {
      // --- TEXT REFINEMENT (Editing Content) ---
      case "general_polish":
        actionInstruction = "ACTION: Refine the User Input for better clarity, flow, and readability.";
        constraints = "Keep the original meaning. Do not add new information. Just polish the existing text.";
        break;
      case "fix_grammar":
        actionInstruction = "ACTION: Fix all spelling, grammar, and punctuation errors.";
        constraints = "Make NO other changes. Return the corrected text only.";
        break;
      case "professional_tone":
        actionInstruction = "ACTION: Rewrite the User Input to sound formal, professional, and business-like.";
        break;
      case "casual_tone":
        actionInstruction = "ACTION: Rewrite the User Input to sound friendly and conversational.";
        break;
      case "academic_tone":
        actionInstruction = "ACTION: Rewrite the User Input using academic vocabulary and structure.";
        break;
      case "urgent_tone":
        actionInstruction = "ACTION: Rewrite the User Input to be direct, punchy, and urgent.";
        break;
      case "empathetic_tone":
        actionInstruction = "ACTION: Rewrite the User Input to be kind, supportive, and empathetic.";
        break;
      case "simplify":
        actionInstruction = "ACTION: Simplify the User Input for a 5-year-old reader.";
        break;
      case "summarize":
        actionInstruction = "ACTION: Summarize the User Input into key points.";
        break;
      case "expand":
        actionInstruction = "ACTION: Expand the User Input with relevant context/details.";
        break;
      case "dejargonize":
        actionInstruction = "ACTION: Replace all jargon in the User Input with plain English.";
        break;

      // --- PROMPT ENGINEERING (Optimizing Prompts for ChatGPT) ---
      case "cot":
        // REFINED: Explicitly ask for the solution AND the steps
        actionInstruction = "ACTION: Rewrite the User Input into a detailed prompt that asks an AI to solve the problem step-by-step and then provide the final solution/code.";
        constraints = "Ensure the prompt asks for the FINAL OUTPUT (e.g., code, answer) after the reasoning steps.";
        break;
      case "tree_of_thoughts":
        actionInstruction = "ACTION: Rewrite the User Input into a complex AI prompt that enforces 'Tree of Thoughts' exploration.";
        constraints = "The output must be a PROMPT instructing an AI to explore multiple paths before giving the final answer.";
        break;
      case "socratic":
        actionInstruction = "ACTION: Rewrite the User Input into a system prompt that creates a Socratic Tutor persona.";
        break;
      case "feynman":
        actionInstruction = "ACTION: Rewrite the User Input into a prompt that asks for a simple, Feynman-style explanation.";
        break;
      case "devils_advocate":
        actionInstruction = "ACTION: Rewrite the User Input into a prompt that asks an AI to critique and challenge arguments.";
        break;
      case "compression":
        actionInstruction = "ACTION: Compress the User Input to minimum tokens while keeping semantic meaning.";
        constraints = "Telegraphic style. No filler words.";
        break;
      case "few_shot":
        actionInstruction = "ACTION: Convert the User Input into a 'Few-Shot' prompt template with 3 examples.";
        constraints = "Generate the examples based on the topic. Return the full prompt template.";
        break;
      case "persona":
        actionInstruction = "ACTION: Rewrite the User Input into a prompt that assigns a specific Expert Persona to the AI.";
        constraints = "Identify the best expert for the task and prepend it (e.g., 'Act as a Senior Engineer...').";
        break;
      case "critic":
        actionInstruction = "ACTION: Rewrite the User Input into a prompt that asks an AI to critique the input.";
        break;

      // --- DOMAIN SPECIFIC (Generation) ---
      case "code_expert":
        // REFINED: Stronger push for code generation
        actionInstruction = "ACTION: Rewrite the User Input into a prompt that strictly asks for high-quality, production-ready code.";
        constraints = "The prompt should explicitly request comments, error handling, and best practices. It must ask for the CODE itself, not just a guide.";
        break;
      case "code_commenter":
        actionInstruction = "ACTION: Add documentation comments to the code in the User Input.";
        break;
      case "bug_hunter":
        actionInstruction = "ACTION: Fix bugs in the provided code snippet.";
        break;
      case "unit_test":
        actionInstruction = "ACTION: Write unit tests for the provided code.";
        break;
      case "sec_auditor":
        actionInstruction = "ACTION: Analyze the text/code for security flaws.";
        break;
      case "copywriter":
        actionInstruction = "ACTION: Rewrite the User Input as high-converting marketing copy.";
        break;
      case "seo_optimizer":
        actionInstruction = "ACTION: Optimize the User Input for SEO keywords.";
        break;
      case "exec_summary":
        actionInstruction = "ACTION: Rewrite the User Input as an Executive Summary (BLUF).";
        break;
      case "storyteller":
        actionInstruction = "ACTION: Rewrite the User Input as a narrative story.";
        break;
      case "world_builder":
        actionInstruction = "ACTION: Expand the User Input into a rich setting description.";
        break;
      case "screenplay":
        actionInstruction = "ACTION: Format the User Input as a Hollywood Screenplay.";
        break;
    }
  }

  let formatInstruction = "";
  switch (structure) {
    case "para": formatInstruction = "FORMAT: Standard prose paragraphs. No Markdown blocks."; break;
    case "bullets": formatInstruction = "FORMAT: Bulleted list (use '*')."; break;
    case "steps": formatInstruction = "FORMAT: Numbered list (1., 2., 3.)."; break;
    case "checklist": formatInstruction = "FORMAT: Markdown checklist ('- [ ]')."; break;
    case "json": formatInstruction = "FORMAT: Valid JSON only. NO conversational text."; break;
    case "csv": formatInstruction = "FORMAT: Valid CSV with header row."; break;
    case "markdown_table": formatInstruction = "FORMAT: Markdown table."; break;
    case "yaml": formatInstruction = "FORMAT: Valid YAML only."; break;
    case "xml": formatInstruction = "FORMAT: Valid XML only."; break;
    case "mermaid": formatInstruction = "FORMAT: Mermaid.js diagram syntax."; break;
    case "latex": formatInstruction = "FORMAT: LaTeX syntax."; break;
    case "code_only": formatInstruction = "FORMAT: Code block only. NO intro/outro text."; break;
    case "tldr": formatInstruction = "FORMAT: Single sentence."; break;
  }

  return `${BASE_SYSTEM}\n\n${actionInstruction}\n${constraints}\n${formatInstruction}`;
};

export function useImproveAI({ apiKey, domain }: UseImproveAIProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);

  const improveText = async (
    originalText: string,
    intent: string,
    structure: Structure,
    customInstruction?: string
  ) => {
    if (!apiKey) {
      setError("OpenAI API key not found. Please add it in the extension settings.");
      return;
    }
    if (!originalText) {
      setError("No text to improve.");
      return;
    }

    const { openai_model } = await new Promise<{ openai_model?: string }>((resolve) => {
      chrome.storage.local.get("openai_model", (res) => resolve(res));
    });

    const selectedModel = openai_model || "gpt-4o-mini";

    chrome.storage.local.get("daily_usage", (res) => {
      const usageData = res.daily_usage || { count: 0, lastReset: Date.now() };
      const now = Date.now();
      if (now - usageData.lastReset > 86400000) {
        usageData.count = 0;
        usageData.lastReset = now;
      }
      usageData.count += 1;
      chrome.storage.local.set({ daily_usage: usageData });
    });

    chrome.runtime.sendMessage({
      type: "logEvent",
      data: { event_type: "improve_clicked", domain, intent, structure, model: selectedModel },
    });

    setIsLoading(true);
    setError(null);
    setResultText("");

    const systemPrompt = buildSystemPrompt(intent, structure, customInstruction);
    const finalUserMessage = `"""\n${originalText}\n"""`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: finalUserMessage },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to fetch from OpenAI.");
      }

      if (!response.body) throw new Error("Streaming not supported.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let accumulatedText = "";
      let buffer = "";
      let isFirstChunk = true;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "data: [DONE]") continue;

            if (trimmed.startsWith("data: ")) {
              try {
                const json = JSON.parse(trimmed.slice(6));
                const content = json.choices[0]?.delta?.content || "";
                
                if (content) {
                  accumulatedText += content;
                  setResultText(accumulatedText);
                  
                  if (isFirstChunk) {
                    setIsLoading(false);
                    isFirstChunk = false;
                  }
                }
              } catch (e) {
                // Ignore partial JSON chunks
              }
            }
          }
        }
      }
      setIsLoading(false);

    } catch (e: any) {
      setError(e.message);
      showError(e.message);
      setIsLoading(false);
    }
  };

  return { isLoading, error, resultText, improveText };
}