
"use client";

import type React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2, Bot, User, Mic, MicOff, StopCircle, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { conversationalOrder, type ConversationalOrderInput, type ConversationalOrderOutput } from "@/ai/flows/conversational-order-flow";
import { speechToText, type SpeechToTextInput, type SpeechToTextOutput } from "@/ai/flows/speech-to-text-flow";
import { textToSpeech, type TextToSpeechInput, type TextToSpeechOutput } from "@/ai/flows/text-to-speech-flow";

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

const languageToGoogleTTSCode: Record<string, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  ro: 'ro-RO',
};

const InteractiveAssistant: React.FC<InteractiveAssistantProps> = ({ language, menu }) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const addMessage = useCallback((sender: "user" | "ai", text: string) => {
    setChatMessages(prev => [...prev, { id: Date.now().toString() + Math.random().toString(36).substring(2,7), sender, text, timestamp: new Date() }]);
  }, []);
  
  useEffect(() => {
    // Create an audio element for playing TTS responses
    audioPlayerRef.current = new Audio();
    audioPlayerRef.current.onended = () => setIsSpeaking(false);
    audioPlayerRef.current.onerror = () => {
        setIsSpeaking(false);
        toast({ title: "Playback Error", description: "Could not play audio.", variant: "destructive"});
    }
    
    // Cleanup audio element on component unmount
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.src = "";
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setChatMessages([]); 
    const greeting = language === 'en' ? "Hello! I'm your AI assistant for OrderFlow using Google Cloud Speech. How can I help?" :
                     language === 'ru' ? "Здравствуйте! Я ваш AI-помощник для OrderFlow с Google Cloud Speech. Чем могу помочь?" :
                     language === 'ro' ? "Bună ziua! Sunt asistentul tău AI pentru OrderFlow cu Google Cloud Speech. Cum te pot ajuta?" :
                     "Hello! How can I assist you?";
    
    setTimeout(() => {
        addMessage("ai", greeting);
        if (ttsEnabled && greeting) handleSpeakText(greeting, languageToGoogleTTSCode[language]);
        inputRef.current?.focus();
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, addMessage]); // ttsEnabled is not in deps to avoid re-greeting on tts toggle

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSpeakText = async (text: string, langCode: string) => {
    if (!text.trim() || isSpeaking) return;
    setIsSpeaking(true);
    try {
      const ttsInput: TextToSpeechInput = { text, languageCode: langCode };
      const result: TextToSpeechOutput = await textToSpeech(ttsInput);
      if (audioPlayerRef.current && result.audioDataUri) {
        audioPlayerRef.current.src = result.audioDataUri;
        await audioPlayerRef.current.play();
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error("Error calling Text-to-Speech flow:", error);
      toast({ title: "TTS Error", description: `Could not synthesize speech. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
      setIsSpeaking(false);
    }
  };

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
        await handleSpeakText(result.response, languageToGoogleTTSCode[language]);
      }
    } catch (err) {
      console.error("Error calling conversational AI:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred with the AI.";
      const displayError = `Sorry, I encountered an error. Please try again. (${errorMessage.substring(0, 50)})`;
      addMessage("ai", displayError);
      if (ttsEnabled) await handleSpeakText(displayError, languageToGoogleTTSCode[language]);
      toast({ title: "AI Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsAiTyping(false);
      inputRef.current?.focus();
    }
  };

  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Try to specify Opus in WebM if browser supports it, otherwise default.
      // Common browsers like Chrome/Firefox use 'audio/webm;codecs=opus' by default for MediaRecorder.
      const options = { mimeType: 'audio/webm;codecs=opus' }; 
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.warn(`${options.mimeType} is not supported, trying default.`);
        // @ts-ignore
        delete options.mimeType; // Use browser default if specific one isn't supported
      }
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        setIsTranscribing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            const sttInput: SpeechToTextInput = { 
              audioDataUri: base64Audio, 
              languageCode: languageToGoogleTTSCode[language] 
            };
            const result: SpeechToTextOutput = await speechToText(sttInput);
            setInputText(prev => prev + (prev ? " " : "") + result.transcript);
          } catch (error) {
            console.error("Error calling Speech-to-Text flow:", error);
            toast({ title: "Transcription Error", description: `Could not transcribe audio. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
          } finally {
            setIsTranscribing(false);
            inputRef.current?.focus();
          }
        };
        stream.getTracks().forEach(track => track.stop()); // Stop microphone
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      let errorMessage = "Could not start voice recording.";
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
           errorMessage = "Microphone access denied. Please enable microphone permissions."
        } else if (err.name === 'NotFoundError') {
            errorMessage = "No microphone found. Please connect a microphone."
        }
      }
      toast({ title: "Voice Error", description: errorMessage, variant: "destructive" });
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      // setIsRecording(false); // onstop will set this
    }
  };

  const handleToggleListen = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  const handleToggleTts = () => {
    setTtsEnabled(prev => {
      const newState = !prev;
      if (!newState && audioPlayerRef.current && isSpeaking) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
        setIsSpeaking(false);
      }
      return newState;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end mb-2">
        <Button variant="outline" size="icon" onClick={handleToggleTts} title={ttsEnabled ? "Disable Speech Output" : "Enable Speech Output"} disabled={isSpeaking}>
          {isSpeaking ? <Loader2 className="w-5 h-5 animate-spin" /> : (ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />)}
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
          {(isAiTyping || isTranscribing) && (
               <div className="flex items-end gap-2 justify-start">
                  <Avatar className="h-8 w-8 self-start">
                      <AvatarFallback><Bot size={18}/></AvatarFallback>
                  </Avatar>
                  <div className="bg-card text-card-foreground border rounded-lg px-3 py-2 text-sm shadow-sm">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground"/>
                      {isTranscribing && <span className="ml-2 text-xs">Transcribing...</span>}
                  </div>
              </div>
          )}
        </div>
      </ScrollArea>
      <div className="flex gap-2 pt-4 border-t">
        <Button 
            variant="outline" 
            size="icon" 
            onClick={handleToggleListen} 
            disabled={isAiTyping || isTranscribing || isSpeaking}
            title={isRecording ? "Stop Recording" : "Start Recording"}
            className={cn(isRecording && "ring-2 ring-destructive ring-offset-2")}
        >
          {isRecording ? <StopCircle className="w-5 h-5 text-destructive" /> : <Mic className="w-5 h-5" />}
        </Button>
        <Input
          ref={inputRef}
          type="text"
          placeholder="Type or speak your message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !isAiTyping && !isRecording && !isTranscribing && handleSendMessage()}
          className="focus:ring-accent flex-grow"
          disabled={isAiTyping || isRecording || isTranscribing || isSpeaking}
          aria-label="Chat message input"
        />
        <Button onClick={handleSendMessage} disabled={!inputText.trim() || isAiTyping || isRecording || isTranscribing || isSpeaking} aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default InteractiveAssistant;
