import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AuthForm from "@/components/AuthForm";
import Dashboard from "@/components/Dashboard";
import Settings from "@/components/Settings";
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import "@/globals.css";

type View = "dashboard" | "settings";

const PopupAppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [view, setView] = useState<View>("dashboard");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-[300px] h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderContent = () => {
    if (!user) {
      return <AuthForm />;
    }
    switch (view) {
      case "settings":
        return <Settings onBack={() => setView("dashboard")} />;
      case "dashboard":
      default:
        return <Dashboard onShowSettings={() => setView("settings")} />;
    }
  };

  return (
    <div className="p-6 flex flex-col items-center justify-center w-[300px] h-[400px] bg-background">
      {renderContent()}
    </div>
  );
};

const PopupApp: React.FC = () => (
  <AuthProvider>
    <PopupAppContent />
    <Toaster richColors position="bottom-center" />
  </AuthProvider>
);

// Render the application into the popup.html root
createRoot(document.getElementById("root")!).render(<PopupApp />);