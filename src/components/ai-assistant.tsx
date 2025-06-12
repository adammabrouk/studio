
"use client";

import type React from 'react';
import { useState } from 'react';
import LanguageSelector from "@/components/language-selector";
import InteractiveAssistant from "@/components/interactive-assistant";

interface AIAssistantProps {
  menu: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ menu }) => {
  const [language, setLanguage] = useState<'en' | 'ru' | 'ro'>('en');

  return (
    <div className="space-y-4 h-full flex flex-col">
      <LanguageSelector value={language} onChange={(val) => setLanguage(val as 'en' | 'ru' | 'ro')} />
      <InteractiveAssistant language={language} menu={menu} />
    </div>
  );
};

export default AIAssistant;
