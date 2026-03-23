'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send } from 'lucide-react';
import { markOrderChatAsRead } from '@/lib/chat-utils';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
    role: string;
  };
}

export default function OrderChat({ orderId, currentUserId, currentUserRole }: { orderId: string, currentUserId: string, currentUserRole: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('order_messages')
        .select('*, profiles(first_name, last_name, role)')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
      setLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel(`order_messages_${orderId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'order_messages',
        filter: `order_id=eq.${orderId}`
      }, (payload: any) => {
        // Fetch the new message with profile data
        supabase
          .from('order_messages')
          .select('*, profiles(first_name, last_name, role)')
          .eq('id', payload.new.id)
          .single()
          .then(({ data }: { data: any }) => {
            if (data) {
              setMessages(prev => [...prev, data]);
            }
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Mark as read whenever messages change (or on mount)
    if (messages.length > 0) {
      markOrderChatAsRead(orderId);
    }
  }, [messages, orderId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase
      .from('order_messages')
      .insert({
        order_id: orderId,
        sender_id: currentUserId,
        content: content
      });

    if (error) {
      console.error('Error sending message:', error);
      // Revert input if failed
      setNewMessage(content);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 flex flex-col h-[500px]">
      <div className="p-4 border-b border-zinc-200 bg-zinc-50 rounded-t-2xl">
        <h3 className="font-bold text-zinc-900">Poruke</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center text-zinc-500 py-4">Učitavanje poruka...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-zinc-500 py-4">Nema poruka. Započnite razgovor!</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            const isAdmin = msg.profiles?.role === 'admin';
            
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="text-xs text-zinc-500 mb-1 px-1">
                  {isMe ? 'Vi' : (isAdmin ? 'Admin' : `${msg.profiles?.first_name} ${msg.profiles?.last_name}`)}
                  {' • '}
                  {new Date(msg.created_at).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div 
                  className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                    isMe 
                      ? 'bg-indigo-600 text-white rounded-tr-sm' 
                      : isAdmin 
                        ? 'bg-zinc-800 text-white rounded-tl-sm'
                        : 'bg-zinc-100 text-zinc-900 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-zinc-200">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Napišite poruku..."
            className="flex-1 px-4 py-2 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
