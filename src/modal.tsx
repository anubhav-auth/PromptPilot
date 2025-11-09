import React from "react";
import { createRoot } from "react-dom/client";
import ImproveModal from "@/components/ImproveModal";
import "@/globals.css";

const ModalApp: React.FC = () => {
  const handleClose = () => {
    // Send a message to the parent window (the content script) to close the iframe
    window.parent.postMessage({ type: "prompt-pilot-close-modal" }, "*");
  };

  return <ImproveModal onClose={handleClose} />;
};

createRoot(document.getElementById("root")!).render(<ModalApp />);