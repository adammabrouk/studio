
"use client";

import type React from 'react';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter // Added for potential future use
} from "@/components/ui/dialog";
import AIAssistant from "@/components/ai-assistant";
import { Bot, X } from "lucide-react"; // Added X for close button styling if needed

interface AIPopupButtonProps {
  menu: string;
}

const AIPopupButton: React.FC<AIPopupButtonProps> = ({ menu }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-20 w-16 h-16 rounded-full shadow-xl hover:scale-110 transition-transform duration-200 ease-in-out bg-primary hover:bg-primary/90"
        size="icon"
        aria-label="Open AI Assistant"
      >
        <Bot className="w-8 h-8 text-primary-foreground" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl max-h-[90vh] h-[70vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Bot className="text-primary w-7 h-7"/> AI Order Assistant
            </DialogTitle>
            <DialogDescription>
              Chat with our AI to place your order or ask about the menu.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto px-6 pb-6">
            <AIAssistant menu={menu} />
          </div>
          {/* DialogClose is automatically added by DialogContent, but a footer could be for explicit close */}
          {/* <DialogFooter className="p-6 pt-2 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
          </DialogFooter> */}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIPopupButton;
