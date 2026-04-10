import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Flame, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { streamTEK17Chat, type ChatMessage } from "@/lib/tek17-stream";
import { toast } from "sonner";

const quickQuestions = [
  "Hva er kravene for risikoklasse 4?",
  "Når kreves sprinkleranlegg?",
  "Krav til rømningsveier i BKL2?",
  "Hva er brannmotstandskravene for ulike brannklasser?",
  "Krav til avstand mellom bygg?",
  "Hva er persontallskravene for forsamlingslokaler?",
];

const TEK17Assistent = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";
    const upsert = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      await streamTEK17Chat({
        messages: allMessages,
        onDelta: upsert,
        onDone: () => setIsLoading(false),
        onError: (err) => { toast.error(err); setIsLoading(false); },
      });
    } catch {
      toast.error("Kunne ikke kontakte AI-assistenten");
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Brannkonsulent</h1>
            <p className="text-sm text-muted-foreground">Spør om branntekniske krav fra TEK17, VTEK17 og BF85</p>
          </div>
        </div>

        <div className="rounded-xl border bg-background shadow-sm overflow-hidden flex flex-col" style={{ height: "calc(100vh - 220px)" }}>
          <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef as any}>
            {messages.length === 0 && (
              <div className="space-y-4 py-8">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Flame className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <p className="text-center text-muted-foreground text-sm max-w-md mx-auto">
                  Jeg er en AI brannkonsulent som kan hjelpe deg med spørsmål om TEK17, VTEK17 og BF85 – sikkerhet ved brann. Still et spørsmål eller velg et forslag under.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {quickQuestions.map(q => (
                    <Button key={q} variant="outline" size="sm" className="text-xs" onClick={() => send(q)}>
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : m.content}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-4">
            <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Still et spørsmål om TEK17, BF85..."
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TEK17Assistent;
