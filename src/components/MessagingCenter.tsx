import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MessageSquare, Users, Hash, X, Paperclip, Smile, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, limit, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface Message {
  id: string;
  channelId: string;
  senderEmail: string;
  senderName?: string;
  content: string;
  createdAt: any;
  type: 'text' | 'system';
}

interface Channel {
  id: string;
  name: string;
  nameEn?: string;
  type: 'office' | 'group' | 'direct';
  members: string[];
  lastMessage?: string;
  lastMessageAt?: any;
  unreadCount?: number;
}

export const MessagingCenter: React.FC<{ language: 'en' | 'ne'; offices: Array<{ name: string }>; isAdmin?: boolean }> = ({ language, offices = [], isAdmin = false }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!isAdmin) {
    return null;
  }
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showChannelList, setShowChannelList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userEmail = user?.email || '';
  const userOffice = (user as any)?.office || '';

  useEffect(() => {
    if (!userEmail) return;

    const q = query(
      collection(db, 'channels'),
      where('members', 'array-contains', userEmail),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const channelList: Channel[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Channel));
      setChannels(channelList);
      if (!activeChannel && channelList.length > 0) {
        setActiveChannel(channelList[0].id);
      }
    }, (err) => {
      console.error('Channels listener failed:', err);
    });

    return () => unsubscribe();
  }, [userEmail, activeChannel]);

  useEffect(() => {
    if (!activeChannel) return;

    const q = query(
      collection(db, 'messages', activeChannel, 'items'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      setMessages(msgs.reverse());
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (err) => {
      console.error('Messages listener failed:', err);
    });

    return () => unsubscribe();
  }, [activeChannel]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChannel) return;
    try {
      await addDoc(collection(db, 'messages', activeChannel, 'items'), {
        channelId: activeChannel,
        senderEmail: userEmail,
        senderName: user?.displayName || userEmail,
        content: newMessage.trim(),
        createdAt: serverTimestamp(),
        type: 'text',
      });

      await updateDoc(doc(db, 'channels', activeChannel), {
        lastMessage: newMessage.trim(),
        lastMessageAt: serverTimestamp(),
      });

      setNewMessage('');
    } catch (err: any) {
      console.error('Failed to send message:', err);
    }
  };

  const filteredChannels = channels.filter(ch =>
    ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ch.nameEn?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeChannelData = channels.find(c => c.id === activeChannel);

  return (
    <div className="h-[calc(100vh-200px)] min-h-[500px] flex rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
      {/* Sidebar */}
      <div className={`${showChannelList ? 'w-64' : 'w-0'} border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 overflow-hidden`}>
        <div className="p-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={16} className="text-indigo-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
              {language === 'en' ? 'Channels' : 'च्यानलहरू'}
            </h3>
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'en' ? 'Search...' : 'खोज्नुहोस्...'}
              className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filteredChannels.length === 0 && (
            <p className="text-[10px] text-slate-400 text-center py-4">
              {language === 'en' ? 'No channels yet' : 'अहिले सम्म कुनै च्यानल छैन'}
            </p>
          )}
          {filteredChannels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => { setActiveChannel(ch.id); setShowChannelList(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left ${
                activeChannel === ch.id
                  ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-200'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                ch.type === 'office' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' :
                ch.type === 'group' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' :
                'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
              }`}>
                {ch.type === 'office' ? <Users size={14} /> : <Hash size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate">{language === 'en' ? ch.nameEn || ch.name : ch.name}</div>
                {ch.lastMessage && (
                  <div className="text-[10px] text-slate-400 truncate">{ch.lastMessage}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeChannelData ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowChannelList(true)}
                className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <MessageSquare size={16} />
              </button>
              <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                activeChannelData.type === 'office' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' :
                activeChannelData.type === 'group' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' :
                'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
              }`}>
                {activeChannelData.type === 'office' ? <Users size={14} /> : <Hash size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
                  {language === 'en' ? activeChannelData.nameEn || activeChannelData.name : activeChannelData.name}
                </h3>
                <p className="text-[10px] text-slate-400">
                  {activeChannelData.members.length} {language === 'en' ? 'members' : 'सदस्यहरू'}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-[11px] text-slate-400">
                    {language === 'en' ? 'No messages yet. Start the conversation!' : 'अहिले सम्म कुनै सन्देश छैन। संवाद सुरु गर्नुहोस्!'}
                  </p>
                </div>
              )}
              {messages.map((msg) => {
                const isOwn = msg.senderEmail === userEmail;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                      isOwn
                        ? 'bg-indigo-600 text-white rounded-br-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-md'
                    }`}>
                      {!isOwn && (
                        <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                          {msg.senderName || msg.senderEmail}
                        </div>
                      )}
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <div className={`text-[9px] mt-1 ${isOwn ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  placeholder={language === 'en' ? 'Type a message...' : 'सन्देश टाइप गर्नुहोस्...'}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <MessageSquare size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-bold">
                {language === 'en' ? 'Select a channel to start messaging' : 'मेसेजिङ सुरु गर्न च्यानल छान्नुहोस्'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
