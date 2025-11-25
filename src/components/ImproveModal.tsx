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
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Copy as CopyIcon, X } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import {
  TEXT_INTENTS,
  TEXT_STRUCTURES,
  PROMPT_INTENTS,
  PROMPT_STRUCTURES,
  Structure,
} from "@/components/improve-modal/constants";
import { useImproveAI } from "@/hooks/use-improve-ai";

interface ImproveModalProps {
  onClose: () => void;
}

interface CustomIntent {
  id: string;
  label: string;
  instruction: string;
}

const ImproveModal: React.FC<ImproveModalProps> = ({ onClose }) => {
  const [originalText, setOriginalText] = useState("");
  const [domain, setDomain] = useState("");
  const [intent, setIntent] = useState<string>("general_polish");
  const [structure, setStructure] = useState<Structure>("para");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("text");
  
  const [customIntents, setCustomIntents] = useState<CustomIntent[]>([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const text = urlParams.get("text");
    const domainParam = urlParams.get("domain");
    if (text) setOriginalText(decodeURIComponent(text));
    if (domainParam) setDomain(decodeURIComponent(domainParam));

    chrome.storage.local.get(["openai_api_key", "custom_intents"], (result) => {
      if (result.openai_api_key) {
        setApiKey(result.openai_api_key);
      } else {
        showError("API key not found. Please set it in the extension popup.");
      }
      if (result.custom_intents) {
        setCustomIntents(result.custom_intents);
      }
    });
  }, []);

  const { isLoading, error, resultText, improveText } = useImproveAI({
    apiKey,
    domain,
  });

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

  const handleImprove = () => {
    // Check if the selected intent is a custom one
    const customMatch = customIntents.find(i => i.id === intent);
    const customInstruction = customMatch ? customMatch.instruction : undefined;
    
    improveText(originalText, intent, structure, customInstruction);
  };

  const handleReplace = () => {
    if (resultText) {
      chrome.runtime.sendMessage({
        type: "logEvent",
        data: { event_type: "result_action", domain, action_taken: "replace" },
      });
      window.parent.postMessage(
        { type: "prompt-pilot-replace-text", text: resultText },
        "*"
      );
    }
  };

  const handleCopy = () => {
    if (resultText) {
      chrome.runtime.sendMessage({
        type: "logEvent",
        data: { event_type: "result_action", domain, action_taken: "copy" },
      });
      navigator.clipboard.writeText(resultText);
      showSuccess("Copied to clipboard!");
    }
  };

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
            <div className="space-y-4">
              <Tabs
                defaultValue="text"
                onValueChange={handleTabChange}
                value={activeTab}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text">Refinement</TabsTrigger>
                  <TabsTrigger value="prompt">Prompt Engineering</TabsTrigger>
                </TabsList>
                
                {/* Content for BOTH tabs (since logic is similar, just different default options) */}
                <TabsContent value="text" className="space-y-4 pt-2">
                  <Select value={intent} onValueChange={setIntent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Intent" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64" position="popper" side="bottom">
                      <SelectGroup>
                        <SelectLabel>Standard</SelectLabel>
                        {TEXT_INTENTS.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      {customIntents.length > 0 && (
                        <>
                          <SelectSeparator />
                          <SelectGroup>
                            <SelectLabel>Custom</SelectLabel>
                            {customIntents.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  
                  <Select value={structure} onValueChange={(v) => setStructure(v as Structure)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Structure" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64" position="popper" side="bottom">
                      {TEXT_STRUCTURES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TabsContent>

                <TabsContent value="prompt" className="space-y-4 pt-2">
                  <Select value={intent} onValueChange={setIntent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Intent" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64" position="popper" side="bottom">
                      <SelectGroup>
                        <SelectLabel>Standard</SelectLabel>
                        {PROMPT_INTENTS.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      {customIntents.length > 0 && (
                        <>
                          <SelectSeparator />
                          <SelectGroup>
                            <SelectLabel>Custom</SelectLabel>
                            {customIntents.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </>
                      )}
                    </SelectContent>
                  </Select>

                  <Select value={structure} onValueChange={(v) => setStructure(v as Structure)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Structure" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64" position="popper" side="bottom">
                      {PROMPT_STRUCTURES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TabsContent>
              </Tabs>

              <Button
                onClick={handleImprove}
                className="w-full"
                disabled={!originalText}
              >
                Improve
              </Button>
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImproveModal;