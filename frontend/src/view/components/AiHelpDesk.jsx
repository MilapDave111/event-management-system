import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api'; 

const AiHelpDesk = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      sender: 'ai', 
      text: 'Hello! I am your organizational AI Assistant.\n\nYou can ask me about:\n* Upcoming events and schedules\n* Your current registrations\n* General academic or organizational questions\n\nHow can I help you today?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/users/chat', { message: userMsg });
      setMessages((prev) => [...prev, { sender: 'ai', text: response.data.reply }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, { sender: 'ai', text: '⚠️ Connection lost. Unable to reach the AI engine right now.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- CUSTOM MARKDOWN PARSER ---
  // Transforms Gemini's raw asterisks into beautiful, readable UI elements
  const formatAiMessage = (text) => {
    const parseBold = (str) => {
      const parts = str.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="text-slate-900 font-bold">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    return text.split('\n').map((line, i) => {
      const trimmedLine = line.trim();
      
      // Handle bullet points
      if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
        const content = trimmedLine.substring(2);
        return (
          <li key={i} className="ml-5 mb-2 list-disc marker:text-[#47B599] pl-1">
            {parseBold(content)}
          </li>
        );
      }
      
      // Handle empty lines as spacing
      if (trimmedLine === '') {
        return <div key={i} className="h-2"></div>;
      }
      
      // Handle regular paragraphs
      return (
        <p key={i} className="mb-3 last:mb-0">
          {parseBold(line)}
        </p>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#1e293b] hover:bg-[#0f172a] text-white rounded-full p-4 shadow-2xl focus:outline-none transition-all duration-300 transform hover:-translate-y-1 group flex items-center justify-center border-2 border-[#47B599]"
        >
          <svg className="w-8 h-8 text-[#47B599] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {/* Expanded Professional Chat Window */}
      {isOpen && (
        <div className="bg-white w-[90vw] md:w-[50vw] lg:w-[45vw] h-[80vh] max-h-[850px] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 border border-slate-200">
          
          {/* Header */}
          <div className="bg-[#1e293b] text-white px-6 py-4 flex justify-between items-center shadow-md z-10">
            <div className="flex items-center gap-4">
              <div className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#47B599] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#47B599]"></span>
              </div>
              <div>
                <h3 className="font-bold text-[18px] tracking-wide m-0 leading-tight">Platform AI Intelligence</h3>
                <p className="text-slate-400 text-sm m-0 font-medium mt-0.5">Events & General Knowledge Assistant</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-slate-300 hover:text-white hover:bg-slate-700 p-2 rounded-lg focus:outline-none transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-6 overflow-y-auto bg-slate-50 flex flex-col gap-6 ">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                
                {/* AI Avatar */}
                {msg.sender === 'ai' && (
                  <div className="w-10 h-10 rounded-full bg-[#47B599] flex items-center justify-center mr-3 flex-shrink-0 shadow-md mt-1">
                    <span className="text-white text-sm font-bold">AI</span>
                  </div>
                )}
                
                {/* Message Bubble */}
                <div 
                  className={`max-w-[85%] p-5 text-[15px] leading-relaxed shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-[#1e293b] text-white rounded-2xl rounded-tr-sm' 
                      : 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-sm'
                  }`}
                >
                  {/* Parse AI markdown, but leave user text alone */}
                  {msg.sender === 'ai' ? formatAiMessage(msg.text) : msg.text}
                </div>

                {/* User Avatar */}
                {msg.sender === 'user' && (
                  <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center ml-3 flex-shrink-0 shadow-sm mt-1">
                    <span className="text-slate-700 text-sm font-bold">You</span>
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading Animation */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="w-10 h-10 rounded-full bg-[#47B599] flex items-center justify-center mr-3 flex-shrink-0 shadow-md mt-1">
                  <span className="text-white text-sm font-bold">AI</span>
                </div>
                <div className="bg-white border border-slate-200 text-slate-700 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm flex space-x-2 items-center h-[55px]">
                  <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={sendMessage} className="p-5 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="relative flex items-center w-125">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message here..."
                className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-5 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-[#47B599] focus:border-transparent text-[15px] transition-all text-slate-800 placeholder-slate-400 shadow-inner"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-[#47B599] text-white p-2.5 rounded-lg hover:bg-[#3ca388] disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
            <p className="text-center text-[11px] text-slate-400 mt-3 font-semibold tracking-wide uppercase">Powered by Advanced LLM Architecture</p>
          </form>
        </div>
      )}
    </div>
  );
};

export default AiHelpDesk;