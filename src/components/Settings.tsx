import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

interface SettingsProps {
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    chrome.storage.local.get("openai_api_key", (result) => {
      if (result.openai_api_key) {
        setApiKey(result.openai_api_key);
      }
    });
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    chrome.storage.local.set({ openai_api_key: apiKey }, () => {
      setIsSaving(false);
      if (chrome.runtime.lastError) {
        showError("Failed to save API key.");
        console.error(chrome.runtime.lastError);
      } else {
        showSuccess("API key saved successfully!");
      }
    });
  };

  return (
    <Card className="w-full max-w-sm shadow-none border-none">
      <CardHeader>
        <div className="flex items-center relative">
          <Button variant="ghost" size="icon" className="absolute -left-10" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-2xl font-bold text-primary">Settings</CardTitle>
        </div>
        <CardDescription>Manage your OpenAI API key.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="api-key" className="text-sm font-medium text-foreground">
            OpenAI API Key
          </label>
          <Input
            id="api-key"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="mt-1"
          />
        </div>
        <Button onClick={handleSave} disabled={isSaving || !apiKey} className="w-full">
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default Settings;