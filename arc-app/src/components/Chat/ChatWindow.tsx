import React, { useState, useEffect, useRef } from 'react';
import { AppState, ChatChannel, ChatMessage, FriendUser } from '../../types';
import { INITIAL_FRIENDS, DEFAULT_CHAT_STATE } from '../../data/communityData';
import { ClanShieldBadge } from '../ClanShieldBadge';
import { getOrCreateDirectConversation, getOrCreateClanConversation, createGroupConversation, loadChatState, sendMessage, subscribeToMessages } from '../../services/communityService';
import {
  MessageSquare,
  Users,
  User,
  UserPlus,
  Plus,
  Send,
  X,
  ArrowLeft,
  Shield,
  Search,
  Check,
  Sparkles,
  Flame,
  Zap,
} from 'lucide-react';

import { Language } from '../../utils/i18n';

interface ChatWindowProps {
  appState: AppState;
  lang?: Language;
  onUpdateAppState: (updated: Partial<AppState>) => void;
  onClose: () => void;
  onOpenCommunity: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  appState,
  lang = 'de',
  onUpdateAppState,
  onClose,
  onOpenCommunity,
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'clan'>('friends');
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState<boolean>(false);

  // Group creation form state
  const [groupName, setGroupName] = useState<string>('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

  // Input text state
  const [messageText, setMessageText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derive friends list (only real connected players)
  const friendsList: FriendUser[] = appState.friends || [];

  // Derive channels state
  const chatChannels: ChatChannel[] = appState.chatState?.channels || [];

  // Derive clan messages state
  const clanMessages: ChatMessage[] = appState.chatState?.clanMessages || [];

  const userClan = appState.userClan;

  // Hydrate chat from Supabase and refresh on realtime message inserts.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const state = await loadChatState();
        if (active) onUpdateAppState({ chatState: state });
      } catch (error) {
        console.error('Chat backend load failed:', error);
      }
    })();
    const channel = subscribeToMessages(async () => {
      try {
        const state = await loadChatState();
        if (active) onUpdateAppState({ chatState: state });
      } catch (error) {
        console.error('Chat realtime refresh failed:', error);
      }
    });
    return () => {
      active = false;
      channel.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChannelId, chatChannels, clanMessages, activeTab]);

  // Mark active channel as read automatically when opened or viewed (clear unread count without replying)
  useEffect(() => {
    if (activeChannelId) {
      const targetChan = chatChannels.find((c) => c.id === activeChannelId);
      if (targetChan && (targetChan.unreadCount || 0) > 0) {
        const updatedChannels = chatChannels.map((c) =>
          c.id === activeChannelId ? { ...c, unreadCount: 0 } : c
        );
        onUpdateAppState({
          chatState: {
            channels: updatedChannels,
            clanMessages,
          },
        });
      }
    }
  }, [activeChannelId, chatChannels, clanMessages, onUpdateAppState]);

  // Save chat state helper
  const updateChatState = (
    updatedChannels: ChatChannel[],
    updatedClanMessages?: ChatMessage[]
  ) => {
    onUpdateAppState({
      chatState: {
        channels: updatedChannels,
        clanMessages: updatedClanMessages || clanMessages,
      },
    });
  };

  // Helper to get active channel
  const activeChannel = chatChannels.find((c) => c.id === activeChannelId);

  // Toggle friend selection for new group
  const toggleFriendSelection = (id: string) => {
    if (selectedFriendIds.includes(id)) {
      setSelectedFriendIds(selectedFriendIds.filter((fId) => fId !== id));
    } else {
      setSelectedFriendIds([...selectedFriendIds, id]);
    }
  };

  // Create new Group Chat - persisted in Supabase.
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedFriendIds.length === 0) return;
    try {
      const conversationId = await createGroupConversation(groupName.trim(), selectedFriendIds);
      const state = await loadChatState();
      updateChatState(state.channels, state.clanMessages);
      setGroupName('');
      setSelectedFriendIds([]);
      setIsCreatingGroup(false);
      setActiveChannelId(conversationId);
    } catch (error) {
      console.error('Create group chat failed:', error);
    }
  };

  // Open direct chat with a friend. The conversation itself is persisted in Supabase.
  const handleOpenDirectChat = async (friend: FriendUser) => {
    try {
      const conversationId = await getOrCreateDirectConversation(friend.id);
      const state = await loadChatState();
      onUpdateAppState({ chatState: state });
      setActiveChannelId(conversationId);
    } catch (error) {
      console.error('Open direct chat failed:', error);
    }
  };

  // Send message in Direct / Group Chat
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !activeChannelId) return;
    const textToSend = messageText.trim();
    setMessageText('');
    try {
      await sendMessage(activeChannelId, textToSend);
      const state = await loadChatState();
      onUpdateAppState({ chatState: state });
    } catch (error) {
      console.error('Send message failed:', error);
      setMessageText(textToSend);
    }
  };

  // Send Clan Chat Message
  const handleSendClanMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !userClan) return;
    const textToSend = messageText.trim();
    setMessageText('');
    try {
      const conversationId = await getOrCreateClanConversation(userClan.id);
      await sendMessage(conversationId, textToSend);
      const state = await loadChatState();
      onUpdateAppState({ chatState: state });
    } catch (error) {
      console.error('Send clan message failed:', error);
      setMessageText(textToSend);
    }
  };

  // Quick Action Buttons
  const handleQuickAction = (text: string) => {
    setMessageText(text);
  };

  // Filter channels/friends
  const filteredChannels = chatChannels.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed bottom-16 right-2 sm:right-6 w-[calc(100vw-16px)] sm:w-[410px] h-[520px] max-h-[85vh] bg-slate-950/95 border-2 border-cyan-500/50 rounded-2xl shadow-[0_0_35px_rgba(0,240,255,0.25)] flex flex-col overflow-hidden z-50 backdrop-blur-xl font-sans">
      {/* HEADER */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-3 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-cyan-950/80 rounded-lg border border-cyan-500/40 text-cyan-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-slate-100 text-sm tracking-wide">
                Cyber Chat
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              {lang === 'en' ? 'Realtime Communication' : 'Echtzeit Kommunikation'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          title={lang === 'en' ? 'Close' : 'Schließen'}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* TABS (FREUNDE vs CLAN) */}
      <div className="flex border-b border-slate-800 bg-slate-950/80 p-1 gap-1 shrink-0">
        <button
          onClick={() => {
            setActiveTab('friends');
            setIsCreatingGroup(false);
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'friends'
              ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{lang === 'en' ? 'Friends & Groups' : 'Freunde & Gruppen'}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('clan');
            setActiveChannelId(null);
            setIsCreatingGroup(false);
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'clan'
              ? 'bg-purple-950/90 text-purple-300 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-purple-400" />
          <span>{lang === 'en' ? 'Clan Chat' : 'Clan Chat'}</span>
        </button>
      </div>

      {/* TAB 1: FREUNDE & GRUPPEN */}
      {activeTab === 'friends' && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950/60">
          {/* SCENARIO A: Creating a new Group Chat */}
          {isCreatingGroup ? (
            <div className="flex-1 p-3 flex flex-col space-y-3 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{lang === 'en' ? 'Create Group' : 'Gruppe Erstellen'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreatingGroup(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  {lang === 'en' ? 'Cancel' : 'Abbrechen'}
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-3 flex-1 flex flex-col">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {lang === 'en' ? 'Group Name' : 'Gruppen Name'}
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder={lang === 'en' ? 'e.g. Cyber Grind Squad' : 'z.B. Cyber Grind Squad'}
                    maxLength={25}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-400 outline-none"
                  />
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {lang === 'en'
                      ? `Select Members (${selectedFriendIds.length} selected)`
                      : `Mitglieder Wählen (${selectedFriendIds.length} gewählt)`}
                  </label>
                  <div className="flex-1 overflow-y-auto bg-slate-900/80 border border-slate-800 rounded-lg p-2 space-y-1.5 max-h-48">
                    {friendsList.map((friend) => {
                      const isSelected = selectedFriendIds.includes(friend.id);
                      return (
                        <div
                          key={friend.id}
                          onClick={() => toggleFriendSelection(friend.id)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-cyan-950/80 border-cyan-400/80'
                              : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <img
                              src={friend.avatarUrl}
                              alt={friend.name}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                            <div className="truncate">
                              <span className="text-xs font-bold text-slate-200 block truncate">
                                {friend.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                LVL {friend.level} • {friend.characterCode}
                              </span>
                            </div>
                          </div>

                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                              isSelected
                                ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                                : 'border-slate-700 bg-slate-900'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!groupName.trim() || selectedFriendIds.length === 0}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold py-2 rounded-lg text-xs uppercase tracking-wider transition-all"
                >
                  {lang === 'en' ? 'Create Group Now' : 'Gruppe Jetzt Gründen'}
                </button>
              </form>
            </div>
          ) : activeChannelId ? (
            /* SCENARIO B: Active Chat Room (1-on-1 or Group) */
            <div className="flex-1 flex flex-col min-h-0">
              {/* Active Chat Header */}
              <div className="bg-slate-900/90 p-2.5 border-b border-slate-800 flex items-center justify-between shrink-0">
                <button
                  onClick={() => setActiveChannelId(null)}
                  className="flex items-center space-x-1 text-xs text-cyan-400 hover:text-cyan-300 font-bold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Back' : 'Zurück'}</span>
                </button>

                <div className="flex items-center space-x-2 min-w-0 truncate px-2">
                  {activeChannel?.isGroup ? (
                    <div className="p-1 bg-cyan-950 rounded text-cyan-400">
                      <Users className="w-4 h-4" />
                    </div>
                  ) : (
                    <img
                      src={activeChannel?.avatarUrl}
                      alt={activeChannel?.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  )}
                  <span className="text-xs font-bold text-slate-100 truncate">
                    {activeChannel?.name}
                  </span>
                </div>

                <span className="text-[10px] text-slate-400 font-mono">
                  {activeChannel?.isGroup
                    ? `${activeChannel.memberIds.length + 1} ${lang === 'en' ? 'Members' : 'Mitglieder'}`
                    : lang === 'en' ? 'Active' : 'Aktiv'}
                </span>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-0">
                {activeChannel?.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start space-x-2 ${
                      msg.isUser ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    {!msg.isUser && (
                      <img
                        src={
                          msg.senderAvatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                        }
                        alt={msg.senderName}
                        className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0 mt-0.5"
                      />
                    )}

                    <div
                      className={`max-w-[80%] rounded-xl p-2.5 text-xs shadow-md ${
                        msg.isUser
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      {!msg.isUser && activeChannel.isGroup && (
                        <span className="block text-[10px] font-bold text-cyan-400 mb-0.5">
                          {msg.senderName}
                        </span>
                      )}
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      <span
                        className={`block text-[9px] mt-1 text-right ${
                          msg.isUser ? 'text-cyan-200/80' : 'text-slate-500'
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Action Chips */}
              <div className="p-1.5 bg-slate-950/80 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => handleQuickAction(lang === 'en' ? 'Push your stats today! 🔥' : 'Pushe deine Stats heute! 🔥')}
                  className="bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 px-2 py-1 rounded text-[10px] font-bold shrink-0 flex items-center space-x-1"
                >
                  <Flame className="w-3 h-3" />
                  <span>{lang === 'en' ? '🔥 Motivate' : '🔥 Motivieren'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction(lang === 'en' ? 'Completed my Daily Tasks! ⚡' : 'Habe meine Daily Tasks abgeschlossen! ⚡')}
                  className="bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 px-2 py-1 rounded text-[10px] font-bold shrink-0 flex items-center space-x-1"
                >
                  <Zap className="w-3 h-3" />
                  <span>⚡ Task Done</span>
                </button>
              </div>

              {/* Input Form */}
              <form
                onSubmit={handleSendMessage}
                className="p-2 bg-slate-900 border-t border-slate-800 flex items-center space-x-2 shrink-0"
              >
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={lang === 'en' ? 'Type a message...' : 'Nachricht schreiben...'}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-400 outline-none"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="p-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 rounded-lg transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            /* SCENARIO C: Channels & Friends List View */
            <div className="flex-1 flex flex-col p-3 space-y-3 overflow-hidden min-h-0">
              {/* Action Bar: Search & New Group Button */}
              <div className="flex items-center justify-between gap-2 shrink-0">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={lang === 'en' ? 'Search...' : 'Suchen...'}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 outline-none"
                  />
                </div>

                <button
                  onClick={() => setIsCreatingGroup(true)}
                  className="bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 shrink-0 shadow-sm transition-all"
                  title={lang === 'en' ? 'Create new group with friends' : 'Neue Gruppe mit Freunden erstellen'}
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{lang === 'en' ? '+ Group' : '+ Gruppe'}</span>
                </button>
              </div>

              {/* Channels List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {lang === 'en' ? 'Active Chats & Groups' : 'Aktive Chats & Gruppen'}
                </div>

                {filteredChannels.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    {lang === 'en'
                      ? 'No chats found. Start a chat with your friends!'
                      : 'Keine Chats gefunden. Starte einen Chat mit deinen Freunden!'}
                  </div>
                ) : (
                  filteredChannels.map((chan) => (
                    <div
                      key={chan.id}
                      onClick={() => setActiveChannelId(chan.id)}
                      className="bg-slate-900/80 hover:bg-slate-900 p-2.5 rounded-xl border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between cursor-pointer transition-all group"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {chan.isGroup ? (
                          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                            <Users className="w-5 h-5" />
                          </div>
                        ) : (
                          <div className="relative shrink-0">
                            <img
                              src={
                                chan.avatarUrl ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                              }
                              alt={chan.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-800"
                            />
                            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950 absolute -bottom-0.5 -right-0.5" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-slate-100 text-xs truncate group-hover:text-cyan-300 transition-colors">
                              {chan.name}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {chan.lastMessage || (lang === 'en' ? 'No messages' : 'Keine Nachrichten')}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[9px] text-slate-500 block">
                          {chan.lastMessageTime}
                        </span>
                        {(chan.unreadCount || 0) > 0 && (
                          <span className="inline-block mt-0.5 bg-cyan-500 text-slate-950 text-[9px] font-bold px-1.5 rounded-full">
                            {chan.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {/* Quick Friends List for Instant 1-on-1 Chat */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {lang === 'en'
                      ? `Real Players / Friends (${friendsList.length})`
                      : `Echte Spieler / Freunde (${friendsList.length})`}
                  </div>

                  {friendsList.length === 0 ? (
                    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center flex flex-col items-center justify-center space-y-2">
                      <div className="w-9 h-9 rounded-full bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">
                          {lang === 'en' ? 'No real players in your list yet' : 'Noch keine echten Spieler in deiner Liste'}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                          {lang === 'en'
                            ? 'Only real players who connect with the web app or whose character code you add will be shown here.'
                            : 'Hier werden nur echte Spieler angezeigt, die sich mit der Web-App verbinden oder deren Character-Code du hinzufügst.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenCommunity();
                        }}
                        className="mt-1 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-[0_0_15px_rgba(0,240,255,0.25)]"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{lang === 'en' ? 'Add Real Players' : 'Echte Spieler hinzufügen'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-1.5">
                      {friendsList.map((friend) => (
                        <div
                          key={friend.id}
                          onClick={() => handleOpenDirectChat(friend)}
                          className="bg-slate-950 p-2 rounded-lg border border-slate-800/80 hover:border-slate-700 flex items-center justify-between cursor-pointer transition-all"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <img
                              src={friend.avatarUrl}
                              alt={friend.name}
                              className="w-7 h-7 rounded-lg object-cover"
                            />
                            <div className="truncate">
                              <span className="text-xs font-bold text-slate-200 block truncate">
                                {friend.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                LVL {friend.level} • {friend.characterCode}
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                            Chat
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLAN CHAT */}
      {activeTab === 'clan' && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950/60">
          {userClan ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Clan Header */}
              <div className="bg-slate-900/90 p-2.5 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2.5">
                  <ClanShieldBadge
                    config={userClan.badgeConfig}
                    fallbackEmoji={userClan.badgeEmoji}
                    size="sm"
                  />
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-100 text-xs uppercase">
                        {userClan.name}
                      </span>
                      <span className="text-[10px] text-cyan-400 font-mono font-bold">
                        [{userClan.tag}]
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {userClan.members?.length || 1}/30 {lang === 'en' ? 'Clan Members' : 'Clan-Mitglieder'}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  {lang === 'en' ? 'Clan Channel' : 'Clan-Kanal'}
                </span>
              </div>

              {/* Clan Messages */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-0">
                {clanMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start space-x-2 ${
                      msg.isUser ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    {!msg.isUser && (
                      <img
                        src={
                          msg.senderAvatar ||
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
                        }
                        alt={msg.senderName}
                        className="w-7 h-7 rounded-full object-cover border border-purple-500/40 shrink-0 mt-0.5"
                      />
                    )}

                    <div
                      className={`max-w-[80%] rounded-xl p-2.5 text-xs shadow-md ${
                        msg.isUser
                          ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-tr-none'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      {!msg.isUser && (
                        <span className="block text-[10px] font-bold text-purple-300 mb-0.5">
                          {msg.senderName}
                        </span>
                      )}
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      <span
                        className={`block text-[9px] mt-1 text-right ${
                          msg.isUser ? 'text-purple-200/80' : 'text-slate-500'
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Clan Quick Actions */}
              <div className="p-1.5 bg-slate-950/80 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => handleQuickAction(lang === 'en' ? "Let's collect Clan Points together! 🛡️" : 'Lasst uns gemeinsam Clan-Punkte sammeln! 🛡️')}
                  className="bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-800 px-2 py-1 rounded text-[10px] font-bold shrink-0 flex items-center space-x-1"
                >
                  <Shield className="w-3 h-3 text-purple-400" />
                  <span>{lang === 'en' ? '🛡️ Clan Points' : '🛡️ Clan Points'}</span>
                </button>
              </div>

              {/* Input Form */}
              <form
                onSubmit={handleSendClanMessage}
                className="p-2 bg-slate-900 border-t border-slate-800 flex items-center space-x-2 shrink-0"
              >
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={lang === 'en' ? 'Type in clan chat...' : 'In den Clan-Chat schreiben...'}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-purple-400 outline-none"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="p-2 bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-slate-950 rounded-lg transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            /* NO CLAN STATE */
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                <Shield className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-slate-100 text-sm">
                  {lang === 'en' ? 'Not Joined Any Clan' : 'Keinem Clan beigetreten'}
                </h4>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  {lang === 'en'
                    ? 'You currently do not belong to any clan. Join a Cyber Clan in the Community menu or found your own alliance!'
                    : 'Du gehörst aktuell noch keinem Clan an. Tritt im Community-Menü einem Cyber-Clan bei oder gründe dein eigenes Bündnis!'}
                </p>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenCommunity();
                }}
                className="bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all"
              >
                {lang === 'en' ? 'To Clans & Community' : 'Zu den Clans & Community'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
