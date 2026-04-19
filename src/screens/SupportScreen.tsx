import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, MessageCircle, Send, CheckCircle, Clock, Plus, HelpCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function SupportScreen({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  
  if (activeTicket) {
    return (
      <TicketChat 
        ticket={activeTicket} 
        onBack={() => setActiveTicket(null)} 
        user={user!} 
        isRTL={isRTL} 
      />
    );
  }

  return (
    <TicketsList 
      onBack={onBack} 
      user={user!} 
      isRTL={isRTL} 
      onSelectTicket={setActiveTicket} 
    />
  );
}

function TicketsList({ onBack, user, isRTL, onSelectTicket }: any) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, [user.id]);

  const fetchTickets = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (!error && data) setTickets(data);
    setIsLoading(false);
  };

  const createTicket = async () => {
    if (!newSubject.trim()) return;
    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject: newSubject,
        status: 'open'
      })
      .select()
      .single();
      
    if (!error && data) {
      setNewSubject('');
      setIsCreating(false);
      onSelectTicket(data);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0B141A] text-white z-[100] flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* HEADER */}
      <div className="bg-[#202C33] flex items-center justify-between p-4 shadow-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -mx-2 hover:bg-white/10 rounded-full transition">
            {isRTL ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
          </button>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <HelpCircle size={22} className="text-[#00A884]" />
            الدعم الفني والمساعدة
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-400 py-10 font-medium">جاري تحميل التذاكر...</div>
        ) : tickets.length === 0 ? (
          <div className="text-center text-gray-400 py-20 flex flex-col items-center">
            <MessageCircle size={48} className="opacity-20 mb-4" />
            <p>لا توجد تذاكر دعم سابقة</p>
          </div>
        ) : (
          tickets.map(ticket => (
            <button 
              key={ticket.id}
              onClick={() => onSelectTicket(ticket)}
              className="w-full bg-[#202C33] p-4 rounded-xl flex items-center justify-between active:scale-95 transition border border-white/5"
            >
              <div className="flex items-start gap-4 text-start">
                <div className={`p-3 rounded-full ${ticket.status === 'open' ? 'bg-[#005C4B]' : 'bg-gray-700'}`}>
                   {ticket.status === 'open' ? <Clock size={20} className="text-green-400" /> : <CheckCircle size={20} className="text-gray-300" />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-100 text-lg mb-1">{ticket.subject}</h3>
                  <div className="text-sm text-gray-400 flex items-center gap-2">
                    {ticket.status === 'open' ? 'تذكرة مفتوحة' : 'مغلقة'}
                    <span>•</span>
                    {new Date(ticket.updated_at || ticket.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="p-4 bg-[#202C33] border-t border-white/5 pb-8" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        {isCreating ? (
          <div className="flex gap-2">
             <input 
               autoFocus
               placeholder="ما هي مشكلتك باختصار؟"
               className="flex-1 bg-[#2A3942] text-white rounded-full px-5 py-3 focus:outline-none placeholder-gray-400"
               value={newSubject}
               onChange={(e) => setNewSubject(e.target.value)}
             />
             <button onClick={createTicket} className="bg-[#00A884] p-3 rounded-full text-white">
                <Send size={24} className={isRTL ? "rotate-180" : ""} />
             </button>
             <button onClick={() => setIsCreating(false)} className="bg-gray-700 p-3 rounded-full text-white">
                ✖
             </button>
          </div>
        ) : (
          <button 
             onClick={() => setIsCreating(true)}
             className="w-full bg-[#00A884] text-[#111B21] font-bold text-lg p-4 rounded-xl flex items-center justify-center gap-2"
          >
             <Plus size={24} /> فتح تذكرة جديدة
          </button>
        )}
      </div>
    </div>
  );
}

function TicketChat({ ticket, onBack, user, isRTL }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to REAL-TIME
    const sub = supabase.channel(`ticket_${ticket.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${ticket.id}` }, (payload) => {
         setMessages(prev => [...prev, payload.new]);
         scrollToBottom();
      })
      .subscribe();
      
    return () => { supabase.removeChannel(sub); };
  }, [ticket.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const txt = newMessage;
    setNewMessage(''); // optimistic clear
    
    // 1. Insert message
    await supabase.from('ticket_messages').insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        content: txt,
        is_admin: false
    });
  };

  return (
    <div className="fixed inset-0 bg-[#0B141A] text-white z-[100] flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* WHATSAPP DARK HEADER */}
      <div className="bg-[#202C33] flex items-center justify-between p-4 shadow-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -mx-2 hover:bg-white/10 rounded-full transition">
            {isRTL ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
          </button>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-[#00A884] flex items-center justify-center text-white">
                <HelpCircle size={20} />
             </div>
             <div>
                <h2 className="font-bold text-gray-100 line-clamp-1">{ticket.subject}</h2>
                <div className="text-xs text-gray-400">الدعم الفني</div>
             </div>
          </div>
        </div>
      </div>

      {/* WHATSAPP CHAT AREA */}
      <div 
         className="flex-1 overflow-y-auto p-4 space-y-3"
         style={{
            backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundBlendMode: 'overlay',
            backgroundColor: '#0B141A',
            opacity: 0.95
         }}
      >
         <div className="text-center my-4">
           <span className="bg-[#182229] text-gray-300 text-xs py-1 px-3 rounded-lg font-medium shadow">
             تم إنشاء التذكرة - سيتم الرد عليك قريباً
           </span>
         </div>
         
         {messages.map(msg => {
            // Customer messages go to left in RTL visually if standard was requested, but standard arabic whatsapp says user message is on the Right.
            // Requirement prompt: "رسائل العميل بجهة اليسار بلون واضح، ورسائل الإدارة is_admin === true بجهة اليمين بلون مختلف"
            // I will forcefully align User: Left, Admin: Right as requested.
            const isUser = !msg.is_admin;
            const alignmentClass = isUser ? 'self-end bg-[#005C4B]' : 'self-start bg-[#202C33]';
            const wrapClass = isUser ? 'justify-end' : 'justify-start';

            return (
              <div key={msg.id} className={`flex w-full ${wrapClass}`}>
                 <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm relative ${alignmentClass}`}>
                    <p className="text-sm text-gray-100 leading-relaxed mb-1" style={{ wordBreak: 'break-word' }}>
                       {msg.content}
                    </p>
                    <div className="text-[10px] text-gray-400 text-end w-full flex justify-end items-center gap-1">
                       {new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                       {isUser && <CheckCircle size={10} className="text-[#53bdeb] ml-1" />}
                    </div>
                 </div>
              </div>
            );
         })}
         <div ref={bottomRef} className="h-2" />
      </div>

      {/* MESSAGE INPUT */}
      <div className="bg-[#202C33] p-3 flex items-center gap-2" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
         <input 
           value={newMessage}
           onChange={(e) => setNewMessage(e.target.value)}
           onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
           placeholder="اكتب رسالة..."
           className="flex-1 bg-[#2A3942] text-white rounded-full px-5 py-3 text-sm focus:outline-none placeholder-gray-400"
         />
         <button 
           onClick={sendMessage}
           disabled={!newMessage.trim()}
           className="w-12 h-12 bg-[#00A884] rounded-full flex items-center justify-center text-[#111B21] disabled:opacity-50 transition transform active:scale-95"
         >
           <Send size={20} className={isRTL ? "rotate-180 transform -translate-x-0.5" : "transform translate-x-0.5"} />
         </button>
      </div>
    </div>
  );
}
