"use client";

import { useState } from 'react';
import LanguageSelector from "@/components/language-selector";
import TextOrderForm from "@/components/text-order-form";
import InteractiveAssistant from "@/components/interactive-assistant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// This menu string will be used by the AI model. 
// In a real app, this might be dynamically fetched or parsed from a PDF.
const MENU_STRING = `
Appetizers:
- Bruschetta (Tomato, basil, garlic on toasted bread) - $8
- Caprese Salad (Fresh mozzarella, tomatoes, basil, balsamic glaze) - $10
- Garlic Knots (Served with marinara sauce) - $7

Main Courses:
- Spaghetti Carbonara (Pasta with pancetta, egg, Parmesan cheese, black pepper) - $15
- Grilled Salmon (Served with roasted vegetables and lemon-dill sauce) - $20
- Margherita Pizza (Tomato sauce, mozzarella, fresh basil) - $14
- Vegetarian Lasagna (Layers of pasta, ricotta, spinach, marinara, mozzarella) - $16
- Chicken Alfredo (Fettuccine pasta with creamy Alfredo sauce and grilled chicken) - $18

Desserts:
- Tiramisu (Coffee-soaked ladyfingers, mascarpone cream, cocoa powder) - $7
- Panna Cotta (Italian cooked cream dessert with berry coulis) - $6
- Chocolate Lava Cake (Warm chocolate cake with a molten center, served with vanilla ice cream) - $9

Drinks:
- Mineral Water (Still or Sparkling) - $2
- Soft Drinks (Coke, Diet Coke, Sprite, Fanta) - $3
- Fresh Orange Juice - $4
- House Wine (Red or White, per glass) - $8
`;

const AIAssistant = () => {
  const [language, setLanguage] = useState<'en' | 'ru' | 'ro'>('en');

  return (
    <div className="space-y-6">
      <LanguageSelector value={language} onChange={(val) => setLanguage(val as 'en' | 'ru' | 'ro')} />
      
      <Tabs defaultValue="text-order" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text-order">Order by Text</TabsTrigger>
          <TabsTrigger value="interactive">Interactive Assistant</TabsTrigger>
        </TabsList>
        <TabsContent value="text-order" className="mt-4">
          <TextOrderForm language={language} menu={MENU_STRING} />
        </TabsContent>
        <TabsContent value="interactive" className="mt-4">
          <InteractiveAssistant language={language} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAssistant;
