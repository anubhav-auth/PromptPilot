// Text Modes
export const TEXT_INTENTS = [
  { value: "general-improve", label: "General Improve" },
  { value: "fix-grammar-tone", label: "Fix Grammar & Tone" },
  { value: "summarize-request", label: "Summarize Request" },
  { value: "expand-context", label: "Expand Context" },
  { value: "simplify-language", label: "Simplify Language" },
  { value: "make-more-formal", label: "Make More Formal" },
] as const;

export const TEXT_STRUCTURES = [
  { value: "paragraph", label: "Paragraph" },
  { value: "bullet-points", label: "Bullet Points" },
  { value: "step-by-step", label: "Step-by-Step" },
  { value: "numbered-list", label: "Numbered List" },
] as const;

// Prompt Modes
export const PROMPT_INTENTS = [
  { value: "chain-of-thought", label: "Chain of Thought" },
  { value: "persona-adoption", label: "Persona Adoption" },
  { value: "socratic-tutor", label: "Socratic Tutor" },
  { value: "code-expert", label: "Code Expert" },
  { value: "creative-writer", label: "Creative Writer" },
  { value: "analogy-generator", label: "Analogy Generator" },
  { value: "brainstorm-ideas", label: "Brainstorm Ideas" },
] as const;

export const PROMPT_STRUCTURES = [
  { value: "json-format", label: "JSON Format" },
  { value: "markdown-table", label: "Markdown Table" },
  { value: "code-block-only", label: "Code Block Only" },
  { value: "mermaid-diagram", label: "Mermaid Diagram" },
  { value: "csv-format", label: "CSV Format" },
  { value: "yaml-format", label: "YAML Format" },
] as const;

export type TextIntent = (typeof TEXT_INTENTS)[number]["value"];
export type TextStructure = (typeof TEXT_STRUCTURES)[number]["value"];
export type PromptIntent = (typeof PROMPT_INTENTS)[number]["value"];
export type PromptStructure = (typeof PROMPT_STRUCTURES)[number]["value"];

export type Intent = TextIntent | PromptIntent;
export type Structure = TextStructure | PromptStructure;

export const PRO_FEATURES: (Intent | Structure)[] = [
  ...PROMPT_INTENTS.map((i) => i.value),
  ...PROMPT_STRUCTURES.map((s) => s.value),
];

export interface UserPlan {
  tier: "free" | "pro";
  canUsePro: boolean;
}

export interface DailyUsage {
  count: number;
  lastReset: number;
}

export const DAILY_LIMIT = 10;