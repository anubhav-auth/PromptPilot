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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Copy as CopyIcon, X, Lock } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ImproveModalProps {
  onClose: () => void;
}

type Intent =
  | "fix-grammar"
  | "expand"
  | "summarize"
  | "change-tone"
  | "code-expert"
  | "socratic-tutor";
const PRO_INTENTS: Intent[] = ["code-expert", "socratic-tutor"];

type Structure = "paragraph" | "bullet-points" | "list";
type Tone = "professional" | "casual" | "formal";

interface UserPlan {
  tier: "free" | "pro";
  canUsePro: boolean;
}

interface DailyUsage {
  count: number;
  lastReset: number;
}

const DAILY_LIMIT = 10;

const ImproveModal: React.FC<ImproveModalProps> = ({ onClose }) => {
  const [originalText, setOriginalText] = useState("");
  const [domain, setDomain] = useState("");
  const [intent, setIntent] = useState<Intent>("fix-grammar");
  const [structure, setStructure] = useState<Structure>("paragraph");
  const [tone, setTone] = useState<Tone>("professional");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);

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
        tone: intent === "change-tone" ? tone : null,
      },
    });

    setIsLoading(true);
    setError(null);
    setResultText(null);

    let systemPrompt = `You are an AI assistant. Your task is to refine the following text.`;
    if (intent === "fix-grammar")
      systemPrompt += ` Focus on fixing grammar and spelling mistakes.`;
    if (intent === "expand") systemPrompt += ` Expand on the ideas presented.`;
    if (intent === "summarize") systemPrompt += ` Summarize the text concisely.`;
    if (intent === "change-tone")
      systemPrompt += ` Change the tone to be more ${tone}.`;
    if (intent === "code-expert")
      systemPrompt += ` Act as a code expert. Review and improve the following code snippet, providing explanations for your changes.`;
    if (intent === "socratic-tutor")
      systemPrompt += ` Act as a Socratic tutor. Instead of giving the answer, ask insightful questions to help the user improve their writing themselves.`;
    if (structure === "bullet-points")
      systemPrompt += ` Format the output as bullet points.`;
    if (structure === "list")
      systemPrompt += ` Format the output as a numbered list.`;
    if (structure === "paragraph")
      systemPrompt += ` Format the output as a single paragraph.`;

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

  const isProIntentSelected = PRO_INTENTS.includes(intent);
  const improveButtonDisabled =
    !!error || isLoading || (isProIntentSelected && !userPlan?.canUsePro);

  return (
    <Card className="w-full h-full relative border-none bg-background rounded-lg flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Improve Text</CardTitle>
        <CardDescription>Refine your writing with AI.</CardDescription>
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
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={intent}
                    onValueChange={(v) => setIntent(v as Intent)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Intent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fix-grammar">Fix Grammar</SelectItem>
                      <SelectItem value="expand">Expand</SelectItem>
                      <SelectItem value="summarize">Summarize</SelectItem>
                      <SelectItem value="change-tone">Change Tone</SelectItem>
                      <SelectItem
                        value="code-expert"
                        disabled={!userPlan?.canUsePro}
                      >
                        <div className="flex items-center">
                          {!userPlan?.canUsePro && (
                            <Lock className="h-3 w-3 mr-2" />
                          )}
                          Code Expert
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="socratic-tutor"
                        disabled={!userPlan?.canUsePro}
                      >
                        <div className="flex items-center">
                          {!userPlan?.canUsePro && (
                            <Lock className="h-3 w-3 mr-2" />
                          )}
                          Socratic Tutor
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={structure}
                    onValueChange={(v) => setStructure(v as Structure)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Structure" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paragraph">Paragraph</SelectItem>
                      <SelectItem value="bullet-points">Bullet Points</SelectItem>
                      <SelectItem value="list">Numbered List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {intent === "change-tone" && (
                  <Select
                    value={tone}
                    onValueChange={(v) => setTone(v as Tone)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                )}
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
                  {isProIntentSelected && !userPlan?.canUsePro && (
                    <TooltipContent>
                      <p>Upgrade to Pro to use advanced intents.</p>
                    </TooltipContent>
                  )}
                </Tooltip>
                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
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