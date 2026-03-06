import { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const suggestedQueries = [
  'how many houses are connected in ward 1',
  'show not connected houses in ward 2',
  'what causes ugss failure',
  'how are ugss problems resolved',
];

async function sendToBackend(message: string): Promise<string> {
  const response = await fetch('http://127.0.0.1:5000/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error('Backend not reachable');
  }

  const data = await response.json();
  return data.reply;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hello! I'm your UGSS AI Assistant. Ask me anything about UGSS connections, failures, or resolution processes.",
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const reply = await sendToBackend(userMessage.content);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Unable to connect to UGSS AI server.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (query: string) => {
    setInput(query);
  };

  return (
    <DashboardLayout
      title="AI Chatbot"
      subtitle="Query UGSS data using natural language"
    >
      <div className="flex h-[calc(100vh-180px)] gap-6">
        {/* Chat Area */}
        <div className="flex flex-1 flex-col rounded-xl border border-border bg-card">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gradient-accent text-white'
                    )}
                  >
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>

                  <div
                    className={cn(
                      'max-w-[80%] rounded-xl px-4 py-3',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </p>
                    <p className="mt-1 text-xs opacity-60">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-accent text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-xl bg-muted px-4 py-3 text-sm">
                    UGSS AI is typing...
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t border-border p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask UGSS-related questions..."
                className="flex-1"
              />
              <Button type="submit" disabled={!input.trim() || isTyping}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Suggestions */}
        <div className="w-80 rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-warning" />
            <h3 className="font-semibold">Suggested Queries</h3>
          </div>

          <div className="space-y-2">
            {suggestedQueries.map((query, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(query)}
                className="w-full rounded-lg bg-muted/50 p-3 text-left text-sm hover:bg-muted"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
