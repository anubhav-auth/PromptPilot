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
    constraints = "Follow the user's custom instruction precisely.";
  } else {
    switch (intent) {
      case "general_polish":
        actionInstruction = "ACTION: Refine the User Input for better clarity, flow, and readability.";
        constraints = "Keep the original meaning and tone. Remove redundancy.";
        break;
      case "fix_grammar":
        actionInstruction = "ACTION: Correct all grammatical, spelling, and punctuation errors.";
        constraints = "Do not change the style or vocabulary level. Only fix objective errors.";
        break;
      case "professional_tone":
        actionInstruction = "ACTION: Rewrite the User Input to sound formal, professional, and business-appropriate.";
        constraints = "Avoid slang, contractions, and emotional outbursts. Use precise vocabulary.";
        break;
      case "casual_tone":
        actionInstruction = "ACTION: Rewrite the User Input to sound friendly, conversational, and relaxed.";
        constraints = "Use accessible language. Avoid stiff corporate phrasing.";
        break;
      case "academic_tone":
        actionInstruction = "ACTION: Elevate the User Input to an academic/scholarly standard.";
        constraints = "Use sophisticated vocabulary and precise structural logic.";
        break;
      case "urgent_tone":
        actionInstruction = "ACTION: Rewrite the User Input to convey urgency and directness.";
        constraints = "Remove pleasantries and filler. Use short, active sentences.";
        break;
      case "empathetic_tone":
        actionInstruction = "ACTION: Rewrite the User Input to be more empathetic, understanding, and soft.";
        constraints = "Focus on emotional resonance and support.";
        break;
      case "simplify":
        actionInstruction = "ACTION: Rewrite the User Input so it can be understood by a 5-year-old.";
        constraints = "Use extremely simple words and short sentences.";
        break;
      case "summarize":
        actionInstruction = "ACTION: Provide a concise summary of the User Input.";
        constraints = "Capture only the most critical information. Discard details.";
        break;
      case "expand":
        actionInstruction = "ACTION: Expand upon the User Input with relevant context and details.";
        constraints = "Maintain the original topic. Elaborate on existing points logically.";
        break;
      case "dejargonize":
        actionInstruction = "ACTION: Remove industry jargon and buzzwords from the User Input.";
        constraints = "Replace complex terms with plain English equivalents.";
        break;

      // PROMPT ENGINEERING
      case "cot":
        actionInstruction = "ACTION: Rewrite the User Input into a prompt that explicitly instructs an AI to use 'Chain of Thought' reasoning.";
        constraints = "Start with instructions like 'Think step-by-step...' followed by the user's request.";
        break;
      case "tree_of_thoughts":
        actionInstruction = "ACTION: Rewrite the User Input into a prompt that instructs an AI to use 'Tree of Thoughts' methodology.";
        constraints = "Ask the AI to explore multiple solution paths before concluding.";
        break;
      case "socratic":
        actionInstruction = "ACTION: Rewrite the User Input into a prompt that instructs an AI to act as a Socratic Tutor.";
        constraints = "Tell the AI NOT to give the answer, but to ask guiding questions.";
        break;
      case "feynman":
        actionInstruction = "ACTION: Rewrite the User Input into a prompt that asks an AI to explain the concept using the Feynman Technique.";
        break;
      case "devils_advocate":
        actionInstruction = "ACTION: Rewrite the User Input into a prompt that asks an AI to critique the user's argument.";
        break;
      case "compression":
        actionInstruction = "ACTION: Compress the User Input into the minimal number of tokens while retaining meaning.";
        constraints = "Remove articles and conjunctions. Result should be telegraphic.";
        break;
      case "few_shot":
        actionInstruction = "ACTION: Generate a 'Few-Shot' prompt template based on the User Input.";
        constraints = "Create 3 example input/output pairs related to the topic.";
        break;
      case "persona":
        actionInstruction = "ACTION: Rewrite the User Input into a prompt that instructs the AI to adopt a specific expert persona.";
        break;
      case "critic":
        actionInstruction = "ACTION: Rewrite the User Input into a prompt that asks an AI to critique the input's style and substance.";
        break;

      // DOMAIN SPECIFIC
      case "code_expert":
        actionInstruction = "ACTION: Treat the User Input as a coding requirement. Write (or rewrite) the code using industry best practices.";
        break;
      case "code_commenter":
        actionInstruction = "ACTION: Add comprehensive documentation comments to the code in the User Input.";
        break;
      case "bug_hunter":
        actionInstruction = "ACTION: Analyze the code in the User Input for bugs. Return the fixed code.";
        break;
      case "unit_test":
        actionInstruction = "ACTION: Generate comprehensive unit tests for the code in the User Input.";
        break;
      case "sec_auditor":
        actionInstruction = "ACTION: Audit the User Input for security vulnerabilities and suggest fixes.";
        break;
      case "copywriter":
        actionInstruction = "ACTION: Rewrite the User Input as high-conversion marketing copy.";
        break;
      case "seo_optimizer":
        actionInstruction = "ACTION: Optimize the User Input for Search Engines (SEO).";
        break;
      case "exec_summary":
        actionInstruction = "ACTION: Summarize the User Input into a C-Suite Executive Brief.";
        constraints = "BLUF (Bottom Line Up Front). Focus on ROI and strategic impact.";
        break;
      case "storyteller":
        actionInstruction = "ACTION: Rewrite the User Input as a compelling narrative story.";
        break;
      case "world_builder":
        actionInstruction = "ACTION: Expand the User Input into a rich description of a fictional world/setting.";
        break;
      case "screenplay":
        actionInstruction = "ACTION: Format the User Input as a standard Hollywood Screenplay.";
        break;
    }
  }

  let formatInstruction = "";
  switch (structure) {
    case "para": formatInstruction = "FORMAT: Standard prose paragraphs."; break;
    case "bullets": formatInstruction = "FORMAT: Bulleted list (use '*')."; break;
    case "steps": formatInstruction = "FORMAT: Numbered list (1., 2., 3.)."; break;
    case "checklist": formatInstruction = "FORMAT: Markdown checklist ('- [ ]')."; break;
    case "json": formatInstruction = "FORMAT: Valid JSON only. No markdown blocks."; break;
    case "csv": formatInstruction = "FORMAT: Valid CSV with header row."; break;
    case "markdown_table": formatInstruction = "FORMAT: Markdown table."; break;
    case "yaml": formatInstruction = "FORMAT: Valid YAML only."; break;
    case "xml": formatInstruction = "FORMAT: Valid XML only."; break;
    case "mermaid": formatInstruction = "FORMAT: Mermaid.js diagram syntax."; break;
    case "latex": formatInstruction = "FORMAT: LaTeX syntax for math/structure."; break;
    case "code_only": formatInstruction = "FORMAT: Code block only. No conversational text."; break;
    case "tldr": formatInstruction = "FORMAT: Single sentence TL;DR."; break;
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

    // 1. Retrieve the Model Preference
    const { openai_model } = await new Promise<{ openai_model?: string }>((resolve) => {
      chrome.storage.local.get("openai_model", (res) => resolve(res));
    });

    // Default to gpt-4o-mini if not set
    const selectedModel = openai_model || "gpt-4o-mini";

    // 2. Track usage
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
          model: selectedModel, // Use the selected model
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
                // Ignore parse errors on partial chunks
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