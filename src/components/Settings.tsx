import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SettingsProps {
  onBack: () => void;
}

interface CustomIntent {
  id: string;
  label: string;
  instruction: string;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4o-mini"); // Default model
  const [isValidating, setIsValidating] = useState(false);
  const [status, setStatus] = useState<"idle" | "valid" | "invalid">("idle");
  
  // Custom Intent State
  const [customIntents, setCustomIntents] = useState<CustomIntent[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newInstruction, setNewInstruction] = useState("");

  useEffect(() => {
    chrome.storage.local.get(["openai_api_key", "custom_intents", "openai_model"], (result) => {
      if (result.openai_api_key) {
        setApiKey(result.openai_api_key);
        setStatus("valid");
      }
      if (result.custom_intents) {
        setCustomIntents(result.custom_intents);
      }
      if (result.openai_model) {
        setModel(result.openai_model);
      }
    });
  }, []);

  const handleModelChange = (value: string) => {
    setModel(value);
    chrome.storage.local.set({ openai_model: value }, () => {
      showSuccess(`Model changed to ${value}`);
    });
  };

  const validateAndSave = async () => {
    if (!apiKey.trim()) {
      showError("Please enter an API key");
      return;
    }

    setIsValidating(true);
    setStatus("idle");

    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
      });

      if (response.ok) {
        setStatus("valid");
        chrome.storage.local.set({ openai_api_key: apiKey.trim() }, () => {
          showSuccess("API Key verified and saved!");
          setTimeout(onBack, 1000);
        });
      } else {
        setStatus("invalid");
        const data = await response.json();
        showError(data.error?.message || "Invalid API Key");
      }
    } catch (error) {
      setStatus("invalid");
      showError("Network error. Check connection.");
    } finally {
      setIsValidating(false);
    }
  };

  const addCustomIntent = () => {
    if (!newLabel.trim() || !newInstruction.trim()) {
      showError("Please fill in both name and instruction");
      return;
    }

    const newIntent: CustomIntent = {
      id: `custom_${Date.now()}`,
      label: newLabel.trim(),
      instruction: newInstruction.trim(),
    };

    const updated = [...customIntents, newIntent];
    setCustomIntents(updated);
    setNewLabel("");
    setNewInstruction("");
    
    chrome.storage.local.set({ custom_intents: updated }, () => {
      showSuccess("Custom prompt added!");
    });
  };

  const deleteCustomIntent = (id: string) => {
    const updated = customIntents.filter(i => i.id !== id);
    setCustomIntents(updated);
    chrome.storage.local.set({ custom_intents: updated });
  };

  return (
    <Card className="w-full max-w-sm shadow-none border-none h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center relative">
          <Button variant="ghost" size="icon" className="absolute -left-10" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-2xl font-bold text-primary">Settings</CardTitle>
        </div>
        <CardDescription>Configure keys, models, and prompts.</CardDescription>
      </CardHeader>
      
      <ScrollArea className="flex-grow">
        <CardContent className="space-y-6 pb-6">
          {/* API Key Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">OpenAI API Key</label>
            <div className="relative">
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setStatus("idle");
                }}
                className={`pr-10 ${
                  status === "valid" ? "border-green-500 focus-visible:ring-green-500" : 
                  status === "invalid" ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
              />
              <div className="absolute right-3 top-2.5">
                {status === "valid" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                {status === "invalid" && <AlertCircle className="h-5 w-5 text-red-500" />}
              </div>
            </div>
            <Button 
              onClick={validateAndSave} 
              disabled={isValidating || !apiKey} 
              className="w-full"
              size="sm"
            >
              {isValidating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify & Save"}
            </Button>
          </div>

          <Separator />

          {/* Model Selection Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">AI Model</label>
            <Select value={model} onValueChange={handleModelChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast & Cheap)</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o (Smartest)</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Legacy)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              'GPT-4o Mini' is recommended for speed.
            </p>
          </div>

          <Separator />

          {/* Custom Intents Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Custom Prompts</label>
              <span className="text-xs text-muted-foreground">{customIntents.length} saved</span>
            </div>

            <div className="space-y-2 p-3 bg-muted rounded-md">
              <Input 
                placeholder="Name (e.g. 'Roast It')" 
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="bg-background h-8 text-xs"
              />
              <Input 
                placeholder="Instruction (e.g. 'Be sarcastic')" 
                value={newInstruction}
                onChange={(e) => setNewInstruction(e.target.value)}
                className="bg-background h-8 text-xs"
              />
              <Button onClick={addCustomIntent} className="w-full" size="sm" variant="secondary">
                <Plus className="h-3 w-3 mr-2" /> Add Prompt
              </Button>
            </div>

            <div className="space-y-2">
              {customIntents.map((intent) => (
                <div key={intent.id} className="flex items-center justify-between p-2 border rounded-md text-sm">
                  <div className="overflow-hidden">
                    <p className="font-medium truncate">{intent.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{intent.instruction}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => deleteCustomIntent(intent.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {customIntents.length === 0 && (
                <p className="text-xs text-center text-muted-foreground italic">No custom prompts yet.</p>
              )}
            </div>
          </div>
        </CardContent>
      </ScrollArea>
    </Card>
  );
};

export default Settings;