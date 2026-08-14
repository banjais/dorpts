import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MessageSquare, Users, Hash, X, Plus, CheckCircle, XCircle, Clock, LogOut, Trash2, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, limit, doc, updateDoc, getDoc, getDocs, deleteDoc } from 'firebase/firestore';
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
  createdBy?: string;
  lastMessage?: string;
  lastMessageAt?: any;
  unreadCount?: number;
  joinCount?: number;
  leaveCount?: number;
}

interface JoinRequest {
  id: string;
  channelId: string;
  userEmail: string;
  userName?: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: any;
  reviewedBy?: string;
  reviewedAt?: any;
}

type SidebarSection = 'my-channels' | 'available' | 'requests';

export const MessagingCenter: React.FC<{ language: 'en' | 'ne'; offices: Array<{ name: string }>; isAdmin?: boolean; users?: Array<{ email: string; displayName?: string }>; userRole?: 'superadmin' | 'admin' | 'data_updater' | 'viewer' | null }> = ({ language, offices = [], isAdmin = false, users = [], userRole }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [myChannels, setMyChannels] = useState<Channel[]>([]);
  const [availableChannels, setAvailableChannels] = useState<Channel[]>([]);
  const [showChannelList, setShowChannelList] = useState(true);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'office' | 'group' | 'direct'>('group');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<Array<{ email: string; displayName?: string }>>(users);
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [sidebarSection, setSidebarSection] = useState<SidebarSection>('my-channels');
  const [showMembers, setShowMembers] = useState(false);
  const [messageSearch, setMessageSearch] = useState('');
  const [channelNotice, setChannelNotice] = useState<{ text: string; type: 'join' | 'leave' } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userEmail = user?.email || '';
  const currentUserRole = userRole || (isAdmin ? 'admin' : 'viewer');

  useEffect(() => {
    if (users.length > 0) {
      setAllUsers(users);
      return;
    }
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'admins'));
        const list = snap.docs.map(d => ({ email: d.id, ...d.data() } as any));
        setAllUsers(list);
      } catch (err) {
        console.error('Failed to fetch users for messaging:', err);
      }
    };
    fetchUsers();
  }, [users]);

  useEffect(() => {
    if (!userEmail) return;
    const q = query(collection(db, 'channels'), orderBy('lastMessageAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const channelList: Channel[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Channel));
      setAllChannels(channelList);
      setMyChannels(channelList.filter(ch => ch.members.includes(userEmail)));
      setAvailableChannels(channelList.filter(ch => !ch.members.includes(userEmail)));
      if (!activeChannel && channelList.some(ch => ch.members.includes(userEmail))) {
        const first = channelList.find(ch => ch.members.includes(userEmail));
        if (first) setActiveChannel(first.id);
      }
    }, (err) => {
      console.error('Channels listener failed:', err);
    });
    return () => unsubscribe();
  }, [userEmail, activeChannel]);

  useEffect(() => {
    if (!userEmail) return;
    const q = query(
      collection(db, 'channel_requests'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs: JoinRequest[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as JoinRequest));
      setRequests(reqs);
    }, (err) => {
      console.error('Requests listener failed:', err);
    });
    return () => unsubscribe();
  }, [userEmail]);

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

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    try {
      let membersList = [...selectedMembers];
      if (!membersList.includes(userEmail)) membersList.push(userEmail);

      if (currentUserRole === 'superadmin') {
        const allAdmins = allUsers.map(u => u.email);
        for (const adminEmail of allAdmins) {
          if (!membersList.includes(adminEmail)) {
            membersList.push(adminEmail);
          }
        }
      }

      const channelRef = await addDoc(collection(db, 'channels'), {
        name: newChannelName.trim(),
        nameEn: newChannelName.trim(),
        type: newChannelType,
        members: membersList,
        createdBy: userEmail,
        lastMessage: '',
        lastMessageAt: serverTimestamp(),
        unreadCount: 0,
        joinCount: 0,
        leaveCount: 0,
      });

      await addDoc(collection(db, 'messages', channelRef.id, 'items'), {
        channelId: channelRef.id,
        senderEmail: 'system',
        senderName: 'System',
        content: language === 'en' ? `Channel created by ${userEmail}` : `च्यानल ${userEmail} द्वारा सिर्जना गरियो`,
        createdAt: serverTimestamp(),
        type: 'system',
      });

      setNewChannelName('');
      setSelectedMembers([]);
      setNewChannelType('group');
      setShowCreateChannel(false);
    } catch (err: any) {
      console.error('Failed to create channel:', err);
    }
  };

  const handleJoinChannel = async (channelId: string) => {
    try {
      const channelRef = doc(db, 'channels', channelId);
      const channelSnap = await getDoc(channelRef);
      if (channelSnap.exists()) {
        const channelData = channelSnap.data() as Channel;
        if (!channelData.members.includes(userEmail)) {
          const newMembers = [...channelData.members, userEmail];
          await updateDoc(channelRef, {
            members: newMembers,
            joinCount: (channelData.joinCount || 0) + 1,
          });
          if (activeChannel === channelId) {
            setChannelNotice({ text: `${userEmail} joined`, type: 'join' });
            setTimeout(() => setChannelNotice(null), 3000);
          }
        }
      }

      await addDoc(collection(db, 'channel_requests'), {
        channelId,
        userEmail,
        userName: user?.displayName || userEmail,
        status: 'approved',
        createdAt: serverTimestamp(),
        reviewedBy: 'auto',
        reviewedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.error('Failed to join channel:', err);
    }
  };

  const handleLeaveChannel = async (channelId: string) => {
    if (!window.confirm(language === 'en' ? 'Leave this channel?' : 'यो च्यानलबाट बाहिर हुनुहोस्?')) return;
    try {
      const channelRef = doc(db, 'channels', channelId);
      const channelSnap = await getDoc(channelRef);
      if (channelSnap.exists()) {
        const channelData = channelSnap.data() as Channel;
        if (channelData.members.includes(userEmail) && channelData.createdBy !== userEmail) {
          const newMembers = channelData.members.filter((m: string) => m !== userEmail);
          await updateDoc(channelRef, {
            members: newMembers,
            leaveCount: (channelData.leaveCount || 0) + 1,
          });

          if (activeChannel === channelId) {
            setChannelNotice({ text: `${userEmail} left`, type: 'leave' });
            setTimeout(() => setChannelNotice(null), 3000);
          }

          if (activeChannel === channelId) {
            setActiveChannel(null);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to leave channel:', err);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!window.confirm(language === 'en' ? 'Delete this channel and all its messages?' : 'यो च्यानल र सबै सन्देशहरू मेट्नुहोस्?')) return;
    try {
      const messagesRef = collection(db, 'messages', channelId, 'items');
      const msgsSnap = await getDocs(messagesRef);
      const batch = [];
      for (const docSnap of msgsSnap.docs) {
        batch.push(deleteDoc(docSnap.ref));
      }
      const reqsSnap = await getDocs(query(collection(db, 'channel_requests'), where('channelId', '==', channelId)));
      for (const docSnap of reqsSnap.docs) {
        batch.push(deleteDoc(docSnap.ref));
      }
      batch.push(deleteDoc(doc(db, 'channels', channelId)));
      await Promise.all(batch);
      if (activeChannel === channelId) {
        setActiveChannel(null);
      }
    } catch (err: any) {
      console.error('Failed to delete channel:', err);
    }
  };

  const handleApproveRequest = async (requestId: string, channelId: string, requesterEmail: string) => {
    try {
      const channelRef = doc(db, 'channels', channelId);
      const channelSnap = await getDoc(channelRef);
      if (channelSnap.exists()) {
        const channelData = channelSnap.data() as Channel;
        if (!channelData.members.includes(requesterEmail)) {
          await updateDoc(channelRef, {
            members: [...channelData.members, requesterEmail],
            joinCount: (channelData.joinCount || 0) + 1,
          });
        }
      }
      await updateDoc(doc(db, 'channel_requests', requestId), {
        status: 'approved',
        reviewedBy: userEmail,
        reviewedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.error('Failed to approve request:', err);
    }
  };

  const handleDenyRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'channel_requests', requestId), {
        status: 'denied',
        reviewedBy: userEmail,
        reviewedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.error('Failed to deny request:', err);
    }
  };

  const isChannelAdmin = (channel: Channel) => {
    return channel.createdBy === userEmail || currentUserRole === 'superadmin';
  };

  const pendingRequestsForUser = requests.filter(req => {
    const channel = allChannels.find(ch => ch.id === req.channelId);
    return channel && isChannelAdmin(channel);
  });

  const activeChannelData = myChannels.find(c => c.id === activeChannel) || availableChannels.find(c => c.id === activeChannel);

  const getChannelActivity = (channel: Channel) => {
    return {
      joins: channel.joinCount || 0,
      leaves: channel.leaveCount || 0,
    };
  };

  return (
    <div className="h-full flex flex-col md:flex-row rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
      {/* Sidebar */}
      <div className={`${showChannelList ? 'w-64' : 'w-0'} md:w-64 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 overflow-hidden`}>
        <div className="p-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={16} className="text-indigo-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
              {language === 'en' ? 'Messaging' : 'मेसेजिङ'}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSidebarSection('my-channels')}
              className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-colors ${
                sidebarSection === 'my-channels'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {language === 'en' ? 'My Channels' : 'मेरो च्यानलहरू'}
            </button>
            <button
              onClick={() => setSidebarSection('available')}
              className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-colors ${
                sidebarSection === 'available'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {language === 'en' ? 'Discover' : 'अन्वेषण'}
            </button>
          </div>
          {currentUserRole === 'superadmin' && (
            <button
              onClick={() => setSidebarSection('requests')}
              className={`w-full mt-1.5 py-1.5 text-[10px] font-black rounded-lg transition-colors flex items-center justify-center gap-1 ${
                sidebarSection === 'requests'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20'
              }`}
            >
              <Clock size={10} />
              {language === 'en' ? `Requests (${pendingRequestsForUser.length})` : `अनुरोधहरू (${pendingRequestsForUser.length})`}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {sidebarSection === 'my-channels' && (
            <div className="p-2 space-y-1">
              {myChannels.length === 0 && (
                <p className="text-[10px] text-slate-400 text-center py-4">
                  {language === 'en' ? 'No channels yet' : 'अहिले सम्म कुनै च्यानल छैन'}
                </p>
              )}
              {myChannels.map((ch) => {
                const isCreator = ch.createdBy === userEmail;
                const activity = getChannelActivity(ch);
                return (
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
                      {currentUserRole === 'superadmin' && (activity.joins > 0 || activity.leaves > 0) && (
                        <div className="text-[9px] text-slate-400 flex items-center gap-2">
                          {activity.joins > 0 && <span className="text-emerald-600">+{activity.joins} joined</span>}
                          {activity.leaves > 0 && <span className="text-rose-600">-{activity.leaves} left</span>}
                        </div>
                      )}
                    </div>
                    {(isCreator || currentUserRole === 'superadmin') ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteChannel(ch.id); }}
                        className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        title={language === 'en' ? 'Delete channel' : 'च्यानल हटाउनुहोस्'}
                      >
                        <Trash2 size={12} />
                      </button>
                    ) : (
                      !isCreator && currentUserRole !== 'superadmin' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleLeaveChannel(ch.id); }}
                          className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                          title={language === 'en' ? 'Leave channel' : 'च्यानलबाट बाहिर हुनुहोस्'}
                        >
                          <LogOut size={12} />
                        </button>
                      )
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {sidebarSection === 'available' && (
            <div className="p-2 space-y-1">
              {availableChannels.length === 0 && (
                <p className="text-[10px] text-slate-400 text-center py-4">
                  {language === 'en' ? 'No available channels' : 'कुनै उपलब्ध च्यानल छैन'}
                </p>
              )}
              {availableChannels.map((ch) => {
                return (
                  <div
                    key={ch.id}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
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
                      <div className="text-[10px] text-slate-400">
                        {ch.members.length} {language === 'en' ? 'members' : 'सदस्यहरू'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoinChannel(ch.id)}
                      className="text-[9px] font-black bg-indigo-600 text-white px-2 py-1 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      {language === 'en' ? 'Join' : 'सामेल हुनुहोस्'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {sidebarSection === 'requests' && (
            <div className="p-2 space-y-1">
              {pendingRequestsForUser.length === 0 && (
                <p className="text-[10px] text-slate-400 text-center py-4">
                  {language === 'en' ? 'No pending requests' : 'कुनै पेन्डिङ अनुरोध छैन'}
                </p>
              )}
              {pendingRequestsForUser.map((req) => {
                const channel = allChannels.find(ch => ch.id === req.channelId);
                if (!channel) return null;
                return (
                  <div key={req.id} className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${
                        channel.type === 'office' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' :
                        channel.type === 'group' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' :
                        'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      }`}>
                        <Hash size={10} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold truncate">{channel.name}</div>
                        <div className="text-[9px] text-slate-400 truncate">{req.userEmail}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleApproveRequest(req.id, req.channelId, req.userEmail)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-600 text-white text-[9px] font-black rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        <CheckCircle size={10} /> {language === 'en' ? 'Approve' : 'स्वीकृत'}
                      </button>
                      <button
                        onClick={() => handleDenyRequest(req.id)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-rose-600 text-white text-[9px] font-black rounded-lg hover:bg-rose-700 transition-colors"
                      >
                        <XCircle size={10} /> {language === 'en' ? 'Deny' : 'अस्वीकृत'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
          {(currentUserRole === 'superadmin' || currentUserRole === 'admin') && (
            !showCreateChannel ? (
              <button
                onClick={() => setShowCreateChannel(true)}
                className="w-full mt-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus size={12} />
                {language === 'en' ? 'New Channel' : 'नयाँ च्यानल'}
              </button>
            ) : (
              <div className="mt-1 space-y-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder={language === 'en' ? 'Channel name' : 'च्यानलको नाम'}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
                <select
                  value={newChannelType}
                  onChange={(e) => setNewChannelType(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                >
                  <option value="group">{language === 'en' ? 'Group' : 'समूह'}</option>
                  <option value="office">{language === 'en' ? 'Office' : 'कार्यालय'}</option>
                  <option value="direct">{language === 'en' ? 'Direct' : 'प्रत्यक्ष'}</option>
                </select>
                {currentUserRole === 'superadmin' && (
                  <p className="text-[9px] text-slate-400">
                    {language === 'en' ? 'All admins will be added automatically' : 'सबै प्रशासकहरू स्वतः थपिनेछन्'}
                  </p>
                )}
                {currentUserRole === 'admin' && (
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400">
                      {language === 'en' ? 'Invite admins or superadmin' : 'प्रशासक वा सुपरएडमिनलाई आमंत्रण गर्नुहोस्'}
                    </p>
                    <select
                      multiple
                      value={selectedMembers}
                      onChange={(e) => {
                        const values = Array.from((e.target as HTMLSelectElement).selectedOptions).map(opt => opt.value);
                        setSelectedMembers(values);
                      }}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs h-24 custom-scrollbar"
                    >
                      {allUsers.filter(u => u.email !== userEmail).map((u) => (
                        <option key={u.email} value={u.email} className="py-1">
                          {u.displayName || u.email} {u.email === userEmail ? `(${language === 'en' ? 'you' : 'तपाईं'})` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-[9px] text-slate-400">
                      {language === 'en' ? 'Hold Ctrl/Cmd to select multiple' : 'अन्य सदस्यहरू छान्न Ctrl/Cmd थिच्नुहोस्'}
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCreateChannel}
                    disabled={!newChannelName.trim()}
                    className="flex-1 py-1.5 bg-emerald-600 text-white text-[10px] font-black rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {language === 'en' ? 'Create' : 'सिर्जना'}
                  </button>
                  <button
                    onClick={() => { setShowCreateChannel(false); setNewChannelName(''); setSelectedMembers([]); }}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-black rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    {language === 'en' ? 'Cancel' : 'रद्द'}
                  </button>
                </div>
              </div>
            )
          )}
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
                <div className="relative">
                  <button 
                    onClick={() => setShowMembers(!showMembers)}
                    className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {activeChannelData.members.length} {language === 'en' ? 'members' : 'सदस्यहरू'}
                    {currentUserRole === 'superadmin' && (activeChannelData.joinCount || activeChannelData.leaveCount) && (
                      <span className="ml-2 text-slate-400">
                        ({language === 'en' ? 'joined' : 'सामेल'}: {activeChannelData.joinCount || 0}, {language === 'en' ? 'left' : 'बाहिर'}: {activeChannelData.leaveCount || 0})
                      </span>
                    )}
                  </button>
                  {channelNotice && activeChannel === activeChannelData.id && (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 z-20 min-w-[180px]">
                      <div className={`text-[10px] font-black px-2 py-1 rounded-lg ${
                        channelNotice.type === 'join' 
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' 
                          : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300'
                      }`}>
                        {channelNotice.text}
                      </div>
                    </div>
                  )}
                  {showMembers && (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 z-20 min-w-[200px]">
                      <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                        {language === 'en' ? 'Members' : 'सदस्यहरू'}
                      </div>
                      {activeChannelData.members.map((memberEmail, idx) => (
                        <div key={idx} className="text-[11px] px-2 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 truncate">
                          {memberEmail}
                          {memberEmail === userEmail && <span className="text-[9px] text-slate-400 ml-1">({language === 'en' ? 'you' : 'तपाईं'})</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setShowMembers(!showMembers)}
                  className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                >
                  <Users size={16} />
                </button>
              </div>
              <button
                onClick={() => setMessageSearch(!messageSearch)}
                className={`p-1.5 rounded-lg transition-colors ${
                  messageSearch 
                    ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
                }`}
                title={language === 'en' ? 'Search messages' : 'सन्देश खोज्नुहोस्'}
              >
                <Search size={16} />
              </button>
              {(activeChannelData.createdBy === userEmail || currentUserRole === 'superadmin') ? (
                <button
                  onClick={() => handleDeleteChannel(activeChannelData.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[10px] font-black rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                  title={language === 'en' ? 'Delete channel' : 'च्यानल हटाउनुहोस्'}
                >
                  <Trash2 size={12} />
                </button>
              ) : (
                <button
                  onClick={() => handleLeaveChannel(activeChannelData.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[10px] font-black rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                  title={language === 'en' ? 'Leave channel' : 'च्यानलबाट बाहिर हुनुहोस्'}
                >
                  <LogOut size={12} />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {messageSearch && (
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    placeholder={language === 'en' ? 'Search messages...' : 'सन्देश खोज्नुहोस्...'}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
              )}
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-[11px] text-slate-400">
                    {language === 'en' ? 'No messages yet. Start the conversation!' : 'अहिले सम्म कुनै सन्देश छैन। संवाद सुरु गर्नुहोस्!'}
                  </p>
                </div>
              )}
              {messages.filter(msg => 
                messageSearch ? 
                  (msg.content?.toLowerCase().includes(messageSearch.toLowerCase()) || 
                   msg.senderName?.toLowerCase().includes(messageSearch.toLowerCase()) ||
                   msg.senderEmail?.toLowerCase().includes(messageSearch.toLowerCase())) 
                : true
              ).map((msg) => {
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
                        : msg.type === 'system'
                        ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-lg'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-md'
                    }`}>
                      {!isOwn && msg.type !== 'system' && (
                        <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                          {msg.senderName || msg.senderEmail}
                        </div>
                      )}
                      {msg.type === 'system' && (
                        <div className="text-[10px] font-bold mb-1 flex items-center gap-1">
                          <Clock size={10} /> {language === 'en' ? 'System' : 'प्रणाली'}
                        </div>
                      )}
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <div className={`text-[9px] mt-1 ${isOwn ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {msg.createdAt?.toDate?.()?.toLocaleString([], { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          month: 'short',
                          day: 'numeric',
                          year: msg.createdAt?.toDate?.()?.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                        }) || ''}
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
