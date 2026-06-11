"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

type Employee = { id: string; name: string; employeeId: string; role: string; designation: string | null };
type Member = { id: string; user: { id: string; name: string; employeeId: string; role: string } };
type LastMsg = { id: string; content: string; sender: { id: string; name: string }; createdAt: string };
type Room = { id: string; name: string | null; type: string; members: Member[]; messages: LastMsg[] };
type Message = { id: string; content: string; senderId: string; sender: { id: string; name: string }; createdAt: string; readBy: { userId: string }[] };

// ── Helpers ──────────────────────────────────────────────────────────────────
function getRoomName(room: Room, currentUserId: string) {
  if (room.type === "group") return room.name || "Group Chat";
  const other = room.members.find((m) => m.user.id !== currentUserId);
  return other?.user.name || "Direct Message";
}

function getAvatarColor(name: string) {
  const colors = [
    ["#7c3aed","#4f46e5"], ["#db2777","#9333ea"], ["#059669","#0891b2"],
    ["#d97706","#dc2626"], ["#0284c7","#7c3aed"], ["#16a34a","#059669"],
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatSidebarTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

function formatDateSeparator(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (msgDate.getTime() === today.getTime()) return "Today";
  if (msgDate.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });
}

function isSameDay(a: string, b: string) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 40, className = "" }: { name: string; size?: number; className?: string }) {
  const [c1, c2] = getAvatarColor(name);
  return (
    <div
      className={`flex items-center justify-center font-bold text-white flex-shrink-0 ${className}`}
      style={{
        width: size, height: size,
        borderRadius: size * 0.3,
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        fontSize: size * 0.38,
      }}
    >
      {name[0]?.toUpperCase()}
    </div>
  );
}

