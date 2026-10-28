import React, { useState } from 'react';
import { Button, Modal, Toast } from '../components/DesignSystem';
import { AppRoute } from '../types';
import { HelpCircle, MessageCircle, ChevronDown, ChevronUp, Search, Send, PlayCircle } from 'lucide-react';

interface HelpProps {
  onNavigate: (route: AppRoute) => void;
}

export const Help: React.FC<HelpProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' as const });
  const [chatHistory, setChatHistory] = useState([
    { role: 'agent', text: 'Hello Operator. How can we support your IBOS system today?' }
  ]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const faqs = [
    { question: 'How do I log an instant sale?', answer: 'Navigate to Terminal from the top or bottom navigation bar, tap items or quick cash denominations, and select Charge.' },
    { question: 'How does offline synchronization operate?', answer: 'IBOS is an offline-first PWA. All transactions, ledger outflows, and inventory edits are stored locally in IndexedDB and automatically synchronized once network connectivity resumes.' },
    { question: 'How do I manage customer store credit?', answer: 'On the Overview dashboard, select Customer Credit under Operational Actions to view active balances and record settlements.' },
    { question: 'How do I generate tax statements for SARS?', answer: 'Navigate to Ledger, tap Export Statement, and download a compliant PDF Turnover Tax reconciliation document.' },
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFaq = (index: number) => {
    if (openFaq === index) setOpenFaq(null);
    else setOpenFaq(index);
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    setChatHistory([...chatHistory, { role: 'user', text: chatMessage }]);
    setChatMessage('');
    
    setTimeout(() => {
      setChatHistory(prev => [...prev, { role: 'agent', text: 'Thank you for your inquiry. A specialist from the IBOS trader support desk will respond shortly.' }]);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <Toast show={toast.show} message={toast.message} type={toast.type} />
      
      {/* Header */}
      <div className="pb-2 border-b border-neutral-200/80">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
          Support & Documentation
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Knowledge base, operational guides and direct operator support desk
        </p>
      </div>

      {/* Support Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={15} />
        <input 
          type="text" 
          placeholder="Search operator guides, offline sync, or terminal FAQs..." 
          className="w-full bg-white border border-neutral-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 shadow-card"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Direct Operator Help Desk Strip */}
      <div 
        onClick={() => setShowChat(true)}
        className="bg-white border border-neutral-200/80 hover:border-neutral-900 rounded-2xl p-4 flex items-center justify-between shadow-card cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-800">
            <MessageCircle size={18} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-neutral-900">Operator Desk Live Chat</h3>
            <p className="text-[11px] text-neutral-500">Live technician assistance · Avg response &lt; 3 mins</p>
          </div>
        </div>
        <Button size="sm" variant="secondary">
          Open Chat
        </Button>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Operational Knowledge Base
          </h3>
          <span className="text-xs font-mono text-neutral-400">{filteredFaqs.length} Articles</span>
        </div>

        <div className="divide-y divide-neutral-100">
          {filteredFaqs.map((faq, index) => (
            <div key={index} className="py-3">
              <button 
                onClick={() => toggleFaq(index)}
                className="w-full flex justify-between items-center text-left gap-4"
              >
                <span className="text-xs font-semibold text-neutral-900">{faq.question}</span>
                <span className="text-neutral-400 shrink-0">
                  {openFaq === index ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
              </button>
              {openFaq === index && (
                <p className="text-xs text-neutral-600 mt-2 leading-relaxed bg-neutral-50 p-3 rounded-xl border border-neutral-200/70">
                  {faq.answer}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* LIVE CHAT MODAL */}
      <Modal isOpen={showChat} onClose={() => setShowChat(false)} title="Operator Support Desk">
        <div className="space-y-4">
          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200/80 max-h-60 overflow-y-auto space-y-2 text-xs">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-2.5 rounded-xl max-w-[80%] ${
                  msg.role === 'user' ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 text-neutral-800'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Type message to desk..." 
              className="flex-1 bg-white border border-neutral-200 rounded-xl px-3 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button size="sm" variant="primary" onClick={handleSendMessage}>
              <Send size={13} />
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
