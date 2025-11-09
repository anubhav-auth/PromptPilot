import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface ImproveModalProps {
  onClose: () => void;
}

const ImproveModal: React.FC<ImproveModalProps> = ({ onClose }) => {
  return (
    <Card className="w-full h-full relative border-none bg-background rounded-lg">
      <CardHeader>
        <CardTitle>PromptPilot</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <p>This is the modal overlay. Ready for your improvements!</p>
      </CardContent>
    </Card>
  );
};

export default ImproveModal;