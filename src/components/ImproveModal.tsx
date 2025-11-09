import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface ImproveModalProps {
  onClose: () => void;
}

const ImproveModal: React.FC<ImproveModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <Card className="w-full max-w-md relative">
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
    </div>
  );
};

export default ImproveModal;