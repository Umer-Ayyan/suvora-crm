"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

type Employee = { id: string; name: string; employeeId: string; role: string; designation: string | null };
type Member = { id: string; user: { id: string; name: string; employeeId: string; role: string } };
type LastMsg = { id: string; content: string; sender: { id: string; name: string }; createdAt: string };
type Room = { id: string; name: string | null; type: string; members: Member[]; messages: LastMsg[] };
type Message = { id: string; content: string; senderId: string; sender: { id: string; name: string }; createdAt: string; readBy: { userId: string }[] };

function getRoomName(room: Room, currentUserId: string) {
  if (room.type === "group") return room.name || "Group Chat";
  const other = room.members.find((m) => m.user.id !== currentUserId);
  return other?.user.name || "Direct Message";
}

function getRoomInitial(room: Room, currentUserId: string) {
  return getRoomName(room, currentUserId)[0]?.toUpperCase() || "?";
}

// Message tick indicator (WhatsApp-style)
function MessageTicks({ isRead }: { isRead: boolean }) {
  if (isRead) {
    // Double blue tick
    return (
      <svg className="inline w-4 h-4 ml-1 flex-shrink-0" viewBox="0 0 16 11" fill="none">
        <path d="M1 5.5L4.5 9L9 1" stroke="#60a5fa" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 5.5L8.5 9L13 1" stroke="#60a5fa" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  // Double grey tick (sent)
  return (
    <svg className="inline w-4 h-4 ml-1 flex-shrink-0" viewBox="0 0 16 11" fill="none">
      <path d="M1 5.5L4.5 9L9 1" stroke="rgba(255,255,255,0.4)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 5.5L8.5 9L13 1" stroke="rgba(255,255,255,0.4)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString();
}

export default function ChatApp({ currentUserId, currentUserName, isAdmin, employees }: {
  currentUserId: string;
  currentUserName: string;
  isAdmin: boolean;
  employees: Employee[];
}) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatType, setNewChatType] = useState<"direct" | "group">("direct");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [spyMode, setSpyMode] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);
  // Always-current ref so SSE callbacks never have stale closure
  const activeRoomIdRef = useRef<string | null>(null);
  // true = instant scroll (load), false = smooth (new message)
  const scrollInstantRef = useRef(true);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || null;

  // Load rooms
  const loadRooms = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/rooms");
      if (!res.ok) return;
      const data = await res.json();
      setRooms(data);
      setLoadingRooms(false);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { void loadRooms(); }, [loadRooms]);

  // Background poll: keep sidebar room list fresh every 10s (fallback)
  useEffect(() => {
    const timer = setInterval(() => { void loadRooms(); }, 10000);
    return () => clearInterval(timer);
  }, [loadRooms]);

  // ── Global user SSE: get notified of messages in ALL rooms ────────────────
  useEffect(() => {
    function connectGlobal() {
      const es = new EventSource("/api/chat/stream");

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as { __type: string; __roomId: string } & Message;
          const { __type, __roomId: roomId, ...msg } = data;

          // Only handle new messages in global stream (read events handled by room SSE)
          if (__type !== "message") return;

          // Always refresh sidebar so last-message preview updates
          void loadRooms();

          if (activeRoomIdRef.current === roomId) {
            // Active room → append message, scroll, and immediately mark as read
            scrollInstantRef.current = false;
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg as Message];
            });
            void fetch(`/api/chat/rooms/${roomId}/read`, { method: "POST" });
          } else {
            // Different room → increment unread badge
            setUnreadCounts((prev) => ({ ...prev, [roomId]: (prev[roomId] ?? 0) + 1 }));
          }
        } catch { /* ignore */ }
      };

      es.onerror = () => {
        es.close();
        setTimeout(connectGlobal, 3000);
      };

      return es;
    }

    const es = connectGlobal();
    return () => es.close();
  }, [loadRooms]);

  // Load messages — always scroll instantly (full refresh, not a new incoming msg)
  const loadMessages = useCallback(async (roomId: string) => {
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`);
      if (res.ok) {
        scrollInstantRef.current = true;
        setMessages(await res.json());
      }
    } catch { /* silent */ }
  }, []);

  // Keep ref in sync with state so SSE callbacks never have stale roomId
  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  // SSE subscription — recreate whenever active room changes
  useEffect(() => {
    if (!activeRoomId) return;

    // Initial load
    void loadMessages(activeRoomId);

    // Close any previous SSE connection
    if (esRef.current) { esRef.current.close(); esRef.current = null; }

    function connectSSE(roomId: string) {
      const es = new EventSource(`/api/chat/rooms/${roomId}/stream`);
      esRef.current = es;

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (activeRoomIdRef.current !== roomId) return;

          if (data.__type === "read") {
            // Someone read the messages — mark all my messages as read in state
            setMessages((prev) =>
              prev.map((m) =>
                m.senderId === currentUserId && !m.readBy.some((r) => r.userId === data.readerId)
                  ? { ...m, readBy: [...m.readBy, { userId: data.readerId }] }
                  : m
              )
            );
            return;
          }

          // Regular message
          scrollInstantRef.current = false;
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.id)) return prev;
            return [...prev, data as Message];
          });
          void loadRooms();
        } catch { /* ignore malformed */ }
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        const currentRoom = activeRoomIdRef.current;
        if (!currentRoom || currentRoom !== roomId) return;
        // Reload missed messages then reconnect
        void loadMessages(currentRoom);
        setTimeout(() => {
          if (activeRoomIdRef.current === roomId) connectSSE(roomId);
        }, 2000);
      };
    }

    connectSSE(activeRoomId);

    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [activeRoomId, loadMessages, loadRooms]);

  // Reload messages when tab becomes visible again (user switches back to tab)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && activeRoomIdRef.current) {
        void loadMessages(activeRoomIdRef.current);
        void loadRooms();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadMessages, loadRooms]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    if (scrollInstantRef.current) {
      // Instant jump — no animation (page load / room switch)
      container.scrollTop = container.scrollHeight;
    } else {
      // Smooth scroll for new incoming/sent message
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function deleteRoom(roomId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(isAdmin ? "Delete this chat for everyone?" : "Leave this chat?")) return;
    const res = await fetch(`/api/chat/rooms/${roomId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(isAdmin ? "Chat deleted" : "Left chat");
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      if (activeRoomId === roomId) setActiveRoomId(null);
    } else {
      toast.error("Failed");
    }
  }

  async function openRoom(room: Room) {
    if (isAdmin && spyMode) {
      await fetch(`/api/chat/rooms/${room.id}/spy`, { method: "POST" });
    }
    setUnreadCounts((prev) => ({ ...prev, [room.id]: 0 }));
    setMessages([]);
    setActiveRoomId(room.id);
    // Mark messages as read (fires in background, triggers blue tick for sender)
    void fetch(`/api/chat/rooms/${room.id}/read`, { method: "POST" });
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !activeRoomId || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    try {
      const res = await fetch(`/api/chat/rooms/${activeRoomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const msg = await res.json();
        scrollInstantRef.current = false;
        setMessages((prev) => [...prev, msg]);
        loadRooms();
      } else {
        toast.error("Failed to send");
        setInput(content);
      }
    } catch {
      toast.error("Error");
      setInput(content);
    } finally {
      setSending(false);
    }
  }

  async function createChat() {
    if (selectedMembers.length === 0) { toast.error("Select at least one member"); return; }
    const res = await fetch("/api/chat/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: newChatType,
        name: newChatType === "group" ? groupName : undefined,
        memberIds: selectedMembers,
      }),
    });
    if (res.ok) {
      const room = await res.json();
      setRooms((prev) => {
        const exists = prev.find((r) => r.id === room.id);
        return exists ? prev.map((r) => r.id === room.id ? room : r) : [room, ...prev];
      });
      setMessages([]);
      setActiveRoomId(room.id); // triggers useEffect → loadMessages + SSE
      setShowNewChat(false);
      setSelectedMembers([]);
      setGroupName("");
    } else {
      toast.error("Failed to create chat");
    }
  }

  const filteredEmployees = roleFilter
    ? employees.filter((e) => e.role === roleFilter)
    : employees;

  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" };

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden">
      {/* ── Rooms sidebar ── */}
      <div className="w-72 flex-shrink-0 flex flex-col" style={{ background: "rgba(255,255,255,0.02)", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
        {/* Header */}
        <div className="px-4 py-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div>
            <h2 className="text-sm font-bold text-white">Team Chat</h2>
            {isAdmin && (
              <button
                onClick={() => setSpyMode((s) => !s)}
                className="text-xs mt-0.5 font-semibold transition-all"
                style={{ color: spyMode ? "#f59e0b" : "rgba(255,255,255,0.3)" }}
              >
                {spyMode ? "👁 Spy Mode ON" : "👁 Spy Mode"}
              </button>
            )}
          </div>
          <button
            onClick={() => setShowNewChat(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ background: "rgba(124,58,237,0.2)", color: "#c4b5fd" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Rooms list */}
        <div className="flex-1 overflow-y-auto py-2">
          {loadingRooms ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>No chats yet</p>
              <button onClick={() => setShowNewChat(true)} className="text-xs mt-2 text-violet-400 hover:text-violet-300">
                Start a conversation
              </button>
            </div>
          ) : (
            rooms.map((room) => {
              const lastMsg = room.messages[0];
              const isActive = room.id === activeRoomId;
              const isGroup = room.type === "group";
              const unread = unreadCounts[room.id] ?? 0;
              return (
                <div key={room.id} className="group/room relative">
                <button
                  onClick={() => openRoom(room)}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-all text-left"
                  style={{ background: isActive ? "rgba(124,58,237,0.15)" : "transparent" }}
                >
                  {/* Avatar with unread dot */}
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold"
                      style={{ background: isGroup ? "rgba(6,182,212,0.2)" : "rgba(124,58,237,0.2)", color: isGroup ? "#67e8f9" : "#c4b5fd" }}>
                      {isGroup
                        ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        : getRoomInitial(room, currentUserId)
                      }
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-sm truncate ${unread > 0 && !isActive ? "font-bold text-white" : "font-medium text-white"}`}>
                        {getRoomName(room, currentUserId)}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {lastMsg && <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{timeAgo(lastMsg.createdAt)}</span>}
                        {unread > 0 && !isActive && (
                          <span className="min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1"
                            style={{ background: "#22c55e" }}>
                            {unread > 99 ? "99+" : unread}
                          </span>
                        )}
                      </div>
                    </div>
                    {lastMsg ? (
                      <p className={`text-xs truncate mt-0.5 ${unread > 0 && !isActive ? "font-semibold" : ""}`}
                        style={{ color: unread > 0 && !isActive ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)" }}>
                        {lastMsg.sender.id === currentUserId ? "You" : lastMsg.sender.name}: {lastMsg.content}
                      </p>
                    ) : (
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>No messages yet</p>
                    )}
                  </div>
                </button>
                {/* Delete / Leave button — shown on hover */}
                <button
                  onClick={(e) => deleteRoom(room.id, e)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg items-center justify-center transition-all hidden group-hover/room:flex"
                  style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5" }}
                  title={isAdmin ? "Delete chat" : "Leave chat"}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!activeRoom ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.1)" }}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold">Select a chat</p>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>or start a new conversation</p>
            </div>
            <button onClick={() => setShowNewChat(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
              New Chat
            </button>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-3.5 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: activeRoom.type === "group" ? "rgba(6,182,212,0.2)" : "rgba(124,58,237,0.2)", color: activeRoom.type === "group" ? "#67e8f9" : "#c4b5fd" }}>
                {activeRoom.type === "group"
                  ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  : getRoomInitial(activeRoom, currentUserId)
                }
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{getRoomName(activeRoom, currentUserId)}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {activeRoom.type === "group"
                    ? `${activeRoom.members.length} members`
                    : activeRoom.members.find((m) => m.user.id !== currentUserId)?.user.role || ""}
                </p>
              </div>
              {isAdmin && spyMode && (
                <span className="ml-auto text-xs px-2 py-1 rounded-full font-semibold"
                  style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
                  👁 Viewing silently
                </span>
              )}
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8 text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
                  No messages yet. Say hello! 👋
                </div>
              )}
              {messages.map((msg, i) => {
                const isMe = msg.senderId === currentUserId;
                const showName = !isMe && (i === 0 || messages[i - 1]?.senderId !== msg.senderId);
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                      {showName && (
                        <p className="text-xs font-semibold mb-1 px-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                          {msg.sender.name}
                        </p>
                      )}
                      <div className="px-3.5 py-2.5 rounded-2xl text-sm text-white leading-relaxed"
                        style={{
                          background: isMe ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "rgba(255,255,255,0.07)",
                          borderBottomRightRadius: isMe ? "4px" : undefined,
                          borderBottomLeftRadius: !isMe ? "4px" : undefined,
                        }}>
                        {msg.content}
                      </div>
                      <div className="flex items-center gap-0.5 mt-1 px-1">
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {isMe && (
                          <MessageTicks
                            isRead={msg.readBy?.some((r) => r.userId !== currentUserId) ?? false}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
              style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                style={inputStyle}
                disabled={sending}
                autoFocus
              />
              <button type="submit" disabled={!input.trim() || sending}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all"
                style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </>
        )}
      </div>

      {/* ── New Chat Modal ── */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col max-h-[85vh]"
            style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.1)" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <h2 className="text-base font-bold text-white">New Chat</h2>
              <button onClick={() => { setShowNewChat(false); setSelectedMembers([]); }}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/5"
                style={{ color: "rgba(255,255,255,0.5)" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Type toggle */}
              <div className="flex gap-2">
                {(["direct", "group"] as const).map((t) => (
                  <button key={t} onClick={() => { setNewChatType(t); setSelectedMembers([]); }}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all"
                    style={{
                      background: newChatType === t ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
                      color: newChatType === t ? "#c4b5fd" : "rgba(255,255,255,0.5)",
                      border: newChatType === t ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent",
                    }}>
                    {t === "direct" ? "Direct Message" : "Group Chat"}
                  </button>
                ))}
              </div>

              {/* Group name */}
              {newChatType === "group" && (
                <input value={groupName} onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name (e.g. Design Team)"
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={inputStyle} />
              )}

              {/* Role filter */}
              <div className="flex gap-2 flex-wrap">
                {["", "admin", "manager", "employee"].map((r) => (
                  <button key={r} onClick={() => setRoleFilter(r)}
                    className="px-3 py-1 rounded-full text-xs font-semibold transition-all capitalize"
                    style={{
                      background: roleFilter === r ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.05)",
                      color: roleFilter === r ? "#c4b5fd" : "rgba(255,255,255,0.4)",
                    }}>
                    {r || "All"}
                  </button>
                ))}
              </div>

              {/* Employee list */}
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {filteredEmployees.map((emp) => {
                  const isSelected = selectedMembers.includes(emp.id);
                  return (
                    <button key={emp.id}
                      onClick={() => {
                        if (newChatType === "direct") {
                          setSelectedMembers([emp.id]);
                        } else {
                          setSelectedMembers((prev) =>
                            prev.includes(emp.id) ? prev.filter((id) => id !== emp.id) : [...prev, emp.id]
                          );
                        }
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                      style={{
                        background: isSelected ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.03)",
                        border: isSelected ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent",
                      }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(79,70,229,0.2))", color: "#c4b5fd" }}>
                        {emp.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium text-white truncate">{emp.name}</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{emp.designation || emp.role} · {emp.employeeId}</p>
                      </div>
                      {isSelected && (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#c4b5fd" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedMembers.length > 0 && (
                <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {selectedMembers.length} member{selectedMembers.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            <div className="flex gap-3 px-6 py-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <button onClick={() => { setShowNewChat(false); setSelectedMembers([]); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" }}>
                Cancel
              </button>
              <button onClick={createChat} disabled={selectedMembers.length === 0}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                {newChatType === "direct" ? "Open Chat" : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
