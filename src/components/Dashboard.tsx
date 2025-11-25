import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, CheckCircle2 } from "lucide-react";

interface DashboardProps {
  onShowSettings: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onShowSettings }) => {
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    chrome.storage.local.get("daily_usage", (res) => {
      setUsageCount(res.daily_usage?.count || 0);
    });
  }, []);

  return (
    <Card className="w-full max-w-sm shadow-none border-none">
      <CardHeader className="text-center relative">
        <CardTitle className="text-2xl font-bold text-primary">
          PromptPilot
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-0 right-0" 
          onClick={onShowSettings}
          title="Manage API Key"
        >
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6 text-center">
        <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg border-2 border-dashed">
          <CheckCircle2 className="w-12 h-12 text-green-500 mb-2" />
          <p className="text-lg font-semibold text-foreground">System Active</p>
          <p className="text-sm text-muted-foreground">
            You are ready to improve text on any website.
          </p>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Session Usage</p>
          <p className="text-3xl font-bold">{usageCount}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Dashboard;