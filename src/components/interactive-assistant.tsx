
"use client";

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2, Bot, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { conversationalOrder, type ConversationalOrderInput, type ConversationalOrderOutput } from "@/ai/flows/conversational-order-flow";

interface InteractiveAssistantProps {
  language: 'en' | 'ru' | 'ro';
  menu: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

type GeminiMessage = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

const InteractiveAssistant: React.FC<InteractiveAssistantProps> = ({ language, menu }) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setChatMessages([]); 
    const greeting = language === 'en' ? "Hello! I'm your AI assistant for OrderFlow. How can I help you with your order?" :
                     language === 'ru' ? "Здравствуйте! Я ваш AI-помощник для OrderFlow. Чем могу помочь с заказом?" :
                     language === 'ro' ? "Bună ziua! Sunt asistentul tău AI pentru OrderFlow. Cum te pot ajuta cu comanda?" :
                     "Hello! How can I assist you?";
    
    // Use a timeout to ensure the greeting appears after the component is fully rendered and state is cleared.
    setTimeout(() => {
        addMessage("ai", greeting);
        inputRef.current?.focus();
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]); 

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const addMessage = (sender: "user" | "ai", text: string) => {
    setChatMessages(prev => [...prev, { id: Date.now().toString() + Math.random().toString(36).substring(2,7), sender, text, timestamp: new Date() }]);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isAiTyping) return;
    const userMessageText = inputText;
    addMessage("user", userMessageText);
    setInputText("");
    setIsAiTyping(true);

    const geminiHistory: GeminiMessage[] = chatMessages
      .filter(msg => msg.text !== "") // Filter out potentially empty initial AI messages if logic changes
      .map(msg => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));
    
    const inputForFlow: ConversationalOrderInput = {
      message: userMessageText,
      menu: menu,
      language: language,
      history: geminiHistory,
    };

    try {
      const result: ConversationalOrderOutput = await conversationalOrder(inputForFlow);
      addMessage("ai", result.response);
    } catch (err) {
      console.error("Error calling conversational AI:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred with the AI.";
      addMessage("ai", `Sorry, I encountered an error. Please try again. (${errorMessage.substring(0, 50)})`);
      toast({ title: "AI Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsAiTyping(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow w-full rounded-md border p-4 bg-muted/10 mb-4" ref={chatContainerRef}>
        <div className="space-y-4">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex items-end gap-2",
                msg.sender === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.sender === "ai" && (
                <Avatar className="h-8 w-8 self-start">
                  <AvatarFallback><Bot size={18}/></AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm",
                  msg.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-card-foreground border"
                )}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <p className={cn("text-xs mt-1 text-right", msg.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground/70')}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {msg.sender === "user" && (
                <Avatar className="h-8 w-8 self-start">
                   <AvatarFallback><User size={18}/></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isAiTyping && (
               <div className="flex items-end gap-2 justify-start">
                  <Avatar className="h-8 w-8 self-start">
                      <AvatarFallback><Bot size={18}/></AvatarFallback>
                  </Avatar>
                  <div className="bg-card text-card-foreground border rounded-lg px-3 py-2 text-sm shadow-sm">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground"/>
                  </div>
              </div>
          )}
        </div>
      </ScrollArea>
      <div className="flex gap-2 pt-4 border-t">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Type your message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          className="focus:ring-accent flex-grow"
          disabled={isAiTyping}
          aria-label="Chat message input"
        />
        <Button onClick={handleSendMessage} disabled={!inputText.trim() || isAiTyping} aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default InteractiveAssistant;
