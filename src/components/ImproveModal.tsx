import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Copy as CopyIcon, X } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

interface ImproveModalProps {
  onClose: () => void;
}

type Intent = "fix-grammar" | "expand" | "summarize" | "change-tone";
type Structure = "paragraph" | "bullet-points" | "list";
type Tone = "professional" | "casual" | "formal";

const ImproveModal: React.FC<ImproveModalProps> = ({ onClose }) => {
  const [originalText, setOriginalText] = useState("");
  const [intent, setIntent] = useState<Intent>("fix-grammar");
  const [structure, setStructure] = useState<Structure>("paragraph");
  const [tone, setTone] = useState<Tone>("professional");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);

  useEffect(() => {
    // Get original text from URL
    const urlParams = new URLSearchParams(window.location.search);
    const text = urlParams.get("text");
    if (text) {
      setOriginalText(decodeURIComponent(text));
    }

    // Get API key from storage
    chrome.storage.local.get("openai_api_key", (result) => {
      if (result.openai_api_key) {
        setApiKey(result.openai_api_key);
      } else {
        setError("OpenAI API key not found. Please add it in the extension settings.");
      }
    });
  }, []);

  const handleImprove = async () => {
    if (!apiKey) {
      setError("OpenAI API key not found. Please add it in the extension settings.");
      return;
    }
    if (!originalText) {
      setError("No text to improve.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultText(null);

    let systemPrompt = `You are an AI assistant. Your task is to refine the following text.`;
    if (intent === 'fix-grammar') systemPrompt += ` Focus on fixing grammar and spelling mistakes.`;
    if (intent === 'expand') systemPrompt += ` Expand on the ideas presented.`;
    if (intent === 'summarize') systemPrompt += ` Summarize the text concisely.`;
    if (intent === 'change-tone') systemPrompt += ` Change the tone to be more ${tone}.`;
    if (structure === 'bullet-points') systemPrompt += ` Format the output as bullet points.`;
    if (structure === 'list') systemPrompt += ` Format the output as a numbered list.`;
    if (structure === 'paragraph') systemPrompt += ` Format the output as a single paragraph.`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: originalText },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to fetch from OpenAI.");
      }

      const data = await response.json();
      const result = data.choices[0]?.message?.content;
      if (result) {
        setResultText(result);
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
      window.parent.postMessage({ type: "prompt-pilot-replace-text", text: resultText }, "*");
    }
  };

  const handleCopy = () => {
    if (resultText) {
      navigator.clipboard.writeText(resultText);
      showSuccess("Copied to clipboard!");
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Improving...</p>
        </div>
      );
    }

    if (resultText) {
      return (
        <div className="space-y-4 h-full flex flex-col">
          <Textarea value={resultText} readOnly className="flex-grow resize-none" />
          <div className="flex gap-2">
            <Button onClick={handleReplace} className="flex-grow">Replace</Button>
            <Button onClick={handleCopy} variant="outline" className="flex-grow">
              <CopyIcon className="mr-2 h-4 w-4" /> Copy
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select value={intent} onValueChange={(v) => setIntent(v as Intent)}>
            <SelectTrigger><SelectValue placeholder="Intent" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fix-grammar">Fix Grammar</SelectItem>
              <SelectItem value="expand">Expand</SelectItem>
              <SelectItem value="summarize">Summarize</SelectItem>
              <SelectItem value="change-tone">Change Tone</SelectItem>
            </SelectContent>
          </Select>
          <Select value={structure} onValueChange={(v) => setStructure(v as Structure)}>
            <SelectTrigger><SelectValue placeholder="Structure" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="paragraph">Paragraph</SelectItem>
              <SelectItem value="bullet-points">Bullet Points</SelectItem>
              <SelectItem value="list">Numbered List</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {intent === 'change-tone' && (
          <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
            <SelectTrigger><SelectValue placeholder="Tone" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="formal">Formal</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Button onClick={handleImprove} className="w-full" disabled={!!error}>Improve</Button>
        {error && <p className="text-sm text-destructive text-center">{error}</p>}
      </div>
    );
  };

  return (
    <Card className="w-full h-full relative border-none bg-background rounded-lg flex flex-col">
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
      <CardContent className="flex-grow">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default ImproveModal;