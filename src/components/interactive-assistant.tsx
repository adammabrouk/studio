"use client";

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, MessageSquare, PhoneOff, Send, Loader2, Bot, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

interface InteractiveAssistantProps {
  language: string;
}

type CallStatus = "idle" | "connecting" | "active" | "ended";
interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

const vapiAssistantIds = {
  en: 'vapi-assistant-en-alpha-123',
  ru: 'vapi-assistant-ru-beta-456',
  ro: 'vapi-assistant-ro-gamma-789',
};

const InteractiveAssistant: React.FC<InteractiveAssistantProps> = ({ language }) => {
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [interactionMode, setInteractionMode] = useState<'voice' | 'text' | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const assistantId = vapiAssistantIds[language as keyof typeof vapiAssistantIds] || vapiAssistantIds.en;

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleStartVoiceCall = () => {
    setInteractionMode('voice');
    setCallStatus("connecting");
    toast({ title: "Voice Call Initiated", description: `Connecting to AI assistant (ID: ${assistantId}) for language: ${language}. This is a mock call.` });
    setTimeout(() => {
      setCallStatus("active");
      toast({ title: "Voice Call Active", description: "Mock voice call is now active." });
      addMessage("ai", "Hello! How can I help you with your order today via voice? (This is a mocked response)");
    }, 2000);
  };

  const handleStartTextChat = () => {
    setInteractionMode('text');
    setCallStatus("active"); // Text chat is immediately active
    setChatMessages([]);
    toast({ title: "Text Chat Started", description: `Chatting with AI assistant (ID: ${assistantId}) for language: ${language}.` });
    addMessage("ai", "Hello! How can I help you with your order today via text? (This is a mocked response)");
  };
  
  const addMessage = (sender: "user" | "ai", text: string) => {
    setChatMessages(prev => [...prev, { id: Date.now().toString(), sender, text, timestamp: new Date() }]);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    addMessage("user", inputText);
    setInputText("");
    setIsAiTyping(true);

    // Mock AI response
    setTimeout(() => {
      setIsAiTyping(false);
      addMessage("ai", `I received your message: "${inputText}". How else can I assist you? (Mocked response)`);
    }, 1500 + Math.random() * 1000);
  };

  const handleEndInteraction = () => {
    setCallStatus("ended");
    toast({ title: `${interactionMode === 'voice' ? 'Voice Call' : 'Text Chat'} Ended`, description: "Interaction has been terminated." });
    // Simulate VAPI event for closing interface after a delay
    setTimeout(() => {
      setCallStatus("idle");
      setInteractionMode(null);
      setChatMessages([]);
    }, 2000);
  };

  const renderCallStatus = () => {
    if (interactionMode === 'voice') {
      if (callStatus === 'connecting') return <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connecting voice call...</div>;
      if (callStatus === 'active') return <div className="text-sm text-green-600">Voice call active</div>;
      if (callStatus === 'ended') return <div className="text-sm text-red-600">Voice call ended</div>;
    }
    if (interactionMode === 'text' && callStatus === 'active') {
       return <div className="text-sm text-green-600">Text chat active</div>;
    }
    return null;
  }

  if (callStatus === "idle") {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Bot className="text-primary"/> Interactive Assistant</CardTitle>
          <CardDescription>Start a voice call or text chat with our AI assistant.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleStartVoiceCall} className="w-full sm:w-auto flex-1">
            <Mic className="mr-2 h-4 w-4" /> Start Voice Call
          </Button>
          <Button onClick={handleStartTextChat} variant="outline" className="w-full sm:w-auto flex-1">
            <MessageSquare className="mr-2 h-4 w-4" /> Start Text Chat
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            {interactionMode === 'voice' ? <Mic className="text-primary" /> : <MessageSquare className="text-primary" />}
            {interactionMode === 'voice' ? 'Voice Assistant' : 'Text Chat Assistant'}
        </CardTitle>
        <CardDescription>
          {renderCallStatus()}
          {callStatus !== 'idle' && `Using AI Assistant ID: ${assistantId} for language: ${language}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-muted/20" ref={chatContainerRef}>
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
                  <Avatar className="h-8 w-8">
                    <AvatarFallback><Bot size={18}/></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg px-3 py-2 text-sm shadow",
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground border"
                  )}
                >
                  <p>{msg.text}</p>
                  <p className={cn("text-xs mt-1", msg.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground/70')}>
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {msg.sender === "user" && (
                  <Avatar className="h-8 w-8">
                     <AvatarFallback><User size={18}/></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isAiTyping && (
                 <div className="flex items-end gap-2 justify-start">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback><Bot size={18}/></AvatarFallback>
                    </Avatar>
                    <div className="bg-card text-card-foreground border rounded-lg px-3 py-2 text-sm shadow">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground"/>
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>
        {interactionMode === 'text' && callStatus === 'active' && (
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="focus:ring-accent"
            />
            <Button onClick={handleSendMessage} disabled={!inputText.trim() || isAiTyping}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleEndInteraction} variant="destructive" className="w-full md:w-auto">
          <PhoneOff className="mr-2 h-4 w-4" /> End {interactionMode === 'voice' ? 'Call' : 'Chat'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InteractiveAssistant;
