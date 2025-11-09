import React from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AuthForm from "@/components/AuthForm";
import Dashboard from "@/components/Dashboard";
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import "@/globals.css";

const PopupAppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-[300px] h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col items-center justify-center w-[300px] h-[400px] bg-background">
      {user ? <Dashboard /> : <AuthForm />}
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