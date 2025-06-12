
"use client";

import type React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2, Bot, User, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
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

// SpeechRecognition and SpeechSynthesis types might not be globally available in all TS environments
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition | undefined;
    webkitSpeechRecognition: typeof SpeechRecognition | undefined;
    SpeechSynthesisUtterance: typeof SpeechSynthesisUtterance | undefined;
  }
}

const InteractiveAssistant: React.FC<InteractiveAssistantProps> = ({ language, menu }) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  const speechRecognitionSupported = typeof window !== 'undefined' && (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);
  const speechSynthesisSupported = typeof window !== 'undefined' && !!window.speechSynthesis && !!window.SpeechSynthesisUtterance;


  useEffect(() => {
    if (speechRecognitionSupported) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        recognitionRef.current = new SpeechRecognitionAPI();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[event.results.length - 1][0].transcript.trim();
          setInputText(transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error", event.error);
          let errorMessage = "Speech recognition error.";
          if (event.error === 'no-speech') {
            errorMessage = "No speech detected. Please try again.";
          } else if (event.error === 'audio-capture') {
            errorMessage = "Microphone problem. Please check your microphone.";
          } else if (event.error === 'not-allowed') {
            errorMessage = "Microphone access denied. Please enable microphone permissions in your browser settings.";
          }
          toast({ title: "Voice Error", description: errorMessage, variant: "destructive" });
          setIsListening(false);
        };
        
        recognitionRef.current.onend = () => {
            if (isListening) { // Only set to false if it was truly listening and ended.
                 setIsListening(false);
            }
        };
      }
    }
    if (speechSynthesisSupported) {
      synthesisRef.current = window.speechSynthesis;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechRecognitionSupported, speechSynthesisSupported]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  const addMessage = useCallback((sender: "user" | "ai", text: string) => {
    setChatMessages(prev => [...prev, { id: Date.now().toString() + Math.random().toString(36).substring(2,7), sender, text, timestamp: new Date() }]);
  }, []);

  useEffect(() => {
    setChatMessages([]); 
    const greeting = language === 'en' ? "Hello! I'm your AI assistant for OrderFlow. How can I help you with your order?" :
                     language === 'ru' ? "Здравствуйте! Я ваш AI-помощник для OrderFlow. Чем могу помочь с заказом?" :
                     language === 'ro' ? "Bună ziua! Sunt asistentul tău AI pentru OrderFlow. Cum te pot ajuta cu comanda?" :
                     "Hello! How can I assist you?";
    
    setTimeout(() => {
        addMessage("ai", greeting);
        if (ttsEnabled && greeting) speakText(greeting, language);
        inputRef.current?.focus();
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, addMessage]); // ttsEnabled is not in deps to avoid re-greeting on tts toggle

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);


  const speakText = useCallback((text: string, lang: string) => {
    if (!synthesisRef.current || !speechSynthesisSupported || !window.SpeechSynthesisUtterance) return;
    // Cancel any ongoing speech before starting new
    if (synthesisRef.current.speaking) {
        synthesisRef.current.cancel();
    }
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    synthesisRef.current.speak(utterance);
  }, [speechSynthesisSupported]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isAiTyping) return;
    const userMessageText = inputText;
    addMessage("user", userMessageText);
    setInputText("");
    setIsAiTyping(true);

    const geminiHistory: GeminiMessage[] = chatMessages
      .filter(msg => msg.text !== "") 
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
      if (ttsEnabled && result.response) {
        speakText(result.response, language);
      }
    } catch (err) {
      console.error("Error calling conversational AI:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred with the AI.";
      const displayError = `Sorry, I encountered an error. Please try again. (${errorMessage.substring(0, 50)})`;
      addMessage("ai", displayError);
      if (ttsEnabled) speakText(displayError, language);
      toast({ title: "AI Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsAiTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleToggleListen = () => {
    if (!speechRecognitionSupported || !recognitionRef.current) {
      toast({ title: "Unsupported", description: "Speech recognition is not supported in your browser.", variant: "destructive"});
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
         console.error("Error starting recognition:", e);
         setIsListening(false);
         let errorMessage = "Could not start voice recognition.";
         if (e instanceof DOMException && e.name === 'NotAllowedError') {
            errorMessage = "Microphone access denied. Please enable microphone permissions."
         }
         toast({ title: "Voice Error", description: errorMessage, variant: "destructive" });
      }
    }
  };

  const handleToggleTts = () => {
    setTtsEnabled(prev => {
      const newState = !prev;
      if (!newState && synthesisRef.current && synthesisRef.current.speaking) {
        synthesisRef.current.cancel(); // Stop speech if TTS is turned off
      }
      if (!speechSynthesisSupported && newState) {
         toast({ title: "Unsupported", description: "Text-to-speech is not supported in your browser.", variant: "destructive"});
         return false; // Don't enable if not supported
      }
      return newState;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end mb-2">
        {speechSynthesisSupported && (
            <Button variant="outline" size="icon" onClick={handleToggleTts} title={ttsEnabled ? "Disable Speech Output" : "Enable Speech Output"}>
            {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
        )}
      </div>
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
        {speechRecognitionSupported && (
            <Button 
                variant="outline" 
                size="icon" 
                onClick={handleToggleListen} 
                disabled={isAiTyping}
                title={isListening ? "Stop Listening" : "Start Listening"}
                className={cn(isListening && "ring-2 ring-accent ring-offset-2")}
            >
            {isListening ? <MicOff className="w-5 h-5 text-destructive" /> : <Mic className="w-5 h-5" />}
            </Button>
        )}
        <Input
          ref={inputRef}
          type="text"
          placeholder="Type or speak your message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !isAiTyping && handleSendMessage()}
          className="focus:ring-accent flex-grow"
          disabled={isAiTyping || isListening}
          aria-label="Chat message input"
        />
        <Button onClick={handleSendMessage} disabled={!inputText.trim() || isAiTyping || isListening} aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default InteractiveAssistant;

    