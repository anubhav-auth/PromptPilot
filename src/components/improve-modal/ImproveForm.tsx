import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Lock } from "lucide-react";
import {
  Intent,
  Structure,
  TEXT_INTENTS,
  TEXT_STRUCTURES,
  PROMPT_INTENTS,
  PROMPT_STRUCTURES,
  PRO_FEATURES,
  UserPlan,
} from "./constants";

interface ImproveFormProps {
  onImprove: (intent: Intent, structure: Structure) => void;
  userPlan: UserPlan | null;
  isImproving: boolean;
  apiError: string | null;
}

const ImproveForm: React.FC<ImproveFormProps> = ({
  onImprove,
  userPlan,
  isImproving,
  apiError,
}) => {
  const [intent, setIntent] = useState<Intent>("general_polish");
  const [structure, setStructure] = useState<Structure>("para");
  const [activeTab, setActiveTab] = useState("text");

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

  const isFeaturePro = (feature: Intent | Structure) =>
    PRO_FEATURES.includes(feature);

  const improveButtonDisabled =
    !!apiError ||
    isImproving ||
    (isFeaturePro(intent) && !userPlan?.canUsePro) ||
    (isFeaturePro(structure) && !userPlan?.canUsePro);

  return (
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
              <SelectContent className="max-h-64" position="popper">
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
              <SelectContent className="max-h-64" position="popper">
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
              <SelectContent className="max-h-64" position="popper">
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
              <SelectContent className="max-h-64" position="popper">
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
                onClick={() => onImprove(intent, structure)}
                className="w-full"
                disabled={improveButtonDisabled}
              >
                Improve
              </Button>
            </div>
          </TooltipTrigger>
          {(isFeaturePro(intent) || isFeaturePro(structure)) &&
            !userPlan?.canUsePro && (
              <TooltipContent>
                <p>Upgrade to Pro to use this feature.</p>
              </TooltipContent>
            )}
        </Tooltip>
        {apiError && (
          <p className="text-sm text-destructive text-center">{apiError}</p>
        )}
      </div>
    </TooltipProvider>
  );
};

export default ImproveForm;