// ── Tick indicator ────────────────────────────────────────────────────────────
function Ticks({ isRead }: { isRead: boolean }) {
  const color = isRead ? "#60a5fa" : "rgba(255,255,255,0.45)";
  return (
    <svg viewBox="0 0 18 11" fill="none" style={{ width: 16, height: 10, flexShrink: 0 }}>
      <path d="M1 5.5L4.5 9L9.5 1" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 5.5L9.5 9L14.5 1" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Group icon ────────────────────────────────────────────────────────────────
function GroupAvatar({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, borderRadius: size * 0.3, background: "linear-gradient(135deg,#0891b2,#7c3aed)" }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} style={{ width: size * 0.5, height: size * 0.5 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
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
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [spyMode, setSpyMode] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);
  const activeRoomIdRef = useRef<string | null>(null);
  const scrollInstantRef = useRef(true);
  const loadRoomsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || null;

  // ── Load rooms (debounced) ──────────────────────────────────────────────────
  const loadRooms = useCallback(() => {
    if (loadRoomsTimerRef.current) clearTimeout(loadRoomsTimerRef.current);
    loadRoomsTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/chat/rooms");
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) { setRooms(data); setLoadingRooms(false); }
      } catch { /* silent */ }
    }, 300);
  }, []);

  useEffect(() => { void loadRooms(); }, [loadRooms]);

  // Background poll every 12s
  useEffect(() => {
    const t = setInterval(() => void loadRooms(), 12000);
    return () => clearInterval(t);
  }, [loadRooms]);

  // ── Load messages ───────────────────────────────────────────────────────────
  const loadMessages = useCallback(async (roomId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`);
      if (res.ok) {
        scrollInstantRef.current = true;
        setMessages(await res.json());
      }
    } catch { /* silent */ }
    finally { setLoadingMessages(false); }
  }, []);

  // Keep ref in sync
  useEffect(() => { activeRoomIdRef.current = activeRoomId; }, [activeRoomId]);

  // ── Global SSE (all rooms) ──────────────────────────────────────────────────
  useEffect(() => {
    function connect() {
      const es = new EventSource("/api/chat/stream");
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as { __type: string; __roomId: string } & Message;
          if (data.__type !== "message") return;
          const { __roomId: roomId, ...msg } = data;
          void loadRooms();
          if (activeRoomIdRef.current === roomId) {
            scrollInstantRef.current = false;
            setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg as Message]);
            void fetch(`/api/chat/rooms/${roomId}/read`, { method: "POST" });
          } else {
            setUnreadCounts((prev) => ({ ...prev, [roomId]: (prev[roomId] ?? 0) + 1 }));
          }
        } catch { /* ignore */ }
      };
      es.onerror = () => { es.close(); setTimeout(connect, 3000); };
      return es;
    }
    const es = connect();
    return () => es.close();
  }, [loadRooms]);

  // ── Room SSE (active room) ──────────────────────────────────────────────────
  useEffect(() => {
    if (!activeRoomId) return;
    void loadMessages(activeRoomId);

    if (esRef.current) { esRef.current.close(); esRef.current = null; }

    function connectRoom(roomId: string) {
      const es = new EventSource(`/api/chat/rooms/${roomId}/stream`);
      esRef.current = es;
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (activeRoomIdRef.current !== roomId) return;
          if (data.__type === "read") {
            setMessages((prev) => prev.map((m) =>
              m.senderId === currentUserId && !m.readBy.some((r) => r.userId === data.readerId)
                ? { ...m, readBy: [...m.readBy, { userId: data.readerId }] }
                : m
            ));
            return;
          }
          scrollInstantRef.current = false;
          setMessages((prev) => prev.some((m) => m.id === data.id) ? prev : [...prev, data as Message]);
          void loadRooms();
        } catch { /* ignore */ }
      };
      es.onerror = () => {
        es.close(); esRef.current = null;
        const cur = activeRoomIdRef.current;
        if (cur === roomId) {
          void loadMessages(cur);
          setTimeout(() => { if (activeRoomIdRef.current === roomId) connectRoom(roomId); }, 2000);
        }
      };
    }
    connectRoom(activeRoomId);
    return () => { esRef.current?.close(); esRef.current = null; };
  }, [activeRoomId, loadMessages, loadRooms, currentUserId]);

  // Tab visibility reload
  useEffect(() => {
    const fn = () => {
      if (document.visibilityState === "visible") {
        void loadRooms();
        if (activeRoomIdRef.current) void loadMessages(activeRoomIdRef.current);
      }
    };
    document.addEventListener("visibilitychange", fn);
    return () => document.removeEventListener("visibilitychange", fn);
  }, [loadMessages, loadRooms]);

  // ── Scroll to bottom ────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const c = messagesContainerRef.current;
    if (!c) return;
    if (scrollInstantRef.current) {
      c.scrollTop = c.scrollHeight;
    } else {
      c.scrollTo({ top: c.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  // ── Auto-resize textarea ────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  // ── Actions ─────────────────────────────────────────────────────────────────
  async function openRoom(room: Room) {
    if (isAdmin && spyMode) await fetch(`/api/chat/rooms/${room.id}/spy`, { method: "POST" });
    setUnreadCounts((prev) => ({ ...prev, [room.id]: 0 }));
    setMessages([]);
    setActiveRoomId(room.id);
    void fetch(`/api/chat/rooms/${room.id}/read`, { method: "POST" });
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function deleteRoom(roomId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(isAdmin ? "Delete this chat for everyone?" : "Leave this chat?")) return;
    const res = await fetch(`/api/chat/rooms/${roomId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(isAdmin ? "Chat deleted" : "Left chat");
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      if (activeRoomId === roomId) setActiveRoomId(null);
    } else toast.error("Failed");
  }

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || !activeRoomId || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    if (inputRef.current) { inputRef.current.style.height = "auto"; }
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  async function createChat() {
    if (selectedMembers.length === 0) { toast.error("Select at least one member"); return; }
    const res = await fetch("/api/chat/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: newChatType, name: newChatType === "group" ? groupName : undefined, memberIds: selectedMembers }),
    });
    if (res.ok) {
      const room = await res.json();
      setRooms((prev) => { const e = prev.find((r) => r.id === room.id); return e ? prev.map((r) => r.id === room.id ? room : r) : [room, ...prev]; });
      setMessages([]);
      setActiveRoomId(room.id);
      setShowNewChat(false);
      setSelectedMembers([]);
      setGroupName("");
    } else toast.error("Failed to create chat");
  }

  const filteredEmployees = employees.filter((e) =>
    (!roleFilter || e.role === roleFilter) &&
    (!sidebarSearch || e.name.toLowerCase().includes(sidebarSearch.toLowerCase()))
  );

  const filteredRooms = rooms.filter((r) =>
    !sidebarSearch || getRoomName(r, currentUserId).toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex overflow-hidden" style={{ height: "calc(100vh - 57px)", background: "#0a0a14" }}>

      {/* ════════════════════════════════════════════════════════════════════
          SIDEBAR
      ════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col flex-shrink-0" style={{ width: 300, background: "#0f0f1c", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0">
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Messages</h1>
            {isAdmin && (
              <button onClick={() => setSpyMode((s) => !s)}
                className="flex items-center gap-1 mt-0.5 text-xs font-medium transition-all"
                style={{ color: spyMode ? "#f59e0b" : "rgba(255,255,255,0.3)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 11, height: 11 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {spyMode ? "Spy Mode ON" : "Spy Mode"}
              </button>
            )}
          </div>
          <button onClick={() => setShowNewChat(true)}
            className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} style={{ width: 16, height: 16 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2 px-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2} style={{ width: 14, height: 14, flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Search chats..."
              className="flex-1 py-2.5 text-xs bg-transparent outline-none text-white placeholder:text-white/30"
            />
          </div>
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {loadingRooms ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Loading chats...</span>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(124,58,237,0.1)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth={1.5} style={{ width: 24, height: 24 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-white/60">No conversations</p>
              <p className="text-xs mt-1 text-white/30">Start a new chat</p>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const lastMsg = room.messages[0];
              const isActive = room.id === activeRoomId;
              const isGroup = room.type === "group";
              const unread = unreadCounts[room.id] ?? 0;
              const name = getRoomName(room, currentUserId);
              return (
                <div key={room.id} className="group/room relative mx-2 mb-0.5">
                  <button onClick={() => openRoom(room)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all text-left"
                    style={{ background: isActive ? "rgba(124,58,237,0.18)" : "transparent" }}>
                    {/* Avatar */}
                    <div className="relative">
                      {isGroup ? <GroupAvatar size={46} /> : <Avatar name={name} size={46} />}
                      {unread > 0 && !isActive && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1"
                          style={{ background: "#22c55e", boxShadow: "0 0 0 2px #0f0f1c" }}>
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className={`text-sm truncate ${unread > 0 && !isActive ? "font-bold text-white" : "font-semibold"}`}
                          style={{ color: isActive ? "white" : unread > 0 ? "white" : "rgba(255,255,255,0.85)" }}>
                          {name}
                        </p>
                        {lastMsg && (
                          <span className="text-[11px] flex-shrink-0"
                            style={{ color: unread > 0 && !isActive ? "#22c55e" : "rgba(255,255,255,0.3)" }}>
                            {formatSidebarTime(lastMsg.createdAt)}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate ${unread > 0 && !isActive ? "font-medium" : ""}`}
                        style={{ color: unread > 0 && !isActive ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.35)" }}>
                        {lastMsg
                          ? `${lastMsg.sender.id === currentUserId ? "You" : lastMsg.sender.name}: ${lastMsg.content}`
                          : "No messages yet"}
                      </p>
                    </div>
                  </button>
                  {/* Delete/leave on hover */}
                  <button onClick={(e) => deleteRoom(room.id, e)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-xl items-center justify-center transition-all opacity-0 group-hover/room:opacity-100 hidden group-hover/room:flex"
                    style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5" }}
                    title={isAdmin ? "Delete" : "Leave"}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 13, height: 13 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Current user footer */}
        <div className="px-4 py-3 flex-shrink-0 flex items-center gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <Avatar name={currentUserName} size={34} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{currentUserName}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          CHAT AREA
      ════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#0d0d1a" }}>

        {!activeRoom ? (
          /* ── Empty state ── */
          <div className="flex-1 flex items-center justify-center flex-col gap-5">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.15),rgba(79,70,229,0.1))", border: "1px solid rgba(124,58,237,0.2)" }}>
              <svg viewBox="0 0 24 24" fill="none" style={{ width: 36, height: 36 }}>
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  stroke="#a78bfa" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">Your Messages</p>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>Select a conversation or start a new one</p>
            </div>
            <button onClick={() => setShowNewChat(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} style={{ width: 16, height: 16 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Conversation
            </button>
          </div>
        ) : (
          <>
            {/* ── Chat Header ── */}
            <div className="flex items-center gap-3 px-5 py-3.5 flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
              {activeRoom.type === "group"
                ? <GroupAvatar size={40} />
                : <Avatar name={getRoomName(activeRoom, currentUserId)} size={40} />
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{getRoomName(activeRoom, currentUserId)}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {activeRoom.type === "group"
                    ? `${activeRoom.members.length} members`
                    : activeRoom.members.find((m) => m.user.id !== currentUserId)?.user.role ?? ""}
                </p>
              </div>
              {isAdmin && spyMode && (
                <span className="text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1"
                  style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                  👁 Viewing silently
                </span>
              )}
            </div>

            {/* ── Messages ── */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
              {loadingMessages && (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                </div>
              )}
              {!loadingMessages && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.08)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth={1.5} style={{ width: 28, height: 28 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>No messages yet</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Say hello! 👋</p>
                </div>
              )}

              {messages.map((msg, i) => {
                const isMe = msg.senderId === currentUserId;
                const prev = messages[i - 1];
                const next = messages[i + 1];
                const showDateSep = !prev || !isSameDay(prev.createdAt, msg.createdAt);
                const showAvatar = !isMe && (!next || next.senderId !== msg.senderId);
                const showName = !isMe && activeRoom.type === "group" && (!prev || prev.senderId !== msg.senderId);
                const isRead = msg.readBy?.some((r) => r.userId !== currentUserId) ?? false;

                return (
                  <div key={msg.id}>
                    {/* Date separator */}
                    {showDateSep && (
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                        <span className="text-[11px] font-medium px-3 py-1 rounded-full flex-shrink-0"
                          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                          {formatDateSeparator(msg.createdAt)}
                        </span>
                        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                      </div>
                    )}

                    <div className={`flex items-end gap-2 mb-1 ${isMe ? "justify-end" : "justify-start"}`}>
                      {/* Other person's avatar (group only) */}
                      {!isMe && (
                        <div className="flex-shrink-0" style={{ width: 32 }}>
                          {showAvatar && <Avatar name={msg.sender.name} size={30} className="rounded-full!" />}
                        </div>
                      )}

                      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[65%]`}>
                        {/* Sender name (group) */}
                        {showName && (
                          <p className="text-[11px] font-semibold mb-1 px-1" style={{ color: getAvatarColor(msg.sender.name)[0] }}>
                            {msg.sender.name}
                          </p>
                        )}

                        {/* Bubble */}
                        <div className="relative px-3.5 py-2.5 rounded-2xl"
                          style={{
                            background: isMe
                              ? "linear-gradient(135deg,#7c3aed,#4f46e5)"
                              : "rgba(255,255,255,0.07)",
                            borderBottomRightRadius: isMe ? 4 : undefined,
                            borderBottomLeftRadius: !isMe ? 4 : undefined,
                            boxShadow: isMe ? "0 2px 12px rgba(124,58,237,0.3)" : "none",
                          }}>
                          <p className="text-sm text-white leading-relaxed" style={{ wordBreak: "break-word" }}>
                            {msg.content}
                          </p>

                          {/* Time + ticks inside bubble */}
                          <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                            <span className="text-[10px]" style={{ color: isMe ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.3)" }}>
                              {formatTime(msg.createdAt)}
                            </span>
                            {isMe && <Ticks isRead={isRead} />}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Input ── */}
            <div className="flex-shrink-0 px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-end gap-3">
                <div className="flex-1 flex items-end gap-2 px-4 py-2.5 rounded-3xl"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Write a message..."
                    rows={1}
                    disabled={sending}
                    className="flex-1 bg-transparent text-sm text-white outline-none resize-none"
                    style={{ color: "white", maxHeight: 120, scrollbarWidth: "none", lineHeight: "1.5" }}
                  />
                </div>
                <button onClick={() => void sendMessage()}
                  disabled={!input.trim() || sending}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 disabled:opacity-40 disabled:scale-100"
                  style={{ background: input.trim() ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "rgba(255,255,255,0.08)" }}>
                  {sending
                    ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} style={{ width: 18, height: 18, marginLeft: 2 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    )
                  }
                </button>
              </div>
              <p className="text-[10px] mt-1.5 px-1" style={{ color: "rgba(255,255,255,0.2)" }}>
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          NEW CHAT MODAL
      ════════════════════════════════════════════════════════════════════ */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}>
          <div className="w-full max-w-md flex flex-col rounded-3xl overflow-hidden max-h-[88vh]"
            style={{ background: "#0f0f1c", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <h2 className="text-base font-bold text-white">New Conversation</h2>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Start a direct message or group chat</p>
              </div>
              <button onClick={() => { setShowNewChat(false); setSelectedMembers([]); setSidebarSearch(""); }}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
                style={{ color: "rgba(255,255,255,0.4)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Type toggle */}
              <div className="flex gap-2 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                {(["direct", "group"] as const).map((t) => (
                  <button key={t} onClick={() => { setNewChatType(t); setSelectedMembers([]); }}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: newChatType === t ? "rgba(124,58,237,0.3)" : "transparent",
                      color: newChatType === t ? "#c4b5fd" : "rgba(255,255,255,0.4)",
                    }}>
                    {t === "direct" ? "💬 Direct Message" : "👥 Group Chat"}
                  </button>
                ))}
              </div>

              {/* Group name */}
              {newChatType === "group" && (
                <input value={groupName} onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name..."
                  className="w-full rounded-2xl px-4 py-3 text-sm text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }} />
              )}

              {/* Role filter */}
              <div className="flex gap-2 flex-wrap">
                {["", "admin", "manager", "employee"].map((r) => (
                  <button key={r} onClick={() => setRoleFilter(r)}
                    className="px-3 py-1 rounded-full text-xs font-semibold transition-all capitalize"
                    style={{
                      background: roleFilter === r ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.05)",
                      color: roleFilter === r ? "#c4b5fd" : "rgba(255,255,255,0.4)",
                      border: roleFilter === r ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent",
                    }}>
                    {r || "All"}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="flex items-center gap-2 px-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2} style={{ width: 14, height: 14 }}>
                  <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                </svg>
                <input value={sidebarSearch} onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder="Search people..."
                  className="flex-1 py-2.5 text-xs bg-transparent outline-none text-white placeholder:text-white/30" />
              </div>

              {/* People list */}
              <div className="space-y-1 max-h-60 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                {filteredEmployees.map((emp) => {
                  const isSelected = selectedMembers.includes(emp.id);
                  return (
                    <button key={emp.id}
                      onClick={() => {
                        if (newChatType === "direct") setSelectedMembers([emp.id]);
                        else setSelectedMembers((prev) => prev.includes(emp.id) ? prev.filter((id) => id !== emp.id) : [...prev, emp.id]);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all"
                      style={{
                        background: isSelected ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.03)",
                        border: isSelected ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent",
                      }}>
                      <Avatar name={emp.name} size={36} />
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium text-white truncate">{emp.name}</p>
                        <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {emp.designation || emp.role} · {emp.employeeId}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} style={{ width: 11, height: 11 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedMembers.length > 0 && (
                <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {selectedMembers.length} {selectedMembers.length === 1 ? "person" : "people"} selected
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={() => { setShowNewChat(false); setSelectedMembers([]); setSidebarSearch(""); }}
                className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
                Cancel
              </button>
              <button onClick={createChat} disabled={selectedMembers.length === 0}
                className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                {newChatType === "direct" ? "Open Chat" : `Create Group`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
