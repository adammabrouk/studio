"use client";

import type React from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Vapi from '@vapi-ai/web';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2, Bot, User, Mic, StopCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

interface InteractiveAssistantProps {
  language: 'en' | 'ru' | 'ro';
  menu: string;
}

const ASSISTANT_IDS: Record<string, string> = {
  en: 'e20e240c-ce7d-4616-a8e5-b76066906d87',
  ru: 'db3716bf-502a-4d70-816f-8f25c9a11a77',
  ro: 'f3d7dd8d-247c-48f0-aed3-12f4df377bd9',
};

const VAPI_PUBLIC_API_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_API_KEY;
console.log("VAPI_PUBLIC_API_KEY:", VAPI_PUBLIC_API_KEY);
const InteractiveAssistant: React.FC<InteractiveAssistantProps> = ({ language, menu }) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const isRecording = isSpeaking || isListening || isTranscribing;

  const vapi = useMemo(() => new Vapi(VAPI_PUBLIC_API_KEY), []);
  const currentAssistantId = useMemo(() => ASSISTANT_IDS[language], [language]);

  const addMessage = useCallback((sender: "user" | "ai", text: string) => {
    setChatMessages(prev => [...prev, {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      sender,
      text,
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    if (!VAPI_PUBLIC_API_KEY || VAPI_PUBLIC_API_KEY === 'YOUR_VAPI_PUBLIC_API_KEY') {
      console.error("VAPI Public API Key is not set.");
      toast({
        title: "Configuration Error",
        description: "VAPI Public API Key is missing.",
        variant: "destructive",
      });
      return;
    }

    vapi.on('call-start', () => {
      setIsConnected(true);
      setIsListening(true);
      setIsLoading(false);
    });

    vapi.on('call-end', () => {
      setIsConnected(false);
      setIsSpeaking(false);
      setIsListening(false);
      addMessage("ai", {
        en: "The conversation has ended. How else can I assist?",
        ru: "Разговор закончен. Чем еще могу помочь?",
        ro: "Conversația s-a încheiat. Cu ce altceva te pot ajuta?",
      }[language]);
    });

    vapi.on('speech-start', () => {
      setIsSpeaking(true);
      setIsListening(false);
    });

    vapi.on('speech-end', () => {
      setIsSpeaking(false);
      setIsListening(true);
    });

    vapi.on('listening-start', () => {
      setIsListening(true);
      setIsTranscribing(false);
    });

    vapi.on('listening-end', () => {
      setIsListening(false);
    });

    vapi.on('message', (message) => {
      if (message.type === 'transcript' && message.transcript) {
        if (message.role === 'user') {
          setIsTranscribing(true);
          const lastMessage = chatMessages[chatMessages.length - 1];
          if (lastMessage?.sender === 'user' && (Date.now() - lastMessage.timestamp.getTime() < 2000)) {
            setChatMessages(prev => prev.slice(0, -1).concat({ ...lastMessage, text: message.transcript }));
          } else {
            addMessage('user', message.transcript);
          }
        }
      } else if (message.type === 'hang' && message.message) {
        setIsTranscribing(false);
        setIsListening(false);
        addMessage('ai', message.message);
      }
    });

    vapi.on('error', (error) => {
      console.error('VAPI error:', error);
      setIsConnected(false);
      setIsLoading(false);
      setIsSpeaking(false);
      setIsListening(false);
      toast({
        title: "VAPI Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    });

    return () => {
      vapi.stop();
      setIsConnected(false);
      vapi.removeAllListeners();
    };
  }, [vapi, language, toast, addMessage, chatMessages]);

  useEffect(() => {
    setChatMessages([]);
    if (isConnected) vapi.stop();
    setIsConnected(false);

    const greeting = {
      en: "Hello! I'm your AI assistant for OrderFlow. How can I help?",
      ru: "Здравствуйте! Я ваш AI-помощник для OrderFlow. Чем могу помочь?",
      ro: "Bună ziua! Sunt asistentul tău AI pentru OrderFlow. Cum te pot ajuta?",
    }[language];

    setTimeout(() => {
      addMessage("ai", greeting);
      inputRef.current?.focus();
    }, 0);
  }, [language, addMessage]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const startCall = async () => {
    if (isConnected || isLoading) return;
    setIsLoading(true);
    try {
      await vapi.start(currentAssistantId, {
        metadata: { menu, language }
      });
    } catch (err) {
      let errorMessage = "Could not start voice recording.";
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = "Microphone access denied.";
        } else if (err.name === 'NotFoundError') {
          errorMessage = "No microphone found.";
        }
      }
      toast({ title: "Microphone Error", description: errorMessage, variant: "destructive" });
      setIsLoading(false);
    }
  };

  const handleToggleCall = () => {
    if (isConnected) {
      vapi.stop();
    } else {
      startCall();
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    const userMessageText = inputText;
    addMessage("user", userMessageText);
    setInputText("");
    setIsLoading(true);
    try {
      if (isConnected) {
        vapi.send({ type: 'text', message: userMessageText });
      } else {
        await vapi.start(currentAssistantId, {
          initialMessage: userMessageText,
          metadata: { menu, language }
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred.";
      addMessage("ai", `Sorry, an error occurred. (${errorMessage.substring(0, 50)})`);
      toast({ title: "AI Error", description: errorMessage, variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end mb-2">
        <span className={cn("text-sm font-medium", isConnected ? "text-green-600" : "text-gray-500")}>
          Status: {isLoading ? "Connecting..." : isConnected ? (isSpeaking ? "Speaking..." : isTranscribing ? "Transcribing..." : isListening ? "Listening..." : "Connected") : "Disconnected"}
        </span>
      </div>

      <ScrollArea className="flex-grow w-full rounded-md border p-4 bg-muted/10 mb-4" ref={chatContainerRef}>
        <div className="space-y-4">
          {chatMessages.map((msg) => (
            <div key={msg.id} className={cn("flex items-end gap-2", msg.sender === "user" ? "justify-end" : "justify-start")}>
              {msg.sender === "ai" && (
                <Avatar className="h-8 w-8 self-start">
                  <AvatarFallback><Bot size={18} /></AvatarFallback>
                </Avatar>
              )}
              <div className={cn("max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm", msg.sender === "user" ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground border")}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <p className={cn("text-xs mt-1 text-right", msg.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground/70')}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {msg.sender === "user" && (
                <Avatar className="h-8 w-8 self-start">
                  <AvatarFallback><User size={18} /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end gap-2 justify-start">
              <Avatar className="h-8 w-8 self-start">
                <AvatarFallback><Bot size={18} /></AvatarFallback>
              </Avatar>
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex gap-2 pt-4 border-t">
        <Button
          variant="outline"
          size="icon"
          onClick={handleToggleCall}
          disabled={isLoading}
          title={isConnected ? "Stop conversation" : "Start voice conversation"}
          className={cn(isConnected && (isSpeaking ? "ring-2 ring-blue-500 ring-offset-2" : (isListening || isTranscribing ? "ring-2 ring-green-500 ring-offset-2" : "")))}
        >
          {isRecording ? <StopCircle className="w-5 h-5 text-destructive" /> : <Mic className="w-5 h-5" />}
        </Button>

        <Input
          ref={inputRef}
          type="text"
          placeholder="Type or speak your message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && !isConnected && handleSendMessage()}
          className="flex-grow"
          disabled={isLoading || isConnected}
          aria-label="Chat message input"
        />

        <Button onClick={handleSendMessage} disabled={!inputText.trim() || isLoading || isConnected} aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default InteractiveAssistant;
