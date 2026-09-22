import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ParkingCopilotService, AssistantMessage, AssistantAction } from '../../services/assistant/ParkingCopilotService';
import { 
  X, 
  Sparkles, 
  Send, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Compass, 
  Zap, 
  TrendingUp, 
  RotateCcw 
} from 'lucide-react';

export const CopilotDrawer: React.FC = () => {
  const { 
    isCopilotOpen, 
    setCopilotOpen, 
    activeSession, 
    parkingLots, 
    openBookingModal, 
    setSelectedLot, 
    navigate, 
    setFindMyCarOpen, 
    extendActiveSession, 
    showToast 
  } = useApp();

  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `Hello! I'm your **ParkPredict Copilot**.\n\nI monitor real-time parking velocity, availability forecasts, and facility rates across Chennai. How can I assist your trip today?`,
      timestamp: 'Just now',
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isCopilotOpen) {
      scrollToBottom();
    }
  }, [messages, isCopilotOpen]);

  if (!isCopilotOpen) return null;

  const handleSend = (textToSend?: string) => {
    const q = textToSend || inputText;
    if (!q.trim()) return;

    const userMsg: AssistantMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const response = ParkingCopilotService.processQuery(q, activeSession);
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
    }, 450);
  };

  const handleActionClick = (action: AssistantAction) => {
    if (action.actionType === 'reserve') {
      const lot = parkingLots.find((l) => l.id === action.payload) || parkingLots[0];
      setCopilotOpen(false);
      openBookingModal(lot);
    } else if (action.actionType === 'view_lot') {
      if (action.payload) {
        const lot = parkingLots.find((l) => l.id === action.payload);
        if (lot) setSelectedLot(lot);
      }
      setCopilotOpen(false);
      navigate('find');
    } else if (action.actionType === 'open_predictions') {
      setCopilotOpen(false);
      navigate('predictions');
    } else if (action.actionType === 'open_bookings') {
      setCopilotOpen(false);
      navigate('bookings');
    } else if (action.actionType === 'find_car') {
      setCopilotOpen(false);
      setFindMyCarOpen(true);
    } else if (action.actionType === 'extend_session') {
      const mins = action.payload || 30;
      extendActiveSession(mins, mins === 15 ? 15 : mins === 30 ? 25 : 45);
    }
  };

  const suggestionPills = [
    'Cheap parking near VR Mall for 3 hours',
    'Where did I park my car?',
    'Extend my active parking session',
    'Show EV chargers with high availability',
    'Best time to park at Chennai Airport',
    'What is the cancellation policy?',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#111C2D] h-full shadow-elevated border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-250">
        
        {/* Copilot Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brandTeal to-blue-500 flex items-center justify-center text-white shadow-glow-teal">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                  ParkPredict Copilot
                </h3>
                <span className="text-[10px] bg-brandTeal/10 text-brandTeal font-bold px-1.5 py-0.5 rounded">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Context-aware mobility assistance
              </p>
            </div>
          </div>

          <button
            onClick={() => setCopilotOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-brandTeal text-white shadow-glow-teal font-medium rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 rounded-tl-none space-y-2'
                }`}
              >
                <div className="whitespace-pre-line">
                  {msg.text.split('**').map((part, i) =>
                    i % 2 === 1 ? <strong key={i} className="font-bold">{part}</strong> : part
                  )}
                </div>

                {/* Contextual Action Buttons */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap gap-1.5">
                    {msg.actions.map((act, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleActionClick(act)}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-brandTeal/40 text-brandTeal dark:text-teal-300 hover:bg-brandTeal hover:text-white dark:hover:bg-brandTeal dark:hover:text-white text-xs font-bold transition-all shadow-subtle flex items-center gap-1"
                      >
                        <span>{act.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-400 mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-1.5 text-slate-400 text-xs p-2">
              <span className="w-2 h-2 rounded-full bg-brandTeal animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-brandTeal animate-bounce delay-100" />
              <span className="w-2 h-2 rounded-full bg-brandTeal animate-bounce delay-200" />
              <span className="text-[11px] ml-1">Analyzing real-time parking velocity...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-2 px-1">
            Suggested Prompts
          </span>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {suggestionPills.map((pill, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(pill)}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-brandTeal hover:text-brandTeal transition-all text-left"
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2D]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything about parking, predictions, rates..."
              className="flex-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandTeal"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-2xl bg-brandTeal hover:bg-brandTeal-hover disabled:opacity-40 text-white transition-all shadow-glow-teal"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
