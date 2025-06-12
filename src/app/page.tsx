import LogoAnimation from "@/components/logo-animation";
import MenuDisplay from "@/components/menu-display";
import AIAssistant from "@/components/ai-assistant";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center min-h-screen p-4 pt-8 space-y-8 md:p-8 md:pt-12 bg-background text-foreground">
      <LogoAnimation />
      
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">
          Welcome to OrderFlow
        </h1>
        <p className="mt-2 text-lg text-muted-foreground font-body">
          Effortless ordering with our AI-powered assistant.
        </p>
      </header>

      <div className="w-full max-w-5xl space-y-8">
        <section id="menu" aria-labelledby="menu-heading">
          <Card className="shadow-xl overflow-hidden">
            <CardHeader className="bg-card">
              <CardTitle id="menu-heading" className="text-3xl font-headline text-primary">
                Our Menu
              </CardTitle>
              <CardDescription>
                Scroll to explore our delicious offerings.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 md:p-0"> {/* Adjusted padding for better fit of MenuDisplay */}
              <MenuDisplay />
            </CardContent>
          </Card>
        </section>

        <section id="ai-assistant" aria-labelledby="ai-assistant-heading">
          <Card className="shadow-xl overflow-hidden">
            <CardHeader className="bg-card">
              <CardTitle id="ai-assistant-heading" className="text-3xl font-headline text-primary">
                AI Powered Ordering
              </CardTitle>
              <CardDescription>
                Let our AI assistant help you place your order in multiple languages.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <AIAssistant />
            </CardContent>
          </Card>
        </section>
      </div>

      <footer className="py-8 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} OrderFlow. All rights reserved.</p>
      </footer>
    </main>
  );
}
