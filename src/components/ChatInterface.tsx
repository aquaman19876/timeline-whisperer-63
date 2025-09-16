import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  data?: any;
}

const ChatInterface = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: 'Welcome to ResearchTracker! I can help you extract and organize information about research programs, deadlines, people, and resources. Just tell me about the programs you\'re interested in!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // For now, we'll simulate the user ID (in a real app, this would come from auth)
      const userId = 'demo-user';

      const { data, error } = await supabase.functions.invoke('process-program-data', {
        body: {
          message: userMessage.content,
          userId: userId,
        },
      });

      if (error) {
        throw error;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateSummaryMessage(data),
        timestamp: new Date(),
        data: data,
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (data.programs?.length > 0) {
        toast({
          title: "Programs Added Successfully!",
          description: `Extracted ${data.programs.length} program(s) with ${data.deadlines.length} deadline(s)`,
          duration: 5000,
        });
      }

    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error processing your message. Please try again or rephrase your request.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSummaryMessage = (data: any) => {
    const { programs, deadlines, people, links } = data;
    
    if (!programs || programs.length === 0) {
      return "I didn't find any specific research program information in your message. Could you provide more details about the programs, universities, and deadlines you're interested in?";
    }

    let summary = `Great! I've extracted the following information:\n\n`;
    
    summary += `📚 **Programs Added (${programs.length}):**\n`;
    programs.forEach((program: any, idx: number) => {
      summary += `${idx + 1}. ${program.title} at ${program.university}\n`;
    });

    if (deadlines.length > 0) {
      summary += `\n⏰ **Deadlines Added (${deadlines.length}):**\n`;
      deadlines.forEach((deadline: any, idx: number) => {
        const date = new Date(deadline.deadline_date).toLocaleDateString();
        summary += `${idx + 1}. ${deadline.title} - ${date} (${deadline.deadline_type})\n`;
      });
    }

    if (people.length > 0) {
      summary += `\n👥 **People Added (${people.length}):**\n`;
      people.forEach((person: any, idx: number) => {
        summary += `${idx + 1}. ${person.name} - ${person.role}\n`;
      });
    }

    if (links.length > 0) {
      summary += `\n🔗 **Links Added (${links.length}):**\n`;
      links.forEach((link: any, idx: number) => {
        summary += `${idx + 1}. ${link.title} (${link.link_type})\n`;
      });
    }

    summary += `\nYou can view this information in the Calendar or Timelines sections. Feel free to add more programs or ask me any questions!`;
    
    return summary;
  };

  return (
    <div className="flex flex-col h-[600px] max-w-4xl mx-auto">
      <Card className="flex-1 flex flex-col shadow-elegant border-accent/20">
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : message.type === 'system'
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {message.type === 'user' ? (
                  <User className="h-4 w-4" />
                ) : message.type === 'system' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : message.type === 'system'
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md bg-secondary">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-lg px-4 py-2 bg-muted">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Processing your message...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 border-t border-accent/20">
          <div className="flex space-x-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me about research programs you're interested in, including universities, deadlines, contacts, etc..."
              className="flex-1 resize-none min-h-[60px] max-h-[120px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="shrink-0 bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ChatInterface;