"use client";

import type React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Languages } from 'lucide-react';

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const languages = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский (Russian)' },
  { value: 'ro', label: 'Română (Romanian)' },
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="language-select" className="flex items-center gap-2 text-sm font-medium">
        <Languages className="w-5 h-5 text-primary" />
        Select Language
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="language-select" className="w-full md:w-[280px]">
          <SelectValue placeholder="Select a language" />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.value} value={lang.value}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSelector;
