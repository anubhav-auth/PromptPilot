import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import Dashboard from "@/components/Dashboard";
import Settings from "@/components/Settings";
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import "@/globals.css";

type View = "dashboard" | "settings";

const PopupApp: React.FC = () => {
  const [view, setView] = useState<View>("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    chrome.storage.local.get("openai_api_key", (result) => {
      if (result.openai_api_key) {
        setHasKey(true);
      }
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-[300px] h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col items-center justify-center w-[300px] h-[400px] bg-background">
      {view === "settings" || !hasKey ? (
        <Settings onBack={() => setView("dashboard")} />
      ) : (
        <Dashboard onShowSettings={() => setView("settings")} />
      )}
      <Toaster richColors position="bottom-center" />
    </div>
  );
};

// Render the application
createRoot(document.getElementById("root")!).render(<PopupApp />);