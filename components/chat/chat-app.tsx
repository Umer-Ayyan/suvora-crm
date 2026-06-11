"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

type Employee = { id: string; name: string; employeeId: string; role: string; designation: string | null };
type Member = { id: string; user: { id: string; name: string; employeeId: string; role: string; lastSeenAt: string | null } };
type LastMsg = { id: string; content: string; sender: { id: string; name: string }; createdAt: string };
type Room = { id: string; name: string | null; type: string; members: Member[]; messages: LastMsg[] };
type Message = {
  id: string; content: string; senderId: string;
  sender: { id: string; name: string }; createdAt: string;
  readBy: { userId: string }[];
  editedAt?: string | null;
  isDeleted?: boolean;
  // optimistic-only fields (not in DB)
  status?: "sending" | "failed";
  tempId?: string;
};

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
  return new Date(dateStr).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatSidebarTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return d.toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit", hour12: true });
  if (diff < 604800) return d.toLocaleDateString("en-PK", { weekday: "short" });
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
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

// Online = seen within last 60 seconds
function isOnline(lastSeenAt: string | null | undefined) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 60_000;
}

function formatLastSeen(lastSeenAt: string | null | undefined) {
  if (!lastSeenAt) return "Offline";
  const diff = Math.floor((Date.now() - new Date(lastSeenAt).getTime()) / 1000);
  if (diff < 60) return "Online";
  if (diff < 3600) return `Last seen ${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `Last seen ${Math.floor(diff / 3600)}h ago`;
  return `Last seen ${new Date(lastSeenAt).toLocaleDateString([], { day: "numeric", month: "short" })}`;
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

// ── Message status indicator ──────────────────────────────────────────────────
function MessageStatus({ status, isRead }: { status?: "sending" | "failed"; isRead: boolean }) {
  // Sending → clock icon
  if (status === "sending") {
    return (
      <svg viewBox="0 0 16 16" fill="none" style={{ width: 13, height: 13, flexShrink: 0 }}>
        <circle cx="8" cy="8" r="6.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4"/>
        <path d="M8 5v3.5l2 1.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  // Failed → exclamation
  if (status === "failed") {
    return (
      <svg viewBox="0 0 16 16" fill="none" style={{ width: 13, height: 13, flexShrink: 0 }}>
        <circle cx="8" cy="8" r="6.5" stroke="#f87171" strokeWidth="1.4"/>
        <path d="M8 5v4" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="8" cy="11" r="0.8" fill="#f87171"/>
      </svg>
    );
  }
  // Sent / Read → double ticks
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
  const [sending] = useState(false); // kept for button UI only
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [menuMsgId, setMenuMsgId] = useState<string | null>(null);
  const [menuOpenTime, setMenuOpenTime] = useState(0);
  const [vanishingIds, setVanishingIds] = useState<Set<string>>(new Set());
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
  // lastSeenAt per userId for live online tracking
  const [lastSeenMap, setLastSeenMap] = useState<Record<string, string | null>>({});
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

  // ── Request browser notification permission on mount ───────────────────────
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

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
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              const tempIdx = prev.findIndex(
                (m) => m.tempId && m.senderId === msg.senderId && m.content === msg.content && m.status === "sending"
              );
              if (tempIdx !== -1) {
                const next = [...prev];
                next[tempIdx] = msg as Message;
                return next;
              }
              return [...prev, msg as Message];
            });
            void fetch(`/api/chat/rooms/${roomId}/read`, { method: "POST" });
          } else {
            setUnreadCounts((prev) => ({ ...prev, [roomId]: (prev[roomId] ?? 0) + 1 }));
            // Browser push notification when message arrives in a room NOT currently open
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted" && msg.senderId !== currentUserId) {
              const senderName = msg.sender?.name ?? "Someone";
              const roomName = rooms.find((r) => r.id === roomId)
                ? getRoomName(rooms.find((r) => r.id === roomId)!, currentUserId)
                : "Team Chat";
              new Notification(`${senderName} · ${roomName}`, {
                body: msg.content?.slice(0, 80) || "New message",
                icon: "/favicon.ico",
                tag: roomId, // Replace existing notification from same room
              });
            }
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
                ? { ...m, readBy: [...m.readBy, { userId: data.readerId }] } : m
            ));
            return;
          }
          if (data.__type === "edit") {
            setMessages((prev) => prev.map((m) =>
              m.id === data.messageId ? { ...m, content: data.content, editedAt: new Date().toISOString() } : m
            ));
            return;
          }
          if (data.__type === "delete") {
            // Animate vanish first, then show deleted placeholder
            spawnParticles(data.messageId);
            setVanishingIds((prev) => new Set([...prev, data.messageId]));
            setTimeout(() => {
              setMessages((prev) => prev.map((m) =>
                m.id === data.messageId ? { ...m, isDeleted: true, content: "" } : m
              ));
              setVanishingIds((prev) => { const n = new Set(prev); n.delete(data.messageId); return n; });
            }, 420);
            return;
          }
          scrollInstantRef.current = false;
          setMessages((prev) => {
            // Already have it by real id
            if (prev.some((m) => m.id === data.id)) return prev;
            // Replace optimistic temp message (same sender + content, still pending)
            const tempIdx = prev.findIndex(
              (m) => m.tempId && m.senderId === data.senderId && m.content === data.content && m.status === "sending"
            );
            if (tempIdx !== -1) {
              const next = [...prev];
              next[tempIdx] = data as Message;
              return next;
            }
            return [...prev, data as Message];
          });
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

  // ── Heartbeat: update own lastSeenAt every 30s ──────────────────────────────
  useEffect(() => {
    const beat = () => fetch("/api/user/heartbeat", { method: "POST" }).catch(() => {});
    void beat(); // immediate on mount
    const t = setInterval(beat, 30_000);
    return () => clearInterval(t);
  }, []);

  // ── Sync lastSeenAt from room members into local map ────────────────────────
  useEffect(() => {
    const map: Record<string, string | null> = {};
    rooms.forEach((r) => r.members.forEach((m) => { map[m.user.id] = m.user.lastSeenAt; }));
    setLastSeenMap((prev) => ({ ...prev, ...map }));
  }, [rooms]);

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
    if (!input.trim() || !activeRoomId) return;
    const content = input.trim();
    const tempId = `temp_${Date.now()}`;
    const roomId = activeRoomId;

    // ── Optimistic: show message instantly with clock icon ──
    const optimistic: Message = {
      id: tempId, tempId, content, senderId: currentUserId,
      sender: { id: currentUserId, name: currentUserName },
      createdAt: new Date().toISOString(),
      readBy: [], status: "sending",
    };
    scrollInstantRef.current = false;
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const confirmed: Message = await res.json();
        // Replace optimistic message with confirmed one
        setMessages((prev) => prev.map((m) => m.tempId === tempId ? confirmed : m));
      } else {
        // Mark as failed
        setMessages((prev) => prev.map((m) => m.tempId === tempId ? { ...m, status: "failed" } : m));
      }
    } catch {
      // Network error — mark as failed
      setMessages((prev) => prev.map((m) => m.tempId === tempId ? { ...m, status: "failed" } : m));
    }
  }

  async function saveEdit(msgId: string) {
    if (!editContent.trim() || !activeRoomId) return;
    // Optimistic update
    setMessages((prev) => prev.map((m) =>
      m.id === msgId ? { ...m, content: editContent.trim(), editedAt: new Date().toISOString() } : m
    ));
    setEditingId(null);
    await fetch(`/api/chat/rooms/${activeRoomId}/messages/${msgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent.trim() }),
    });
  }

  function spawnParticles(msgId: string) {
    const bubble = document.querySelector(`[data-msgid="${msgId}"] .msg-bubble`) as HTMLElement | null;
    if (!bubble) return;
    const rect = bubble.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // Telegram-like palette: purples, pinks, whites, blues
    const colors = [
      "#a78bfa", "#c4b5fd", "#7c3aed", "#e879f9",
      "#f0abfc", "#818cf8", "#60a5fa", "#ffffff",
      "#ddd6fe", "#fbcfe8", "#6ee7b7",
    ];

    const TOTAL = 24; // more particles = more impressive

    for (let i = 0; i < TOTAL; i++) {
      // Spread angles evenly + slight jitter
      const angle = ((Math.PI * 2) / TOTAL) * i + (Math.random() - 0.5) * 0.5;
      // Vary distance — close and far particles
      const dist = 35 + Math.random() * 90;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;

      const size = 2 + Math.random() * 6;
      const isRound = Math.random() > 0.35;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const duration = 380 + Math.random() * 320; // ms
      const delay = Math.random() * 60; // ms stagger

      const el = document.createElement("div");
      el.style.cssText = `
        position:fixed;
        left:${cx - size / 2}px;
        top:${cy - size / 2}px;
        width:${size}px;
        height:${isRound ? size : size * 0.5}px;
        border-radius:${isRound ? "50%" : "2px"};
        background:${color};
        pointer-events:none;
        z-index:99999;
        will-change:transform,opacity;
      `;
      document.body.appendChild(el);

      // Use Web Animations API — reliable cross-browser, no CSS custom props needed
      el.animate(
        [
          { transform: "translate(0,0) scale(1)",                     opacity: 1 },
          { transform: `translate(${tx * 0.4}px,${ty * 0.4}px) scale(1.1)`, opacity: 1,   offset: 0.15 },
          { transform: `translate(${tx}px,${ty}px) scale(0)`,         opacity: 0 },
        ],
        {
          duration,
          delay,
          easing: "cubic-bezier(0.15, 0.8, 0.35, 1)",
          fill: "forwards",
        }
      ).onfinish = () => el.remove();
    }

    // Extra: 6 slightly bigger "glow" orbs for depth
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 50;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      const size = 7 + Math.random() * 8;
      const color = colors[Math.floor(Math.random() * 4)]; // purples only
      const el = document.createElement("div");
      el.style.cssText = `
        position:fixed;
        left:${cx - size / 2}px;
        top:${cy - size / 2}px;
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        background:${color};
        opacity:0.45;
        pointer-events:none;
        z-index:99998;
        filter:blur(2px);
        will-change:transform,opacity;
      `;
      document.body.appendChild(el);
      el.animate(
        [
          { transform: "translate(0,0) scale(1)",              opacity: 0.45 },
          { transform: `translate(${tx}px,${ty}px) scale(0)`, opacity: 0 },
        ],
        { duration: 300 + Math.random() * 200, delay: Math.random() * 40, easing: "ease-out", fill: "forwards" }
      ).onfinish = () => el.remove();
    }
  }

  async function deleteMessage(msgId: string, deleteType: "everyone" | "me") {
    if (!activeRoomId) return;
    setMenuMsgId(null);

    // Step 1: spawn particles from bubble position, then start vanish animation
    spawnParticles(msgId);
    setVanishingIds((prev) => new Set([...prev, msgId]));

    // Step 2: after animation completes, apply the actual state change
    setTimeout(() => {
      if (deleteType === "me") {
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
      } else {
        setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, isDeleted: true, content: "" } : m));
      }
      setVanishingIds((prev) => { const n = new Set(prev); n.delete(msgId); return n; });
    }, 420); // matches animation duration

    await fetch(`/api/chat/rooms/${activeRoomId}/messages/${msgId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleteType }),
    });
  }

  // Retry a failed message
  async function retryMessage(msg: Message) {
    if (!activeRoomId) return;
    setMessages((prev) => prev.map((m) => m.tempId === msg.tempId ? { ...m, status: "sending" } : m));
    try {
      const res = await fetch(`/api/chat/rooms/${activeRoomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: msg.content }),
      });
      if (res.ok) {
        const confirmed: Message = await res.json();
        setMessages((prev) => prev.map((m) => m.tempId === msg.tempId ? confirmed : m));
      } else {
        setMessages((prev) => prev.map((m) => m.tempId === msg.tempId ? { ...m, status: "failed" } : m));
      }
    } catch {
      setMessages((prev) => prev.map((m) => m.tempId === msg.tempId ? { ...m, status: "failed" } : m));
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
          SIDEBAR — full width on mobile when no chat open, fixed column on desktop
      ════════════════════════════════════════════════════════════════════ */}
      <div className={`flex flex-col flex-shrink-0 ${activeRoomId ? "hidden md:flex" : "flex w-full md:w-auto"}`}
        style={{ width: undefined, minWidth: 0 }}
      >
      <div className="flex flex-col h-full md:w-[300px] w-full" style={{ background: "#0f0f1c", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

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
      </div>{/* close inner sidebar div */}

      {/* ════════════════════════════════════════════════════════════════════
          CHAT AREA — hidden on mobile when no room selected (sidebar shown instead)
      ════════════════════════════════════════════════════════════════════ */}
      <div className={`flex-1 flex flex-col overflow-hidden ${!activeRoomId ? "hidden md:flex" : "flex"}`} style={{ background: "#0d0d1a" }}>

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
            {(() => {
              const otherMember = activeRoom.type === "direct"
                ? activeRoom.members.find((m) => m.user.id !== currentUserId)
                : null;
              const otherLastSeen = otherMember ? (lastSeenMap[otherMember.user.id] ?? otherMember.user.lastSeenAt) : null;
              const online = otherMember ? isOnline(otherLastSeen) : false;
              return (
            <div className="flex items-center gap-3 px-3 md:px-5 py-3.5 flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
              {/* Back button — mobile only */}
              <button className="md:hidden flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.06)" }}
                onClick={() => setActiveRoomId(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} style={{ width: 16, height: 16 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="relative">
                {activeRoom.type === "group"
                  ? <GroupAvatar size={40} />
                  : <Avatar name={getRoomName(activeRoom, currentUserId)} size={40} />
                }
                {activeRoom.type === "direct" && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                    style={{
                      background: online ? "#22c55e" : "rgba(255,255,255,0.25)",
                      borderColor: "#0d0d1a",
                    }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{getRoomName(activeRoom, currentUserId)}</p>
                <p className="text-xs mt-0.5 flex items-center gap-1"
                  style={{ color: online ? "#4ade80" : "rgba(255,255,255,0.35)" }}>
                  {activeRoom.type === "group"
                    ? `${activeRoom.members.length} members`
                    : formatLastSeen(otherLastSeen)
                  }
                </p>
              </div>
              {isAdmin && spyMode && (
                <span className="text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1"
                  style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                  👁 Viewing silently
                </span>
              )}
            </div>
              );
            })()}

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
                const isFailed = msg.status === "failed";
                const isSending = msg.status === "sending";
                const isDeleted = !!msg.isDeleted;
                const isEditing = editingId === msg.id;
                const showMenu = menuMsgId === msg.id;
                const isVanishing = vanishingIds.has(msg.id);
                const msgAgeMs = menuOpenTime - new Date(msg.createdAt).getTime();
                const canEdit = isMe && !isDeleted && !isSending && msgAgeMs < 15 * 60 * 1000;
                const canDeleteForAll = (isMe || isAdmin) && !isDeleted && !isSending && (isAdmin || msgAgeMs < 24 * 60 * 60 * 1000);

                return (
                  <div key={msg.tempId ?? msg.id}
                    data-msgid={msg.id}
                    className={isVanishing ? "msg-vanishing" : ""}
                    onClick={() => setMenuMsgId(null)}>
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
                      {!isMe && (
                        <div className="flex-shrink-0" style={{ width: 32 }}>
                          {showAvatar && <Avatar name={msg.sender.name} size={30} />}
                        </div>
                      )}

                      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[65%]`}>
                        {showName && (
                          <p className="text-[11px] font-semibold mb-1 px-1" style={{ color: getAvatarColor(msg.sender.name)[0] }}>
                            {msg.sender.name}
                          </p>
                        )}

                        {/* Bubble wrapper with hover menu trigger */}
                        <div className="relative group/msg">

                          {/* ── 3-dot menu button (hover) ── */}
                          {!isDeleted && !isSending && !isEditing && (
                            <button
                              onClick={(e) => { e.stopPropagation(); if (!showMenu) setMenuOpenTime(Date.now()); setMenuMsgId(showMenu ? null : msg.id); }}
                              className={`absolute top-1 z-10 w-6 h-6 rounded-full items-center justify-center transition-all
                                opacity-0 group-hover/msg:opacity-100
                                ${isMe ? "-left-8" : "-right-8"}`}
                              style={{ background: "rgba(255,255,255,0.1)", display: "flex" }}>
                              <svg viewBox="0 0 24 24" fill="white" style={{ width: 12, height: 12 }}>
                                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                              </svg>
                            </button>
                          )}

                          {/* ── Context menu ── */}
                          {showMenu && (
                            <div
                              className={`absolute top-0 z-20 rounded-2xl overflow-hidden flex flex-col ${isMe ? "right-full mr-2" : "left-full ml-2"}`}
                              style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", minWidth: 170 }}
                              onClick={(e) => e.stopPropagation()}>

                              {/* Edit — only own msg within 15 min */}
                              {canEdit && (
                                <button
                                  onClick={() => { setEditingId(msg.id); setEditContent(msg.content); setMenuMsgId(null); }}
                                  className="flex items-center gap-2.5 px-4 py-3 text-xs font-medium text-white hover:bg-white/10 transition-all text-left">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                  </svg>
                                  Edit
                                  <span className="ml-auto text-[10px] opacity-40">15 min</span>
                                </button>
                              )}

                              {/* Delete for me — always */}
                              {!isDeleted && !isSending && (
                                <button
                                  onClick={() => void deleteMessage(msg.id, "me")}
                                  className="flex items-center gap-2.5 px-4 py-3 text-xs font-medium hover:bg-white/10 transition-all text-left"
                                  style={{ color: "#fbbf24" }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                                  </svg>
                                  Delete for Me
                                </button>
                              )}

                              {/* Delete for everyone — sender/admin + time limit */}
                              {canDeleteForAll && (
                                <button
                                  onClick={() => void deleteMessage(msg.id, "everyone")}
                                  className="flex items-center gap-2.5 px-4 py-3 text-xs font-medium hover:bg-white/10 transition-all text-left border-t"
                                  style={{ color: "#f87171", borderColor: "rgba(255,255,255,0.07)" }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                  </svg>
                                  Delete for Everyone
                                  {!isAdmin && <span className="ml-auto text-[10px] opacity-40">24h</span>}
                                </button>
                              )}
                            </div>
                          )}

                          {/* ── Bubble ── */}
                          {isDeleted ? (
                            /* Deleted message */
                            <div className="msg-deleted-appear flex items-center gap-2 px-3.5 py-2.5 rounded-2xl"
                              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.8} style={{ width: 14, height: 14 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                              </svg>
                              <span className="text-xs italic" style={{ color: "rgba(255,255,255,0.3)" }}>
                                {isMe ? "You deleted this message" : "This message was deleted"}
                              </span>
                            </div>
                          ) : isEditing ? (
                            /* Edit mode */
                            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", minWidth: 200 }}>
                              <textarea
                                autoFocus
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void saveEdit(msg.id); }
                                  if (e.key === "Escape") setEditingId(null);
                                }}
                                className="w-full bg-transparent text-sm text-white outline-none resize-none px-3.5 pt-2.5 pb-1"
                                style={{ minWidth: 200, maxWidth: 320 }}
                                rows={2}
                              />
                              <div className="flex items-center justify-end gap-2 px-3 pb-2">
                                <button onClick={() => setEditingId(null)}
                                  className="text-[10px] px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                                  Cancel
                                </button>
                                <button onClick={() => void saveEdit(msg.id)}
                                  className="text-[10px] px-2.5 py-1 rounded-full font-semibold text-white" style={{ background: "#7c3aed" }}>
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Normal bubble */
                            <div className="msg-bubble px-3.5 py-2.5 rounded-2xl"
                              style={{
                                background: isFailed ? "rgba(239,68,68,0.15)" : isMe ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "rgba(255,255,255,0.07)",
                                borderBottomRightRadius: isMe ? 4 : undefined,
                                borderBottomLeftRadius: !isMe ? 4 : undefined,
                                boxShadow: isMe && !isFailed ? "0 2px 12px rgba(124,58,237,0.3)" : "none",
                                opacity: isSending ? 0.75 : 1,
                                border: isFailed ? "1px solid rgba(239,68,68,0.3)" : "none",
                              }}>
                              <p className="text-sm text-white leading-relaxed" style={{ wordBreak: "break-word" }}>
                                {msg.content}
                              </p>
                              {/* Time + status */}
                              <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                                {msg.editedAt && (
                                  <span className="text-[10px] italic" style={{ color: "rgba(255,255,255,0.35)" }}>edited</span>
                                )}
                                <span className="text-[10px]" style={{ color: isMe ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.3)" }}>
                                  {formatTime(msg.createdAt)}
                                </span>
                                {isMe && <MessageStatus status={msg.status} isRead={isRead} />}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Failed: tap to retry */}
                        {isFailed && (
                          <button onClick={() => void retryMessage(msg)}
                            className="text-[10px] mt-1 px-2 py-0.5 rounded-full"
                            style={{ color: "#f87171", background: "rgba(239,68,68,0.1)" }}>
                            ↺ Tap to retry
                          </button>
                        )}
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
