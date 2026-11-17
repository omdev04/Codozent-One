import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  ArrowRight,
  HelpCircle,
  Lightbulb,
  Building2
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  actionSuggested?: {
    type: string;
    payload?: any;
  };
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const { askAssistant, activeCompany } = useERP();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Namaste! I am your Codozent One Business Copilot for **${activeCompany?.name || 'your factory'}**.\n\nYou can ask me about outstanding customer udhar, pending GST liabilities, Section 43B(h) vendor payments, or low stock alerts in Hindi, Marathi, or English!`
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const samplePills = [
    'Iss mahine kiska payment baki hai?',
    'Pending GST tax liability kitna hai?',
    'Section 43B(h) overdue vendor list',
    'Low stock raw materials check karo'
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || isLoading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q.trim()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await askAssistant(q.trim());
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: res.reply,
        actionSuggested: res.actionSuggested
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `bot-err-${Date.now()}`,
        sender: 'assistant',
        text: `Sorry, could not process request right now: ${err.message}`
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-ink/20 backdrop-blur-xs flex justify-end">
      <div
        className="w-full max-w-md bg-canvas border-l border-hairline h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        role="dialog"
      >
        {/* Drawer Header */}
        <div className="p-4 bg-chrome border-b border-hairline flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
                <span>MSME AI Copilot</span>
                <span className="text-[10px] bg-band-blue text-primary px-1.5 py-0.2 rounded font-mono font-medium">
                  Bharat v2
                </span>
              </h3>
              <p className="text-[11px] text-ink-nav truncate max-w-[200px]">
                {activeCompany?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-nav hover:text-ink p-1 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Suggestion Quick Pills */}
        <div className="p-3 bg-canvas border-b border-hairline overflow-x-auto whitespace-nowrap space-x-2 no-scrollbar">
          {samplePills.map((pill, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(pill)}
              className="inline-block text-[11px] px-2.5 py-1 bg-chrome hover:bg-surface-2 border border-hairline rounded-md text-ink-body cursor-pointer transition-colors"
            >
              {pill}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'assistant' && (
                <div className="w-7 h-7 rounded-md bg-band-blue border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-md p-3 text-xs leading-relaxed whitespace-pre-wrap ${m.sender === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-chrome border border-hairline text-ink-body'
                  }`}
              >
                {m.text}

                {/* If the assistant suggested a module action */}
                {m.actionSuggested && onNavigateTab && (
                  <div className="mt-3 pt-2 border-t border-hairline/60">
                    <button
                      onClick={() => {
                        if (m.actionSuggested?.type === 'navigate_khatabook') onNavigateTab('khatabook');
                        else if (m.actionSuggested?.type === 'navigate_gst') onNavigateTab('gstReturns');
                        else if (m.actionSuggested?.type === 'navigate_ca') onNavigateTab('caDesk');
                        else if (m.actionSuggested?.type === 'navigate_inventory') onNavigateTab('inventory');
                        onClose();
                      }}
                      className="btn-outline text-[11px] py-1 px-2.5 w-full flex items-center justify-center gap-1.5 cursor-pointer bg-canvas"
                    >
                      <span>Open Associated Module</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-md bg-chrome border border-hairline text-ink flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-md bg-band-blue border border-primary/20 text-primary flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-chrome border border-hairline rounded-md text-xs text-ink-nav flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                <span>Copilot is analyzing factory database records...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-chrome border-t border-hairline">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about factory finances, GST, stock..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={isLoading}
              className="flex-1 text-xs px-3 py-2 bg-canvas border border-hairline rounded-md text-ink focus:outline-none focus:border-primary disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="btn-primary p-2 rounded-md cursor-pointer disabled:opacity-40"
              title="Send to Copilot"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-[10px] text-ink-meta text-center mt-1.5">
            Secured by Codozent One tenant encryption. Runs against verified local ledger state.
          </div>
        </div>
      </div>
    </div>
  );
};

