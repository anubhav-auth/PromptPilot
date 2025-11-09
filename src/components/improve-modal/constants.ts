/**
 * Intent & Structure constants for Improve Modal
 * - TEXT REFINEMENT (FREE)
 * - PROMPT ENGINEERING (PRO)
 * - DOMAIN SPECIFIC (PRO)
 * 
 * Output Structures:
 * - FREE: para, bullets, steps, checklist
 * - PRO: json, csv, markdown_table, yaml, xml, mermaid, latex, code_only, tldr
 */

// TEXT REFINEMENT (FREE)
export const TEXT_REFINEMENT_INTENTS = [
  { value: "general_polish", label: "General Polish" },
  { value: "fix_grammar", label: "Fix Grammar & Spelling" },
  { value: "professional_tone", label: "Professional Tone" },
  { value: "casual_tone", label: "Casual Tone" },
  { value: "academic_tone", label: "Academic Tone" },
  { value: "urgent_tone", label: "Direct/Urgent Tone" },
  { value: "empathetic_tone", label: "Empathetic Tone" },
  { value: "simplify", label: "Simplify (ELI5)" },
  { value: "summarize", label: "Summarize/Condense" },
  { value: "expand", label: "Expand/Add Context" },
  { value: "dejargonize", label: "De-jargonize" },
] as const;

// PROMPT ENGINEERING (PRO)
export const PROMPT_ENGINEERING_INTENTS = [
  { value: "cot", label: "Chain of Thought" },
  { value: "tree_of_thoughts", label: "Tree of Thoughts" },
  { value: "socratic", label: "Socratic Method" },
  { value: "feynman", label: "Feynman Technique" },
  { value: "devils_advocate", label: "Devil’s Advocate" },
  { value: "compression", label: "Prompt Compression" },
  { value: "few_shot", label: "Few-Shot Prompting" },
  { value: "persona", label: "Adopt Persona" },
  { value: "critic", label: "Critic Mode" },
] as const;

// DOMAIN SPECIFIC (PRO)
export const DOMAIN_SPECIFIC_INTENTS = [
  { value: "code_expert", label: "Code Expert (Clean)" },
  { value: "code_commenter", label: "Code Commenter" },
  { value: "bug_hunter", label: "Bug Hunter" },
  { value: "unit_test", label: "Unit Test Generator" },
  { value: "sec_auditor", label: "Security Auditor" },
  { value: "copywriter", label: "Copywriter (Sales)" },
  { value: "seo_optimizer", label: "SEO Optimizer" },
  { value: "exec_summary", label: "Executive Brief" },
  { value: "storyteller", label: "Creative Storyteller" },
  { value: "world_builder", label: "World Builder" },
  { value: "screenplay", label: "Screenplay Format" },
] as const;

// For compatibility with existing components:
// - TEXT_INTENTS -> Free Refinement
// - PROMPT_INTENTS -> All Pro (Prompt Engineering + Domain Specific)
export const TEXT_INTENTS = TEXT_REFINEMENT_INTENTS;
export const PROMPT_INTENTS = [
  ...PROMPT_ENGINEERING_INTENTS,
  ...DOMAIN_SPECIFIC_INTENTS,
] as const;

// OUTPUT STRUCTURES
export const TEXT_STRUCTURES = [
  { value: "para", label: "Paragraph" },
  { value: "bullets", label: "Bullet Points" },
  { value: "steps", label: "Numbered Steps" },
  { value: "checklist", label: "Checklist" },
] as const;

export const PROMPT_STRUCTURES = [
  { value: "json", label: "JSON (Strict)" },
  { value: "csv", label: "CSV" },
  { value: "markdown_table", label: "Markdown Table" },
  { value: "yaml", label: "YAML" },
  { value: "xml", label: "XML" },
  { value: "mermaid", label: "Mermaid Diagram" },
  { value: "latex", label: "LaTeX Math" },
  { value: "code_only", label: "Code Block Only" },
  { value: "tldr", label: "TL;DR Only" },
] as const;

export type TextIntent = (typeof TEXT_INTENTS)[number]["value"];
export type PromptIntent = (typeof PROMPT_INTENTS)[number]["value"];
export type Intent = TextIntent | PromptIntent;

export type TextStructure = (typeof TEXT_STRUCTURES)[number]["value"];
export type PromptStructure = (typeof PROMPT_STRUCTURES)[number]["value"];
export type Structure = TextStructure | PromptStructure;

// Identify Pro-only features
export const PRO_FEATURES: (Intent | Structure)[] = [
  ...PROMPT_INTENTS.map((i) => i.value),
  ...PROMPT_STRUCTURES.map((s) => s.value),
];

// Plans / Usage
export interface UserPlan {
  tier: "free" | "pro";
  canUsePro: boolean;
}

export interface DailyUsage {
  count: number;
  lastReset: number;
}

export const DAILY_LIMIT = 10;