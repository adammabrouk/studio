"use client";

import type React from 'react';
import { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, FileText, CheckCircle2 } from "lucide-react";
import { translateAndOrder } from "@/ai/flows/translate-and-order";
import type { TranslateAndOrderInput, TranslateAndOrderOutput } from "@/ai/flows/translate-and-order";
import { useToast } from "@/hooks/use-toast";

interface TextOrderFormProps {
  language: string;
  menu: string;
}

const TextOrderForm: React.FC<TextOrderFormProps> = ({ language, menu }) => {
  const [orderText, setOrderText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TranslateAndOrderOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderText.trim()) {
      toast({ title: "Input Required", description: "Please enter your order.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const input: TranslateAndOrderInput = {
        language: language as 'en' | 'ru' | 'ro',
        orderText,
        menu,
      };
      const response = await translateAndOrder(input);
      setResult(response);
      toast({ title: "Order Processed", description: "Your order has been processed by the AI.", variant: "default" });
    } catch (err) {
      console.error("Error processing order:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      toast({ title: "Error", description: `Failed to process order: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2"><FileText className="text-primary" /> Order by Text</CardTitle>
        <CardDescription>Type your order below in your selected language. Our AI will translate and confirm it.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <Textarea
            placeholder={`Enter your order in ${language === 'en' ? 'English' : language === 'ru' ? 'Russian' : 'Romanian'}...`}
            value={orderText}
            onChange={(e) => setOrderText(e.target.value)}
            rows={4}
            className="focus:ring-accent"
            disabled={isLoading}
          />
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Place Order with AI"
            )}
          </Button>
        </CardFooter>
      </form>

      {error && (
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle className="font-headline">Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      )}

      {result && (
        <CardContent className="space-y-4">
          <Alert variant="default" className="bg-primary/10 border-primary/30">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <AlertTitle className="font-headline text-primary">Order Confirmation</AlertTitle>
            <AlertDescription className="space-y-2">
              <p><strong>Your order (in English):</strong> {result.englishOrder}</p>
              <p><strong>Confirmation:</strong> {result.orderConfirmation}</p>
            </AlertDescription>
          </Alert>
        </CardContent>
      )}
    </Card>
  );
};

export default TextOrderForm;
