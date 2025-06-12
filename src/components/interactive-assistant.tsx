"use client";

import type React from 'react';
import { useState, useEffect, useRef, useCallback, useMemo, useReducer } from 'react';
import Vapi from '@vapi-ai/web';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2, Bot, User, Mic, StopCircle, Volume2, VolumeX } from "lucide-react";
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
  menu: string; // While menu might not be directly used by VAPI, keep it as it might be needed for the VAPI assistant's instructions.
}

// Map language codes to VAPI Assistant IDs
const ASSISTANT_IDS: Record<string, string> = {
    en: 'e20e240c-ce7d-4616-a8e5-b76066906d87',
    ru: 'YOUR_RUSSIAN_ASSISTANT_ID', // Replace with your Russian VAPI Assistant ID
    ro: 'f3d7dd8d-247c-48f0-aed3-12f4df377bd9',
};
 // Replace with your VAPI Public API Key
 const VAPI_PUBLIC_API_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_API_KEY || 'YOUR_VAPI_PUBLIC_API_KEY'; // Consider using environment variables

const InteractiveAssistant: React.FC<InteractiveAssistantProps> = ({ language, menu }) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Used for initial connection/setup
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false); // VAPI's listening status
  const [isTranscribing, setIsTranscribing] = useState(false); // VAPI's transcription status
 
  const vapi = useMemo(() => new Vapi(VAPI_PUBLIC_API_KEY), []);

  // VAPI Assistant ID based on selected language
  const currentAssistantId = useMemo(() => ASSISTANT_IDS[language], [language]);

  const addMessage = useCallback((sender: "user" | "ai", text: string) => {
    setChatMessages(prev => [...prev, { id: Date.now().toString() + Math.random().toString(36).substring(2,7), sender, text, timestamp: new Date() }]);
  }, []);
  
  useEffect(() => {
    if (!VAPI_PUBLIC_API_KEY || VAPI_PUBLIC_API_KEY === 'YOUR_VAPI_PUBLIC_API_KEY') {
 console.error("VAPI Public API Key is not set. Please provide your key.");
         toast({
            title: "Configuration Error",
            description: "VAPI Public API Key is missing. Please check your environment variables.",
            variant: "destructive", // Ensure you have 'destructive' variant in your toast component
        });
        return;
    }

    // VAPI Event Listeners
    vapi.on('call-start', () => {
      console.log('VAPI Call started');
      setIsConnected(true);
      setIsListening(true); // VAPI starts listening immediately on call start
      setIsLoading(false);
    });

    vapi.on('call-end', () => {
      console.log('VAPI Call ended');
      setIsConnected(false);
        setIsSpeaking(false);
      setIsListening(false);
       // Optional: Add an AI message indicating the call ended
       addMessage("ai", language === 'en' ? "The conversation has ended. How else can I assist?" :
                         language === 'ru' ? "Разговор закончен. Чем еще могу помочь?" :
                         language === 'ro' ? "Conversația s-a încheiat. Cu ce altceva te pot ajuta?" :
                         "The conversation has ended.");
    });
    

    vapi.on('speech-start', () => {
      console.log('VAPI Assistant started speaking');
      setIsSpeaking(true);
      setIsListening(false); // Assistant speaks, not listening to user
    });

    vapi.on('speech-end', () => {
      console.log('VAPI Assistant stopped speaking');
      setIsSpeaking(false);
      setIsListening(true); // Assistant finished, now listening for user
    });

     vapi.on('listening-start', () => {
      console.log('VAPI Listening started');
       setIsListening(true);
       setIsTranscribing(false); // Usually stops transcribing when listening begins
    });

    vapi.on('listening-end', () => {
       console.log('VAPI Listening ended');
       setIsListening(false);
       // Transcription might continue briefly after listening ends
    });
    
    vapi.on('message', (message) => {
      console.log('VAPI Message:', message);
      if (message.type === 'transcript' && message.transcript) {
         // Add transcript messages to chat. VAPI sends these as it transcribes.
        // You might refine this to show only the final user message.
        // For now, let's show both user and AI transcripts.
        if (message.role === 'user') {
             setIsTranscribing(true);
             // Optional: Update latest user message instead of adding new
            const lastMessage = chatMessages[chatMessages.length - 1];
            if (lastMessage?.sender === 'user' && (Date.now() - lastMessage.timestamp.getTime() < 2000)) { // simple check for continuous speech
                setChatMessages(prev => prev.slice(0, -1).concat({...lastMessage, text: message.transcript}));
            } else {
                 addMessage('user', message.transcript);
            }
        } else if (message.role === 'assistant') {
            // AI transcripts are often partial, the final 'hang' or 'end' message is more useful
            // addMessage('ai', message.transcript); // Uncomment if you want to see AI transcription in real-time (can be noisy)
        }
      } else if (message.type === 'hang' && message.message) {
           setIsTranscribing(false); // Transcription is typically done when the final message is received
           setIsListening(false); // Ensure listening is off after processing final response
           // Final response from the assistant after processing
           addMessage('ai', message.message);
      }
    });

    vapi.on('error', (error) => {
      console.error('Vapi error:', error);
      setIsConnected(false);
      setIsLoading(false);
      setIsSpeaking(false);
      setIsListening(false);
      toast({ title: "VAPI Error", description: `VAPI encountered an error. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    });

    // Cleanup event listeners and stop VAPI on component unmount
    return () => {
      vapi.stop();
      setIsConnected(false); // Ensure state is reset on unmount
      // Remove all listeners to prevent memory leaks
      vapi.removeAllListeners();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vapi, language, addMessage, toast]);

  useEffect(() => {
    setChatMessages([]);
    // Stop any ongoing VAPI call when language changes
    if (isConnected) {
        vapi.stop();
    }
    // Reset all connection/status states
    setIsConnected(false);

    const greeting = language === 'en' ? "Hello! I'm your AI assistant for OrderFlow using Google Cloud Speech. How can I help?" :
                     language === 'ru' ? "Здравствуйте! Я ваш AI-помощник для OrderFlow. Чем могу помочь?" :
                     language === 'ro' ? "Bună ziua! Sunt asistentul tău AI pentru OrderFlow. Cum te pot ajuta?" :
                     "Hello! How can I assist you?";
    
    setTimeout(() => {
        addMessage("ai", greeting);
        inputRef.current?.focus();
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, addMessage, vapi, isConnected]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    const userMessageText = inputText;
    addMessage("user", userMessageText);
    setInputText("");
    setIsLoading(true); // Indicate loading while sending/processing

    try {
       // Send text message via VAPI if connected
       if (isConnected) {
           vapi.send({ type: 'text', message: userMessageText });
       } else {
            // If not connected, start a VAPI call
            // This approach ensures the message is sent immediately after connection
             await vapi.start(currentAssistantId, {
                initialMessage: userMessageText,
                // You might need to pass context like 'menu' here if your VAPI assistant requires it
                 // e.g., metadata: { menu: menu, language: language }
             });
             // Vapi start will handle setting isConnected and isLoading
       }
    } catch (err) {
      console.error("Error sending message via VAPI:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred with the AI.";
      const displayError = `Sorry, I encountered an error. Please try again. (${errorMessage.substring(0, 50)})`;
      addMessage("ai", displayError);
      toast({ title: "AI Error", description: errorMessage, variant: "destructive" });
      inputRef.current?.focus();
    }
    // isLoading will be set to false by VAPI's 'call-start' or 'error' events
  };

  const startCall = async () => {
    if (isConnected || isLoading) return;
    setIsLoading(true); // Indicate connecting
    
    try {
      await vapi.start(currentAssistantId, {
         // You might need to pass context like 'menu' here if your VAPI assistant requires it
         // e.g., metadata: { menu: menu, language: language }
      });
      // VAPI's 'call-start' listener will set isConnected to true
    } catch (err) {
      console.error("Error starting VAPI call:", err);
      let errorMessage = "Could not start voice recording.";
      if (err instanceof DOMException) {
         // Handle common browser microphone permission errors
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
           errorMessage = "Microphone access denied. Please enable microphone permissions."
        } else if (err.name === 'NotFoundError') {
            errorMessage = "No microphone found. Please connect a microphone."
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
      return newState;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end mb-2">
        {/* VAPI handles TTS internally, so the TTS toggle is removed */}
        {/* Optional: Add a status indicator here if needed */}
         <span className={cn("text-sm font-medium", isConnected ? "text-green-600" : "text-gray-500")}>
            Status: {isLoading ? "Connecting..." : (isConnected ? (isSpeaking ? "Speaking..." : (isTranscribing ? "Transcribing..." : (isListening ? "Listening..." : "Connected"))) : "Disconnected")}
         </span>
        </Button>
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
          {isLoading && (
               <div className="flex items-end gap-2 justify-start">
                  <Avatar className="h-8 w-8 self-start">
                      <AvatarFallback><Bot size={18}/></AvatarFallback>
                  </Avatar>
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground"/>
                </div>
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
          onKeyPress={(e) => e.key === 'Enter' && !isLoading && !isConnected && handleSendMessage()} // Only allow text input when not in a voice call
          className="flex-grow"
          disabled={isLoading || isConnected} // Disable text input when VAPI is connected for voice interaction
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
