import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Copy as CopyIcon, X, Lock } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TEXT_INTENTS,
  TEXT_STRUCTURES,
  PROMPT_INTENTS,
  PROMPT_STRUCTURES,
  PRO_FEATURES,
  Intent,
  Structure,
  UserPlan,
} from "@/components/improve-modal/constants";

interface ImproveModalProps {
  onClose: () => void;
}

interface DailyUsage {
  count: number;
  lastReset: number;
}

const DAILY_LIMIT = 10;

const ImproveModal: React.FC<ImproveModalProps> = ({ onClose }) => {
  const [originalText, setOriginalText] = useState("");
  const [domain, setDomain] = useState("");
  const [intent, setIntent] = useState<Intent>("general_polish");
  const [structure, setStructure] = useState<Structure>("para");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("text");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const text = urlParams.get("text");
    const domainParam = urlParams.get("domain");
    if (text) {
      setOriginalText(decodeURIComponent(text));
    }
    if (domainParam) {
      setDomain(decodeURIComponent(domainParam));
    }

    chrome.storage.local.get(["openai_api_key", "user_profile"], (result) => {
      if (result.openai_api_key) {
        setApiKey(result.openai_api_key);
      } else {
        setError(
          "OpenAI API key not found. Please add it in the extension settings.",
        );
      }

      const profile = result.user_profile;
      if (profile) {
        const trialEnds = profile.trial_ends_at
          ? new Date(profile.trial_ends_at)
          : new Date(0);
        const isTrialActive = trialEnds > new Date();
        const canUsePro = profile.tier === "pro" || isTrialActive;
        setUserPlan({ tier: profile.tier, canUsePro });
      } else {
        setUserPlan({ tier: "free", canUsePro: false });
      }
    });
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "text") {
      setIntent("general_polish");
      setStructure("para");
    } else {
      setIntent("cot");
      setStructure("json");
    }
  };

  const handleImprove = async () => {
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

  const handleReplace = () => {
    if (resultText) {
      chrome.runtime.sendMessage({
        type: "logEvent",
        data: {
          event_type: "result_action",
          domain,
          action_taken: "replace",
        },
      });
      window.parent.postMessage(
        { type: "prompt-pilot-replace-text", text: resultText },
        "*",
      );
    }
  };

  const handleCopy = () => {
    if (resultText) {
      chrome.runtime.sendMessage({
        type: "logEvent",
        data: {
          event_type: "result_action",
          domain,
          action_taken: "copy",
        },
      });
      navigator.clipboard.writeText(resultText);
      showSuccess("Copied to clipboard!");
    }
  };

  const isFeaturePro = (feature: Intent | Structure) =>
    PRO_FEATURES.includes(feature);

  const improveButtonDisabled =
    !!error ||
    isLoading ||
    (isFeaturePro(intent) && !userPlan?.canUsePro) ||
    (isFeaturePro(structure) && !userPlan?.canUsePro);

  return (
    <Card className="w-full h-full relative border-none bg-background rounded-lg flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Improve with AI</CardTitle>
        <CardDescription>Refine your writing or prompts.</CardDescription>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-grow relative overflow-y-auto">
        <div
          className={`absolute inset-0 bg-background flex flex-col items-center justify-center transition-opacity duration-300 ${
            isLoading ? "opacity-100 z-10" : "opacity-0 -z-10"
          }`}
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Improving...</p>
        </div>

        <div
          className={`h-full transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
        >
          {resultText ? (
            <div className="space-y-4 h-full flex flex-col">
              <Textarea
                value={resultText}
                readOnly
                className="flex-grow resize-none"
              />
              <div className="flex gap-2">
                <Button onClick={handleReplace} className="flex-grow">
                  Replace
                </Button>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="flex-grow"
                >
                  <CopyIcon className="mr-2 h-4 w-4" /> Copy
                </Button>
              </div>
            </div>
          ) : (
            <TooltipProvider>
              <div className="space-y-4">
                <Tabs
                  defaultValue="text"
                  onValueChange={handleTabChange}
                  value={activeTab}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="text">Refinement</TabsTrigger>
                    <TabsTrigger value="prompt">Advanced (Pro)</TabsTrigger>
                  </TabsList>
                  <TabsContent value="text" className="space-y-4 pt-2">
                    <Select
                      value={intent}
                      onValueChange={(v) => setIntent(v as Intent)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Intent" />
                      </SelectTrigger>
                      <SelectContent
                        className="max-h-64"
                        position="popper"
                        side="bottom"
                      >
                        {TEXT_INTENTS.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={structure}
                      onValueChange={(v) => setStructure(v as Structure)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Structure" />
                      </SelectTrigger>
                      <SelectContent
                        className="max-h-64"
                        position="popper"
                        side="bottom"
                      >
                        {TEXT_STRUCTURES.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TabsContent>
                  <TabsContent value="prompt" className="space-y-4 pt-2">
                    <Select
                      value={intent}
                      onValueChange={(v) => setIntent(v as Intent)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Intent" />
                      </SelectTrigger>
                      <SelectContent
                        className="max-h-64"
                        position="popper"
                        side="bottom"
                      >
                        {PROMPT_INTENTS.map((item) => (
                          <SelectItem
                            key={item.value}
                            value={item.value}
                            disabled={!userPlan?.canUsePro}
                          >
                            <div className="flex items-center">
                              {!userPlan?.canUsePro && (
                                <Lock className="h-3 w-3 mr-2" />
                              )}
                              {item.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={structure}
                      onValueChange={(v) => setStructure(v as Structure)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Structure" />
                      </SelectTrigger>
                      <SelectContent
                        className="max-h-64"
                        position="popper"
                        side="bottom"
                      >
                        {PROMPT_STRUCTURES.map((item) => (
                          <SelectItem
                            key={item.value}
                            value={item.value}
                            disabled={!userPlan?.canUsePro}
                          >
                            <div className="flex items-center">
                              {!userPlan?.canUsePro && (
                                <Lock className="h-3 w-3 mr-2" />
                              )}
                              {item.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TabsContent>
                </Tabs>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <Button
                        onClick={handleImprove}
                        className="w-full"
                        disabled={improveButtonDisabled}
                      >
                        Improve
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {(PRO_FEATURES.includes(intent) ||
                    PRO_FEATURES.includes(structure)) &&
                    !userPlan?.canUsePro && (
                      <TooltipContent>
                        <p>Upgrade to Pro to use this feature.</p>
                      </TooltipContent>
                    )}
                </Tooltip>
                {error && (
                  <p className="text-sm text-destructive text-center">
                    {error}
                  </p>
                )}
              </div>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImproveModal;