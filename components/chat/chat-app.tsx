"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";

// ── Types ─────────────────────────────────────────────────────────────────────
type Employee = { id: string; name: string; employeeId: string; role: string; designation: string | null };
type Member   = { id: string; user: { id: string; name: string; employeeId: string; role: string; lastSeenAt: string | null } };
type LastMsg  = { id: string; content: string; sender: { id: string; name: string }; createdAt: string };
type Room     = { id: string; name: string | null; type: string; members: Member[]; messages: LastMsg[] };
type ReplyTo  = { id: string; content: string; isDeleted: boolean; sender: { id: string; name: string } };
type Message  = {
  id: string; content: string; senderId: string;
  sender: { id: string; name: string }; createdAt: string;
  readBy: { userId: string }[];
  editedAt?: string | null;
  isDeleted?: boolean;
  replyToId?: string | null;
  replyTo?: ReplyTo | null;
  reactions?: Record<string, string[]> | null;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
  attachmentMeta?: { duration?: number } | null;
  pinnedAt?: string | null;
  // client-only
  status?: "sending" | "failed";
  tempId?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getRoomName(room: Room, uid: string) {
  if (room.type === "group") return room.name || "Group Chat";
  // If the viewer is NOT a member (e.g. admin monitoring), show BOTH
  // participants so it's clear who messaged whom.
  const isMember = room.members.some((m) => m.user.id === uid);
  if (!isMember) {
    const names = room.members.map((m) => m.user.name);
    if (names.length >= 2) return names.join(" ↔ ");
    return names[0] || "Direct Message";
  }
  return room.members.find((m) => m.user.id !== uid)?.user.name || "Direct Message";
}

const GRAD_PALETTE = [
  ["#7c3aed","#4f46e5"], ["#db2777","#9333ea"], ["#059669","#0891b2"],
  ["#d97706","#dc2626"], ["#0284c7","#7c3aed"], ["#16a34a","#059669"],
  ["#9333ea","#ec4899"], ["#0891b2","#06b6d4"],
];
function getAvatarColors(name: string): [string, string] {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return GRAD_PALETTE[Math.abs(h) % GRAD_PALETTE.length] as [string, string];
}

function fmt(d: string) {
  return new Date(d).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit", hour12: true });
}
function fmtSidebar(d: string) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  const date = new Date(d);
  if (diff < 86400) return date.toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit", hour12: true });
  if (diff < 604800) return date.toLocaleDateString("en-PK", { weekday: "short" });
  return date.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
}
function fmtDateSep(d: string) {
  const date = new Date(d);
  const now  = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yest  = new Date(today.getTime() - 86400000);
  const msgD  = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (msgD.getTime() === today.getTime()) return "Today";
  if (msgD.getTime() === yest.getTime())  return "Yesterday";
  return date.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });
}
function sameDay(a: string, b: string) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}
function isOnline(t: string | null | undefined) {
  return !!t && Date.now() - new Date(t).getTime() < 60_000;
}
function fmtLastSeen(t: string | null | undefined) {
  if (!t) return "Offline";
  const s = Math.floor((Date.now() - new Date(t).getTime()) / 1000);
  if (s < 60)    return "Online";
  if (s < 3600)  return `Last seen ${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `Last seen ${Math.floor(s / 3600)}h ago`;
  return `Last seen ${new Date(t).toLocaleDateString([], { day: "numeric", month: "short" })}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Avatar({ name, size = 40, cls = "" }: { name: string; size?: number; cls?: string }) {
  const [c1, c2] = getAvatarColors(name);
  return (
    <div className={`flex items-center justify-center font-bold text-white flex-shrink-0 ${cls}`}
      style={{ width: size, height: size, borderRadius: size * 0.3, background: `linear-gradient(135deg,${c1},${c2})`, fontSize: size * 0.38 }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

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

function MsgStatus({ status, isRead }: { status?: "sending" | "failed"; isRead: boolean }) {
  if (status === "sending") return (
    <svg viewBox="0 0 16 16" fill="none" style={{ width: 13, height: 13, flexShrink: 0 }}>
      <circle cx="8" cy="8" r="6.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1.4"/>
      <path d="M8 5v3.5l2 1.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (status === "failed") return (
    <svg viewBox="0 0 16 16" fill="none" style={{ width: 13, height: 13, flexShrink: 0 }}>
      <circle cx="8" cy="8" r="6.5" stroke="#f87171" strokeWidth="1.4"/>
      <path d="M8 5v4" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="8" cy="11" r="0.8" fill="#f87171"/>
    </svg>
  );
  const color = isRead ? "#60a5fa" : "rgba(255,255,255,0.4)";
  return (
    <svg viewBox="0 0 18 11" fill="none" style={{ width: 16, height: 10, flexShrink: 0 }}>
      <path d="M1 5.5L4.5 9L9.5 1" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 5.5L9.5 9L14.5 1" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Typing dots animation
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-[3px]">
      {[0,1,2].map((i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400"
          style={{ animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
    </span>
  );
}

const QUICK_EMOJIS = ["👍","❤️","😂","😮","😢","🔥"];

// ── Main Component ────────────────────────────────────────────────────────────
export default function ChatApp({ currentUserId, currentUserName, isAdmin, employees }: {
  currentUserId: string; currentUserName: string; isAdmin: boolean; employees: Employee[];
}) {
  const [rooms, setRooms]               = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages]         = useState<Message[]>([]);
  const [input, setInput]               = useState("");
  const [isUploading, setIsUploading]   = useState(false);
  const [isRecording, setIsRecording]   = useState(false);
  const mediaRecorderRef                = useRef<MediaRecorder | null>(null);
  const imageInputRef                   = useRef<HTMLInputElement | null>(null);
  const fileInputRef                    = useRef<HTMLInputElement | null>(null);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [editContent, setEditContent]   = useState("");
  const [menuMsgId, setMenuMsgId]       = useState<string | null>(null);
  const [menuOpenTime, setMenuOpenTime] = useState(0);
  const [reactionMsgId, setReactionMsgId] = useState<string | null>(null);
  const [vanishingIds, setVanishingIds] = useState<Set<string>>(new Set());
  const [showNewChat, setShowNewChat]   = useState(false);
  const [newChatType, setNewChatType]   = useState<"direct" | "group">("direct");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupName, setGroupName]       = useState("");
  const [roleFilter, setRoleFilter]     = useState("");
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [spyMode, setSpyMode]           = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [lastSeenMap, setLastSeenMap]   = useState<Record<string, string | null>>({});
  const [typingUsers, setTypingUsers]   = useState<Record<string, string>>({}); // userId → name
  const [replyTo, setReplyTo]           = useState<Message | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [newMsgCount, setNewMsgCount]   = useState(0);
  const [msgSearch, setMsgSearch]           = useState("");
  const [showMsgSearch, setShowMsgSearch]   = useState(false);
  const [longPressMsg, setLongPressMsg]     = useState<Message | null>(null);
  const [longPressMsgTime, setLongPressMsgTime] = useState(0);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const activeRoomIdRef      = useRef<string | null>(null);
  const scrollInstantRef     = useRef(true);
  const isAtBottomRef        = useRef(true);
  const inputRef             = useRef<HTMLTextAreaElement>(null);
  const realtimeChannelRef   = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevRoomsRef         = useRef<Room[]>([]);
  const loadRoomsTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Swipe-to-reply refs (direct DOM — no re-renders needed)
  const swipeStartXRef       = useRef(0);
  const swipeStartYRef       = useRef(0);
  const swipingIdRef         = useRef<string | null>(null);
  const swipeLockedRef       = useRef(false); // locked to horizontal
  const longPressTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? null;
  // Admin can READ any room (monitor mode) but may only send in rooms they
  // actually belong to. Non-members see a view-only banner instead of input.
  const activeReadOnly =
    !!activeRoom && !activeRoom.members.some((m) => m.user.id === currentUserId);

  // ── Load rooms (debounced) ────────────────────────────────────────────────
  const loadRooms = useCallback(async () => {
    if (loadRoomsTimerRef.current) clearTimeout(loadRoomsTimerRef.current);
    return new Promise<void>((resolve) => {
      loadRoomsTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch("/api/chat/rooms");
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) setRooms(data);
          }
        } catch { /* silent */ }
        finally { setLoadingRooms(false); }
        resolve();
      }, 200);
    });
  }, []);

  useEffect(() => { void loadRooms(); }, [loadRooms]);

  // ── Notification permission ───────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  // ── Load messages ─────────────────────────────────────────────────────────
  const loadMessages = useCallback(async (roomId: string) => {
    setLoadingMessages(true);
    setMsgSearch("");
    setShowMsgSearch(false);
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`);
      if (res.ok) {
        scrollInstantRef.current = true;
        setMessages(await res.json());
      }
    } catch { /* silent */ }
    finally { setLoadingMessages(false); }
  }, []);

  useEffect(() => { activeRoomIdRef.current = activeRoomId; }, [activeRoomId]);

  // ── Supabase Realtime channel per room ────────────────────────────────────
  useEffect(() => {
    if (!activeRoomId) return;
    void loadMessages(activeRoomId);
    setTypingUsers({});
    setReplyTo(null);

    if (realtimeChannelRef.current) {
      void supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }

    const ch = supabase.channel(`room:${activeRoomId}`, { config: { broadcast: { self: false } } });

    ch.on("broadcast", { event: "new_message" }, ({ payload }: { payload: Message }) => {
      if (activeRoomIdRef.current !== activeRoomId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === payload.id)) return prev;
        const tempIdx = prev.findIndex(
          (m) => m.tempId && m.senderId === payload.senderId && m.content === payload.content && m.status === "sending"
        );
        if (tempIdx !== -1) { const n = [...prev]; n[tempIdx] = payload; return n; }
        return [...prev, payload];
      });
      if (isAtBottomRef.current) {
        scrollInstantRef.current = false;
      } else {
        setNewMsgCount((c) => c + 1);
        setShowScrollBtn(true);
      }
      void fetch(`/api/chat/rooms/${activeRoomId}/read`, { method: "POST" });
      // Update sidebar last message locally (no API call needed)
      setRooms((prev) => prev.map((r) => {
        if (r.id !== activeRoomId) return r;
        return { ...r, messages: [{ id: payload.id, content: payload.content, sender: payload.sender, createdAt: payload.createdAt }] };
      }));
    })

    .on("broadcast", { event: "edit_message" }, ({ payload }: { payload: { messageId: string; content: string } }) => {
      setMessages((prev) => prev.map((m) =>
        m.id === payload.messageId ? { ...m, content: payload.content, editedAt: new Date().toISOString() } : m
      ));
    })

    .on("broadcast", { event: "delete_message" }, ({ payload }: { payload: { messageId: string } }) => {
      spawnParticles(payload.messageId);
      setVanishingIds((prev) => new Set([...prev, payload.messageId]));
      setTimeout(() => {
        setMessages((prev) => prev.map((m) =>
          m.id === payload.messageId ? { ...m, isDeleted: true, content: "" } : m
        ));
        setVanishingIds((prev) => { const n = new Set(prev); n.delete(payload.messageId); return n; });
      }, 420);
    })

    .on("broadcast", { event: "reaction" }, ({ payload }: { payload: { messageId: string; reactions: Record<string, string[]> } }) => {
      setMessages((prev) => prev.map((m) =>
        m.id === payload.messageId ? { ...m, reactions: payload.reactions } : m
      ));
    })

    .on("broadcast", { event: "typing" }, ({ payload }: { payload: { userId: string; name: string; isTyping: boolean } }) => {
      if (payload.userId === currentUserId) return;
      setTypingUsers((prev) => {
        if (payload.isTyping) return { ...prev, [payload.userId]: payload.name };
        const next = { ...prev }; delete next[payload.userId]; return next;
      });
    })

    .on("broadcast", { event: "read" }, ({ payload }: { payload: { userId: string; messageIds: string[] } }) => {
      if (payload.userId === currentUserId) return;
      const ids = new Set(payload.messageIds);
      setMessages((prev) => prev.map((m) =>
        ids.has(m.id) && !m.readBy?.some((r) => r.userId === payload.userId)
          ? { ...m, readBy: [...(m.readBy ?? []), { userId: payload.userId }] }
          : m
      ));
    })

    .subscribe();

    realtimeChannelRef.current = ch;
    return () => {
      void supabase.removeChannel(ch);
      realtimeChannelRef.current = null;
    };
  }, [activeRoomId, loadMessages, loadRooms, currentUserId]);

  // ── Background Realtime channels — sidebar + notifications (no polling) ────
  // Subscribe to every room the user is in. When a new_message arrives in a
  // background room (not currently open), update sidebar + send notification.
  const bgChannelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);

  useEffect(() => {
    if (rooms.length === 0) return;

    // Tear down old background channels
    bgChannelsRef.current.forEach((ch) => void supabase.removeChannel(ch));
    bgChannelsRef.current = [];

    rooms.forEach((room) => {
      // Active room is handled by the main channel — skip
      if (room.id === activeRoomIdRef.current) return;

      const ch = supabase.channel(`bg:${room.id}`, { config: { broadcast: { self: false } } });
      ch.on("broadcast", { event: "new_message" }, ({ payload }: { payload: Message }) => {
        if (payload.senderId === currentUserId) return;
        if (room.id === activeRoomIdRef.current) return; // became active

        // Update sidebar last message
        setRooms((prev) => prev.map((r) => {
          if (r.id !== room.id) return r;
          return { ...r, messages: [{ id: payload.id, content: payload.content, sender: payload.sender, createdAt: payload.createdAt }] };
        }));

        setUnreadCounts((c) => ({ ...c, [room.id]: (c[room.id] ?? 0) + 1 }));

        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification(`${payload.sender?.name ?? "Someone"} · ${getRoomName(room, currentUserId)}`, {
            body: payload.content?.slice(0, 80) || "New message",
            icon: "/favicon.ico",
            tag: room.id,
          });
        }
      }).subscribe();

      bgChannelsRef.current.push(ch);
    });

    return () => {
      bgChannelsRef.current.forEach((ch) => void supabase.removeChannel(ch));
      bgChannelsRef.current = [];
    };
  }, [rooms, currentUserId]);

  // ── Visibility change ─────────────────────────────────────────────────────
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

  // ── Heartbeat ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const beat = () => fetch("/api/user/heartbeat", { method: "POST" }).catch(() => {});
    void beat();
    const t = setInterval(beat, 30_000);
    return () => clearInterval(t);
  }, []);

  // ── Sync lastSeenAt ───────────────────────────────────────────────────────
  useEffect(() => {
    const map: Record<string, string | null> = {};
    rooms.forEach((r) => r.members.forEach((m) => { map[m.user.id] = m.user.lastSeenAt; }));
    setLastSeenMap((prev) => ({ ...prev, ...map }));
  }, [rooms]);

  // ── Scroll management ─────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const c = messagesContainerRef.current;
    if (!c) return;
    if (scrollInstantRef.current) {
      c.scrollTop = c.scrollHeight;
      setShowScrollBtn(false);
      setNewMsgCount(0);
    } else if (isAtBottomRef.current) {
      c.scrollTo({ top: c.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  function handleScroll() {
    const c = messagesContainerRef.current;
    if (!c) return;
    const atBottom = c.scrollHeight - c.scrollTop - c.clientHeight < 80;
    isAtBottomRef.current = atBottom;
    if (atBottom) { setShowScrollBtn(false); setNewMsgCount(0); }
    else setShowScrollBtn(true);
  }

  function scrollToBottom() {
    const c = messagesContainerRef.current;
    if (!c) return;
    c.scrollTo({ top: c.scrollHeight, behavior: "smooth" });
    setShowScrollBtn(false);
    setNewMsgCount(0);
  }

  // ── Auto-resize textarea ──────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";

    // Typing indicator
    if (!activeRoomId) return;
    void realtimeChannelRef.current?.send({
      type: "broadcast", event: "typing",
      payload: { userId: currentUserId, name: currentUserName, isTyping: true },
    });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      void realtimeChannelRef.current?.send({
        type: "broadcast", event: "typing",
        payload: { userId: currentUserId, name: currentUserName, isTyping: false },
      });
    }, 3000);
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  async function openRoom(room: Room) {
    if (isAdmin && spyMode) await fetch(`/api/chat/rooms/${room.id}/spy`, { method: "POST" });
    setUnreadCounts((prev) => ({ ...prev, [room.id]: 0 }));
    setMessages([]);
    setActiveRoomId(room.id);
    setReplyTo(null);
    setMenuMsgId(null);
    setReactionMsgId(null);
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
    const content   = input.trim();
    const roomId    = activeRoomId;
    const tempId    = `temp_${Date.now()}`;
    const replyRef  = replyTo;

    // Stop typing indicator
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    void realtimeChannelRef.current?.send({
      type: "broadcast", event: "typing",
      payload: { userId: currentUserId, name: currentUserName, isTyping: false },
    });

    const optimistic: Message = {
      id: tempId, tempId, content, senderId: currentUserId,
      sender: { id: currentUserId, name: currentUserName },
      createdAt: new Date().toISOString(),
      readBy: [], status: "sending",
      replyToId: replyRef?.id ?? null,
      replyTo: replyRef ? { id: replyRef.id, content: replyRef.content, isDeleted: !!replyRef.isDeleted, sender: replyRef.sender } : null,
    };

    scrollInstantRef.current = false;
    isAtBottomRef.current    = true;
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    setReplyTo(null);
    if (inputRef.current) inputRef.current.style.height = "auto";

    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, replyToId: replyRef?.id ?? null }),
      });
      if (res.ok) {
        const confirmed: Message = await res.json();
        setMessages((prev) => prev.map((m) => m.tempId === tempId ? confirmed : m));
        void realtimeChannelRef.current?.send({
          type: "broadcast", event: "new_message", payload: confirmed,
        });
        // Update sidebar locally for sender
        setRooms((prev) => prev.map((r) => {
          if (r.id !== roomId) return r;
          return { ...r, messages: [{ id: confirmed.id, content: confirmed.content, sender: confirmed.sender, createdAt: confirmed.createdAt }] };
        }));
      } else {
        setMessages((prev) => prev.map((m) => m.tempId === tempId ? { ...m, status: "failed" } : m));
      }
    } catch {
      setMessages((prev) => prev.map((m) => m.tempId === tempId ? { ...m, status: "failed" } : m));
    }
  }

  // ── Attachment upload + send (web) ──────────────────────────────────────────
  async function uploadToStorage(blob: Blob, kind: string, ext: string, contentType: string) {
    const path = `${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("chat-media").upload(path, blob, { contentType, upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from("chat-media").getPublicUrl(path);
    return { url: data.publicUrl, size: blob.size };
  }

  async function sendAttachment(att: {
    attachmentUrl: string; attachmentType: string; attachmentName?: string | null;
    attachmentSize?: number; attachmentMeta?: { duration?: number };
  }) {
    const roomId = activeRoomId;
    if (!roomId) return;
    const tempId = `temp_${Date.now()}`;
    const replyRef = replyTo;
    const optimistic: Message = {
      id: tempId, tempId, content: "", senderId: currentUserId,
      sender: { id: currentUserId, name: currentUserName },
      createdAt: new Date().toISOString(), readBy: [], status: "sending",
      replyToId: replyRef?.id ?? null,
      replyTo: replyRef ? { id: replyRef.id, content: replyRef.content, isDeleted: !!replyRef.isDeleted, sender: replyRef.sender } : null,
      ...att,
    };
    scrollInstantRef.current = false;
    isAtBottomRef.current = true;
    setMessages((prev) => [...prev, optimistic]);
    setReplyTo(null);
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "", replyToId: replyRef?.id ?? null, ...att }),
      });
      if (res.ok) {
        const confirmed: Message = await res.json();
        setMessages((prev) => prev.map((m) => m.tempId === tempId ? confirmed : m));
        void realtimeChannelRef.current?.send({ type: "broadcast", event: "new_message", payload: confirmed });
      } else {
        setMessages((prev) => prev.map((m) => m.tempId === tempId ? { ...m, status: "failed" } : m));
      }
    } catch {
      setMessages((prev) => prev.map((m) => m.tempId === tempId ? { ...m, status: "failed" } : m));
    }
  }

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>, kind: "image" | "file") {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setIsUploading(true);
    try {
      const ext = (file.name.split(".").pop() || (kind === "image" ? "jpg" : "bin")).toLowerCase();
      const { url, size } = await uploadToStorage(file, kind, ext, file.type || "application/octet-stream");
      await sendAttachment({ attachmentUrl: url, attachmentType: kind, attachmentName: file.name, attachmentSize: size });
    } catch (err) { console.error(err); alert("Upload failed"); }
    setIsUploading(false);
  }

  async function toggleVoiceRecord() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4"
        : MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const mr = new MediaRecorder(stream, { mimeType: mime });
      const chunks: Blob[] = [];
      const startedAt = Date.now();
      mr.ondataavailable = (ev) => { if (ev.data.size) chunks.push(ev.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        const blob = new Blob(chunks, { type: mime });
        const duration = Date.now() - startedAt;
        if (duration < 800) return;
        setIsUploading(true);
        try {
          const ext = mime.includes("mp4") ? "m4a" : "webm";
          const { url, size } = await uploadToStorage(blob, "voice", ext, mime);
          await sendAttachment({ attachmentUrl: url, attachmentType: "voice", attachmentName: "voice." + ext, attachmentSize: size, attachmentMeta: { duration } });
        } catch (err) { console.error(err); alert("Upload failed"); }
        setIsUploading(false);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
    } catch { alert("Microphone access needed"); }
  }

  async function saveEdit(msgId: string) {
    if (!editContent.trim() || !activeRoomId) return;
    const newContent = editContent.trim();
    setMessages((prev) => prev.map((m) =>
      m.id === msgId ? { ...m, content: newContent, editedAt: new Date().toISOString() } : m
    ));
    setEditingId(null);
    await fetch(`/api/chat/rooms/${activeRoomId}/messages/${msgId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newContent }),
    });
    void realtimeChannelRef.current?.send({
      type: "broadcast", event: "edit_message", payload: { messageId: msgId, content: newContent },
    });
  }

  async function reactToMessage(msgId: string, emoji: string) {
    if (!activeRoomId) return;
    setReactionMsgId(null);
    // Optimistic
    setMessages((prev) => prev.map((m) => {
      if (m.id !== msgId) return m;
      const r = { ...(m.reactions ?? {}) } as Record<string, string[]>;
      const users = r[emoji] ?? [];
      if (users.includes(currentUserId)) {
        const next = users.filter((u) => u !== currentUserId);
        if (next.length === 0) delete r[emoji]; else r[emoji] = next;
      } else { r[emoji] = [...users, currentUserId]; }
      return { ...m, reactions: r };
    }));
    const res = await fetch(`/api/chat/rooms/${activeRoomId}/messages/${msgId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reaction: emoji }),
    });
    if (res.ok) {
      const { reactions } = await res.json();
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, reactions } : m));
      void realtimeChannelRef.current?.send({
        type: "broadcast", event: "reaction", payload: { messageId: msgId, reactions },
      });
    }
  }

  function spawnParticles(msgId: string) {
    const bubble = document.querySelector(`[data-msgid="${msgId}"] .msg-bubble`) as HTMLElement | null;
    if (!bubble) return;
    const rect = bubble.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top  + rect.height / 2;
    const colors = ["#a78bfa","#c4b5fd","#7c3aed","#e879f9","#f0abfc","#818cf8","#60a5fa","#ffffff","#ddd6fe","#fbcfe8","#6ee7b7"];
    const TOTAL = 24;
    for (let i = 0; i < TOTAL; i++) {
      const angle = ((Math.PI * 2) / TOTAL) * i + (Math.random() - 0.5) * 0.5;
      const dist  = 35 + Math.random() * 90;
      const tx = Math.cos(angle) * dist, ty = Math.sin(angle) * dist;
      const size = 2 + Math.random() * 6;
      const isRound = Math.random() > 0.35;
      const el = document.createElement("div");
      el.style.cssText = `position:fixed;left:${cx-size/2}px;top:${cy-size/2}px;width:${size}px;height:${isRound?size:size*0.5}px;border-radius:${isRound?"50%":"2px"};background:${colors[Math.floor(Math.random()*colors.length)]};pointer-events:none;z-index:99999;will-change:transform,opacity;`;
      document.body.appendChild(el);
      el.animate(
        [{ transform:"translate(0,0) scale(1)",opacity:1 },
         { transform:`translate(${tx*.4}px,${ty*.4}px) scale(1.1)`,opacity:1,offset:.15 },
         { transform:`translate(${tx}px,${ty}px) scale(0)`,opacity:0 }],
        { duration: 380 + Math.random()*320, delay: Math.random()*60, easing:"cubic-bezier(0.15,0.8,0.35,1)", fill:"forwards" }
      ).onfinish = () => el.remove();
    }
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = 20 + Math.random() * 50;
      const tx = Math.cos(angle)*dist, ty = Math.sin(angle)*dist;
      const size = 7 + Math.random() * 8;
      const el = document.createElement("div");
      el.style.cssText = `position:fixed;left:${cx-size/2}px;top:${cy-size/2}px;width:${size}px;height:${size}px;border-radius:50%;background:${colors[Math.floor(Math.random()*4)]};opacity:.45;pointer-events:none;z-index:99998;filter:blur(2px);will-change:transform,opacity;`;
      document.body.appendChild(el);
      el.animate(
        [{ transform:"translate(0,0) scale(1)",opacity:.45 },{ transform:`translate(${tx}px,${ty}px) scale(0)`,opacity:0 }],
        { duration: 300+Math.random()*200, delay: Math.random()*40, easing:"ease-out", fill:"forwards" }
      ).onfinish = () => el.remove();
    }
  }

  async function deleteMessage(msgId: string, deleteType: "everyone" | "me") {
    if (!activeRoomId) return;
    setMenuMsgId(null);
    spawnParticles(msgId);
    setVanishingIds((prev) => new Set([...prev, msgId]));
    setTimeout(() => {
      if (deleteType === "me") setMessages((prev) => prev.filter((m) => m.id !== msgId));
      else setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, isDeleted: true, content: "" } : m));
      setVanishingIds((prev) => { const n = new Set(prev); n.delete(msgId); return n; });
    }, 420);
    await fetch(`/api/chat/rooms/${activeRoomId}/messages/${msgId}`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleteType }),
    });
    if (deleteType === "everyone") {
      void realtimeChannelRef.current?.send({
        type: "broadcast", event: "delete_message", payload: { messageId: msgId },
      });
    }
  }

  async function retryMessage(msg: Message) {
    if (!activeRoomId) return;
    setMessages((prev) => prev.map((m) => m.tempId === msg.tempId ? { ...m, status: "sending" } : m));
    try {
      const res = await fetch(`/api/chat/rooms/${activeRoomId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: msg.content, replyToId: msg.replyToId ?? null }),
      });
      if (res.ok) {
        const confirmed: Message = await res.json();
        setMessages((prev) => prev.map((m) => m.tempId === msg.tempId ? confirmed : m));
        void realtimeChannelRef.current?.send({ type: "broadcast", event: "new_message", payload: confirmed });
      } else setMessages((prev) => prev.map((m) => m.tempId === msg.tempId ? { ...m, status: "failed" } : m));
    } catch { setMessages((prev) => prev.map((m) => m.tempId === msg.tempId ? { ...m, status: "failed" } : m)); }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); }
    if (e.key === "Escape" && replyTo) setReplyTo(null);
  }

  // ── Mobile: Long press ────────────────────────────────────────────────────
  function onMsgTouchStart(e: React.TouchEvent, msg: Message) {
    if (activeReadOnly || msg.isDeleted || msg.status === "sending") return;
    longPressTimerRef.current = setTimeout(() => {
      navigator.vibrate?.(50);
      setLongPressMsg(msg);
      setLongPressMsgTime(Date.now());
      // Cancel any swipe in progress
      swipingIdRef.current = null;
    }, 480);
  }
  function onMsgTouchEnd() {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  }

  // ── Mobile: Swipe right to reply ─────────────────────────────────────────
  function onSwipeTouchStart(e: React.TouchEvent, msgId: string) {
    swipeStartXRef.current  = e.touches[0].clientX;
    swipeStartYRef.current  = e.touches[0].clientY;
    swipingIdRef.current    = msgId;
    swipeLockedRef.current  = false;
  }

  function onSwipeTouchMove(e: React.TouchEvent, msgId: string) {
    if (swipingIdRef.current !== msgId) return;
    if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }

    const dx = e.touches[0].clientX - swipeStartXRef.current;
    const dy = Math.abs(e.touches[0].clientY - swipeStartYRef.current);

    // Lock direction on first significant move
    if (!swipeLockedRef.current) {
      if (dy > 8 && dy > Math.abs(dx)) { swipingIdRef.current = null; return; } // vertical scroll wins
      if (Math.abs(dx) > 8) swipeLockedRef.current = true;
      else return;
    }

    if (dx <= 0 || dx > 90) return; // only right swipe, max 90px

    const offset  = Math.min(dx * 0.55, 50);
    const opacity = Math.min(dx / 60, 1);

    const wrap = document.querySelector(`[data-msgid="${msgId}"] .swipe-wrap`) as HTMLElement | null;
    const icon = document.querySelector(`[data-msgid="${msgId}"] .swipe-icon`) as HTMLElement | null;
    if (wrap) wrap.style.transform = `translateX(${offset}px)`;
    if (icon) { icon.style.opacity = String(opacity); icon.style.transform = `scale(${0.5 + opacity * 0.5})`; }
  }

  function onSwipeTouchEnd(e: React.TouchEvent, msg: Message) {
    if (swipingIdRef.current !== msg.id && swipingIdRef.current !== msg.tempId) return;

    const dx = e.changedTouches[0].clientX - swipeStartXRef.current;
    swipingIdRef.current   = null;
    swipeLockedRef.current = false;

    const wrap = document.querySelector(`[data-msgid="${msg.id}"] .swipe-wrap`) as HTMLElement | null;
    const icon = document.querySelector(`[data-msgid="${msg.id}"] .swipe-icon`) as HTMLElement | null;

    // Snap back with spring animation
    if (wrap) { wrap.style.transition = "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)"; wrap.style.transform = "translateX(0)"; setTimeout(() => { if (wrap) wrap.style.transition = ""; }, 260); }
    if (icon) { icon.style.transition = "opacity 0.2s,transform 0.2s"; icon.style.opacity = "0"; icon.style.transform = "scale(0)"; setTimeout(() => { if (icon) icon.style.transition = ""; }, 220); }

    if (dx > 50 && !msg.isDeleted && msg.status !== "sending") {
      navigator.vibrate?.(30);
      setReplyTo(msg);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }

  async function createChat() {
    if (selectedMembers.length === 0) { toast.error("Select at least one member"); return; }
    const res = await fetch("/api/chat/rooms", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: newChatType, name: newChatType === "group" ? groupName : undefined, memberIds: selectedMembers }),
    });
    if (res.ok) {
      const room = await res.json();
      setRooms((prev) => { const e = prev.find((r) => r.id === room.id); return e ? prev.map((r) => r.id === room.id ? room : r) : [room, ...prev]; });
      setMessages([]); setActiveRoomId(room.id); setShowNewChat(false);
      setSelectedMembers([]); setGroupName(""); setSidebarSearch("");
    } else toast.error("Failed to create chat");
  }

  const filteredEmployees = employees.filter((e) =>
    (!roleFilter || e.role === roleFilter) &&
    (!sidebarSearch || e.name.toLowerCase().includes(sidebarSearch.toLowerCase()))
  );
  const filteredRooms = rooms.filter((r) =>
    !sidebarSearch || getRoomName(r, currentUserId).toLowerCase().includes(sidebarSearch.toLowerCase())
  );
  const typingNames = Object.values(typingUsers);
  const displayedMessages = msgSearch.trim()
    ? messages.filter((m) => !m.isDeleted && m.content.toLowerCase().includes(msgSearch.toLowerCase()))
    : messages;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Typing dots keyframe — injected once */}
      <style>{`
        @keyframes typing-dot { 0%,80%,100%{transform:scale(0.6);opacity:.4} 40%{transform:scale(1);opacity:1} }
        .msg-vanishing { animation: vanish 0.4s ease-out forwards; }
        @keyframes vanish { 0%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(0.5)} }
        .msg-deleted-appear { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
      `}</style>

      <div className="flex overflow-hidden" style={{ height: "calc(100vh - 57px)", background: "#0a0a14" }}
        onClick={() => { setMenuMsgId(null); setReactionMsgId(null); }}>

        {/* ══════════════════════════ SIDEBAR ══════════════════════════ */}
        <div className={`flex-col flex-shrink-0 ${activeRoomId ? "hidden md:flex" : "flex w-full md:w-auto"}`}>
        <div className="flex flex-col h-full md:w-[300px] w-full"
          style={{ background: "#0f0f1c", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

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
            <div className="flex items-center gap-2 px-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2} style={{ width: 14, height: 14, flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
              </svg>
              <input value={sidebarSearch} onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="Search chats..."
                className="flex-1 py-2.5 text-xs bg-transparent outline-none text-white placeholder:text-white/30" />
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
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: "rgba(124,58,237,0.1)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth={1.5} style={{ width: 24, height: 24 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-white/60">No conversations</p>
                <p className="text-xs mt-1 text-white/30">Start a new chat</p>
              </div>
            ) : filteredRooms.map((room) => {
              const lastMsg  = room.messages[0];
              const isActive = room.id === activeRoomId;
              const isGroup  = room.type === "group";
              const unread   = unreadCounts[room.id] ?? 0;
              const name     = getRoomName(room, currentUserId);
              return (
                <div key={room.id} className="group/room relative mx-2 mb-0.5">
                  <button onClick={() => openRoom(room)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all text-left"
                    style={{ background: isActive ? "rgba(124,58,237,0.18)" : "transparent" }}>
                    <div className="relative">
                      {isGroup ? <GroupAvatar size={46} /> : <Avatar name={name} size={46} />}
                      {unread > 0 && !isActive && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1"
                          style={{ background: "#22c55e", boxShadow: "0 0 0 2px #0f0f1c" }}>
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className={`text-sm truncate ${unread > 0 && !isActive ? "font-bold text-white" : "font-semibold"}`}
                          style={{ color: isActive ? "white" : "rgba(255,255,255,0.85)" }}>
                          {name}
                        </p>
                        {lastMsg && (
                          <span className="text-[11px] flex-shrink-0"
                            style={{ color: unread > 0 && !isActive ? "#22c55e" : "rgba(255,255,255,0.3)" }}>
                            {fmtSidebar(lastMsg.createdAt)}
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
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 flex-shrink-0 flex items-center gap-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
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
        </div>

        {/* ══════════════════════════ CHAT AREA ══════════════════════════ */}
        <div className={`flex-1 flex flex-col overflow-hidden ${!activeRoomId ? "hidden md:flex" : "flex"}`}
          style={{ background: "#0d0d1a" }}>

          {!activeRoom ? (
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
          ) : (() => {
            const otherMember = activeRoom.type === "direct"
              ? activeRoom.members.find((m) => m.user.id !== currentUserId) : null;
            const otherLastSeen = otherMember ? (lastSeenMap[otherMember.user.id] ?? otherMember.user.lastSeenAt) : null;
            const online = isOnline(otherLastSeen);
            return (
              <>
                {/* ── Header ── */}
                <div className="flex items-center gap-3 px-3 md:px-4 py-3 flex-shrink-0"
                  style={{ background: "rgba(15,15,28,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
                  <button className="md:hidden flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                    onClick={() => setActiveRoomId(null)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} style={{ width: 16, height: 16 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="relative">
                    {activeRoom.type === "group" ? <GroupAvatar size={40} /> : <Avatar name={getRoomName(activeRoom, currentUserId)} size={40} />}
                    {activeRoom.type === "direct" && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                        style={{ background: online ? "#22c55e" : "rgba(255,255,255,0.2)", borderColor: "#0d0d1a" }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white leading-tight">{getRoomName(activeRoom, currentUserId)}</p>
                    <p className="text-xs mt-0.5 flex items-center gap-1.5 leading-none" style={{ color: online ? "#4ade80" : "rgba(255,255,255,0.35)", minHeight: 16 }}>
                      {typingNames.length > 0 ? (
                        <><TypingDots /> <span>{typingNames.length === 1 ? `${typingNames[0]} is typing` : "Several people are typing"}</span></>
                      ) : activeRoom.type === "group"
                        ? `${activeRoom.members.length} members`
                        : fmtLastSeen(otherLastSeen)
                      }
                    </p>
                  </div>
                  {/* Message search toggle */}
                  <button onClick={() => setShowMsgSearch((s) => !s)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                    style={{ background: showMsgSearch ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.06)", color: showMsgSearch ? "#c4b5fd" : "rgba(255,255,255,0.4)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
                      <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
                    </svg>
                  </button>
                  {isAdmin && spyMode && (
                    <span className="text-xs px-3 py-1 rounded-full font-semibold"
                      style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                      👁 Viewing silently
                    </span>
                  )}
                </div>

                {/* Message search bar */}
                {showMsgSearch && (
                  <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2} style={{ width: 14, height: 14, flexShrink: 0 }}>
                      <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
                    </svg>
                    <input autoFocus value={msgSearch} onChange={(e) => setMsgSearch(e.target.value)}
                      placeholder="Search in conversation..."
                      className="flex-1 py-1.5 text-sm bg-transparent outline-none text-white placeholder:text-white/30" />
                    {msgSearch && (
                      <button onClick={() => setMsgSearch("")} style={{ color: "rgba(255,255,255,0.4)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}

                {/* ── Messages area ── */}
                <div className="relative flex-1 overflow-hidden">
                  <div ref={messagesContainerRef} onScroll={handleScroll}
                    className="absolute inset-0 overflow-y-auto px-3 md:px-5 py-4"
                    style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>

                    {loadingMessages && (
                      <div className="flex justify-center py-10">
                        <div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                      </div>
                    )}
                    {!loadingMessages && displayedMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.08)" }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth={1.5} style={{ width: 28, height: 28 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
                          {msgSearch ? "No messages match your search" : "No messages yet"}
                        </p>
                        {!msgSearch && <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Say hello! 👋</p>}
                      </div>
                    )}

                    {displayedMessages.map((msg, i) => {
                      const isMe   = msg.senderId === currentUserId;
                      const prev   = displayedMessages[i - 1];
                      const next   = displayedMessages[i + 1];
                      const showDateSep  = !prev || !sameDay(prev.createdAt, msg.createdAt);
                      const sameSenderPrev = prev && prev.senderId === msg.senderId && sameDay(prev.createdAt, msg.createdAt) && !prev.isDeleted;
                      const sameSenderNext = next && next.senderId === msg.senderId && sameDay(next.createdAt, msg.createdAt) && !next.isDeleted;
                      const showAvatar    = !isMe && !sameSenderNext;
                      const showName      = !isMe && activeRoom.type === "group" && !sameSenderPrev;
                      const isRead        = msg.readBy?.some((r) => r.userId !== currentUserId) ?? false;
                      const isFailed      = msg.status === "failed";
                      const isSending     = msg.status === "sending";
                      const isDeleted     = !!msg.isDeleted;
                      const isEditing     = editingId === msg.id;
                      const showMenu      = menuMsgId === msg.id;
                      const isVanishing   = vanishingIds.has(msg.id);
                      const msgAgeMs      = menuOpenTime - new Date(msg.createdAt).getTime();
                      const canEdit       = isMe && !isDeleted && !isSending && msgAgeMs < 15 * 60 * 1000;
                      const canDeleteAll  = (isMe || isAdmin) && !isDeleted && !isSending && (isAdmin || msgAgeMs < 24 * 60 * 60 * 1000);
                      const reactions     = msg.reactions ?? {};
                      const hasReactions  = Object.keys(reactions).some((k) => reactions[k].length > 0);
                      const marginBottom  = sameSenderNext ? "mb-0.5" : "mb-3";

                      return (
                        <div key={msg.tempId ?? msg.id} data-msgid={msg.id}
                          className={`${isVanishing ? "msg-vanishing" : ""} ${marginBottom}`}
                          onClick={() => { setMenuMsgId(null); setReactionMsgId(null); }}>

                          {/* Date separator */}
                          {showDateSep && (
                            <div className="flex items-center gap-3 my-5">
                              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                              <span className="text-[11px] font-medium px-3 py-1 rounded-full flex-shrink-0"
                                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                                {fmtDateSep(msg.createdAt)}
                              </span>
                              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                            </div>
                          )}

                          {/* Swipe-to-reply wrapper — full row */}
                          <div className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                            onTouchStart={(e) => { onSwipeTouchStart(e, msg.tempId ?? msg.id); onMsgTouchStart(e, msg); }}
                            onTouchMove={(e) => onSwipeTouchMove(e, msg.tempId ?? msg.id)}
                            onTouchEnd={(e) => { onMsgTouchEnd(); onSwipeTouchEnd(e, msg); }}
                            onTouchCancel={onMsgTouchEnd}>

                            {/* Swipe reply icon (appears from left) */}
                            <div className="swipe-icon flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full"
                              style={{ opacity: 0, transform: "scale(0)", background: "rgba(124,58,237,0.3)", position: "absolute", left: isMe ? "auto" : 0, right: isMe ? 0 : "auto", pointerEvents: "none", zIndex: 5 }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth={2.5} style={{ width: 16, height: 16 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h13a5 5 0 010 10H9m-6-10l4-4m-4 4l4 4"/>
                              </svg>
                            </div>

                            {/* Avatar slot for others */}
                            {!isMe && (
                              <div className="flex-shrink-0" style={{ width: 32 }}>
                                {showAvatar ? <Avatar name={msg.sender.name} size={30} /> : null}
                              </div>
                            )}

                            <div className={`swipe-wrap flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[72%] md:max-w-[60%]`}>
                              {/* Sender name (group) */}
                              {showName && (
                                <p className="text-[11px] font-semibold mb-1 px-1"
                                  style={{ color: getAvatarColors(msg.sender.name)[0] }}>
                                  {msg.sender.name}
                                </p>
                              )}

                              <div className="relative group/msg">
                                {/* ── Action buttons on hover (desktop only) ── */}
                                {!activeReadOnly && !isDeleted && !isSending && !isEditing && (
                                  <div className={`absolute top-1 hidden md:flex items-center gap-1 z-10 opacity-0 group-hover/msg:opacity-100 transition-opacity ${isMe ? "-left-20" : "-right-20"}`}>
                                    {/* Reply */}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setReplyTo(msg); setTimeout(() => inputRef.current?.focus(), 50); }}
                                      className="w-7 h-7 rounded-full flex items-center justify-center"
                                      style={{ background: "rgba(255,255,255,0.12)" }} title="Reply">
                                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} style={{ width: 13, height: 13 }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h13a5 5 0 010 10H9m-6-10l4-4m-4 4l4 4"/>
                                      </svg>
                                    </button>
                                    {/* React */}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setReactionMsgId(reactionMsgId === msg.id ? null : msg.id); }}
                                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                                      style={{ background: "rgba(255,255,255,0.12)" }} title="React">
                                      😊
                                    </button>
                                    {/* 3-dot menu */}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); if (!showMenu) setMenuOpenTime(Date.now()); setMenuMsgId(showMenu ? null : msg.id); }}
                                      className="w-7 h-7 rounded-full flex items-center justify-center"
                                      style={{ background: "rgba(255,255,255,0.12)" }} title="More">
                                      <svg viewBox="0 0 24 24" fill="white" style={{ width: 12, height: 12 }}>
                                        <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                                      </svg>
                                    </button>
                                  </div>
                                )}

                                {/* ── Emoji reaction picker ── */}
                                {reactionMsgId === msg.id && (
                                  <div
                                    className={`absolute -top-12 z-30 flex items-center gap-1 p-2 rounded-2xl ${isMe ? "right-0" : "left-0"}`}
                                    style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
                                    onClick={(e) => e.stopPropagation()}>
                                    {QUICK_EMOJIS.map((emoji) => {
                                      const myReact = reactions[emoji]?.includes(currentUserId);
                                      return (
                                        <button key={emoji} onClick={() => void reactToMessage(msg.id, emoji)}
                                          className="text-xl rounded-xl w-9 h-9 flex items-center justify-center transition-all hover:scale-125"
                                          style={{ background: myReact ? "rgba(124,58,237,0.3)" : "transparent" }}>
                                          {emoji}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* ── Context menu ── */}
                                {showMenu && (
                                  <div
                                    className={`absolute top-0 z-20 rounded-2xl overflow-hidden flex flex-col ${isMe ? "right-full mr-2" : "left-full ml-2"}`}
                                    style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", minWidth: 175 }}
                                    onClick={(e) => e.stopPropagation()}>
                                    {/* Reply */}
                                    <button onClick={() => { setReplyTo(msg); setMenuMsgId(null); setTimeout(() => inputRef.current?.focus(), 50); }}
                                      className="flex items-center gap-2.5 px-4 py-3 text-xs font-medium text-white hover:bg-white/10 transition-all text-left">
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h13a5 5 0 010 10H9m-6-10l4-4m-4 4l4 4"/>
                                      </svg>
                                      Reply
                                    </button>
                                    {canEdit && (
                                      <button onClick={() => { setEditingId(msg.id); setEditContent(msg.content); setMenuMsgId(null); }}
                                        className="flex items-center gap-2.5 px-4 py-3 text-xs font-medium text-white hover:bg-white/10 transition-all text-left">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                        </svg>
                                        Edit <span className="ml-auto text-[10px] opacity-40">15 min</span>
                                      </button>
                                    )}
                                    {!isDeleted && !isSending && (
                                      <button onClick={() => void deleteMessage(msg.id, "me")}
                                        className="flex items-center gap-2.5 px-4 py-3 text-xs font-medium hover:bg-white/10 transition-all text-left"
                                        style={{ color: "#fbbf24" }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                                        </svg>
                                        Delete for Me
                                      </button>
                                    )}
                                    {canDeleteAll && (
                                      <button onClick={() => void deleteMessage(msg.id, "everyone")}
                                        className="flex items-center gap-2.5 px-4 py-3 text-xs font-medium hover:bg-white/10 transition-all text-left border-t"
                                        style={{ color: "#f87171", borderColor: "rgba(255,255,255,0.07)" }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                        </svg>
                                        Delete for Everyone {!isAdmin && <span className="ml-auto text-[10px] opacity-40">24h</span>}
                                      </button>
                                    )}
                                  </div>
                                )}

                                {/* ── Bubble ── */}
                                {isDeleted ? (
                                  <div className="msg-deleted-appear flex items-center gap-2 px-3.5 py-2 rounded-2xl"
                                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.8} style={{ width: 13, height: 13 }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                                    </svg>
                                    <span className="text-xs italic" style={{ color: "rgba(255,255,255,0.3)" }}>
                                      {isMe ? "You deleted this message" : "This message was deleted"}
                                    </span>
                                  </div>
                                ) : isEditing ? (
                                  <div className="rounded-2xl overflow-hidden"
                                    style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", minWidth: 200 }}>
                                    <textarea autoFocus value={editContent}
                                      onChange={(e) => setEditContent(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void saveEdit(msg.id); }
                                        if (e.key === "Escape") setEditingId(null);
                                      }}
                                      className="w-full bg-transparent text-sm text-white outline-none resize-none px-3.5 pt-2.5 pb-1"
                                      style={{ minWidth: 200, maxWidth: 320 }} rows={2} />
                                    <div className="flex items-center justify-end gap-2 px-3 pb-2">
                                      <button onClick={() => setEditingId(null)}
                                        className="text-[10px] px-2.5 py-1 rounded-full"
                                        style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>Cancel</button>
                                      <button onClick={() => void saveEdit(msg.id)}
                                        className="text-[10px] px-2.5 py-1 rounded-full font-semibold text-white"
                                        style={{ background: "#7c3aed" }}>Save</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="msg-bubble"
                                    style={{
                                      background: isFailed ? "rgba(239,68,68,0.15)" : isMe ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "rgba(255,255,255,0.08)",
                                      borderRadius: 18,
                                      borderBottomRightRadius: isMe && !sameSenderNext ? 4 : 18,
                                      borderBottomLeftRadius: !isMe && !sameSenderNext ? 4 : 18,
                                      boxShadow: isMe && !isFailed ? "0 2px 12px rgba(124,58,237,0.25)" : "none",
                                      opacity: isSending ? 0.75 : 1,
                                      border: isFailed ? "1px solid rgba(239,68,68,0.3)" : "none",
                                      padding: "8px 13px",
                                    }}>
                                    {/* Quoted reply */}
                                    {msg.replyTo && (
                                      <div className="mb-2 px-2.5 py-1.5 rounded-xl text-xs"
                                        style={{ background: isMe ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.08)", borderLeft: `3px solid ${getAvatarColors(msg.replyTo.sender.name)[0]}` }}>
                                        <p className="font-semibold mb-0.5" style={{ color: getAvatarColors(msg.replyTo.sender.name)[0] }}>
                                          {msg.replyTo.sender.name}
                                        </p>
                                        <p className="opacity-70 truncate" style={{ color: "white" }}>
                                          {msg.replyTo.isDeleted ? "This message was deleted" : msg.replyTo.content}
                                        </p>
                                      </div>
                                    )}
                                    {/* Attachment */}
                                    {msg.attachmentUrl && msg.attachmentType === "image" && (
                                      <a href={msg.attachmentUrl} target="_blank" rel="noreferrer">
                                        <img src={msg.attachmentUrl} alt="" className="rounded-xl mb-1" style={{ maxWidth: 240, maxHeight: 240, objectFit: "cover" }} />
                                      </a>
                                    )}
                                    {msg.attachmentUrl && msg.attachmentType === "voice" && (
                                      <audio controls src={msg.attachmentUrl} className="mb-1" style={{ maxWidth: 240, height: 36 }} />
                                    )}
                                    {msg.attachmentUrl && msg.attachmentType === "file" && (
                                      <a href={msg.attachmentUrl} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-2 mb-1 px-2.5 py-2 rounded-xl"
                                        style={{ background: "rgba(0,0,0,0.2)", minWidth: 180 }}>
                                        <span style={{ fontSize: 20 }}>📎</span>
                                        <span className="text-sm text-white truncate" style={{ maxWidth: 180 }}>{msg.attachmentName || "File"}</span>
                                      </a>
                                    )}
                                    {!!msg.content && (
                                      <p className="text-sm text-white leading-relaxed" style={{ wordBreak: "break-word" }}>
                                        {msg.content}
                                      </p>
                                    )}
                                    <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                                      {msg.editedAt && <span className="text-[10px] italic" style={{ color: "rgba(255,255,255,0.4)" }}>edited</span>}
                                      <span className="text-[10px]" style={{ color: isMe ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.3)" }}>
                                        {fmt(msg.createdAt)}
                                      </span>
                                      {isMe && <MsgStatus status={msg.status} isRead={isRead} />}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Emoji reaction pills */}
                              {hasReactions && !isDeleted && (
                                <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                                  {QUICK_EMOJIS.filter((e) => (reactions[e]?.length ?? 0) > 0).map((emoji) => {
                                    const users   = reactions[emoji] ?? [];
                                    const isMine  = users.includes(currentUserId);
                                    return (
                                      <button key={emoji}
                                        onClick={(e) => { e.stopPropagation(); if (!activeReadOnly) void reactToMessage(msg.id, emoji); }}
                                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all hover:scale-105"
                                        style={{
                                          background: isMine ? "rgba(124,58,237,0.35)" : "rgba(255,255,255,0.1)",
                                          border: isMine ? "1px solid rgba(124,58,237,0.5)" : "1px solid rgba(255,255,255,0.12)",
                                        }}>
                                        <span>{emoji}</span>
                                        <span className="font-semibold" style={{ color: isMine ? "#c4b5fd" : "rgba(255,255,255,0.6)" }}>
                                          {users.length}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Failed: retry */}
                              {isFailed && (
                                <button onClick={() => void retryMessage(msg)}
                                  className="text-[10px] mt-1 px-2 py-0.5 rounded-full"
                                  style={{ color: "#f87171", background: "rgba(239,68,68,0.1)" }}>
                                  ↺ Tap to retry
                                </button>
                              )}
                            </div>{/* end swipe-wrap */}
                          </div>{/* end row */}
                        </div>
                      );
                    })}

                    <div style={{ height: 4 }} />
                  </div>

                  {/* Scroll-to-bottom button */}
                  {showScrollBtn && (
                    <button onClick={scrollToBottom}
                      className="absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 z-20"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 20px rgba(124,58,237,0.5)" }}>
                      {newMsgCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1"
                          style={{ background: "#22c55e" }}>
                          {newMsgCount > 99 ? "99+" : newMsgCount}
                        </span>
                      )}
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} style={{ width: 18, height: 18 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* ── Input area ── */}
                <div className="flex-shrink-0" style={{ background: "rgba(15,15,28,0.95)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  {activeReadOnly ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-4" style={{ color: "rgba(255,255,255,0.45)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 18, height: 18 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                    <span className="text-xs font-medium">Monitor mode — view only</span>
                  </div>
                  ) : (
                  <>
                  {/* Reply preview */}
                  {replyTo && (
                    <div className="flex items-center gap-3 px-4 pt-3 pb-1">
                      <div className="flex-1 px-3 py-2 rounded-xl text-xs"
                        style={{ background: "rgba(124,58,237,0.12)", borderLeft: `3px solid ${getAvatarColors(replyTo.sender.name)[0]}` }}>
                        <p className="font-semibold mb-0.5" style={{ color: getAvatarColors(replyTo.sender.name)[0] }}>
                          {replyTo.sender.id === currentUserId ? "You" : replyTo.sender.name}
                        </p>
                        <p className="text-white/60 truncate">{replyTo.content}</p>
                      </div>
                      <button onClick={() => setReplyTo(null)}
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 12, height: 12 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {isUploading && (
                    <p className="text-[11px] px-5 pb-1" style={{ color: "#a78bfa" }}>Uploading…</p>
                  )}
                  <div className="flex items-end gap-2 px-4 py-3">
                    <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={(e) => void handleFilePick(e, "image")} />
                    <input ref={fileInputRef} type="file" hidden onChange={(e) => void handleFilePick(e, "file")} />
                    {/* Image */}
                    <button title="Send image" onClick={() => imageInputRef.current?.click()}
                      className="w-10 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 hover:bg-white/10"
                      style={{ color: "rgba(255,255,255,0.55)" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} style={{ width: 20, height: 20 }}>
                        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
                      </svg>
                    </button>
                    {/* File */}
                    <button title="Attach file" onClick={() => fileInputRef.current?.click()}
                      className="w-10 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 hover:bg-white/10"
                      style={{ color: "rgba(255,255,255,0.55)" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} style={{ width: 20, height: 20 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                      </svg>
                    </button>
                    <div className="flex-1 flex items-end gap-2 px-4 py-2.5 rounded-3xl"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}>
                      <textarea ref={inputRef} value={input}
                        onChange={handleInputChange} onKeyDown={handleKeyDown}
                        placeholder={replyTo ? "Reply..." : "Write a message..."}
                        rows={1}
                        className="flex-1 bg-transparent text-sm text-white outline-none resize-none"
                        style={{ maxHeight: 120, scrollbarWidth: "none", lineHeight: "1.5" }} />
                    </div>
                    {input.trim() ? (
                      <button onClick={() => void sendMessage()}
                        className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105"
                        style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} style={{ width: 18, height: 18, marginLeft: 2 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </button>
                    ) : (
                      <button title={isRecording ? "Stop & send" : "Record voice"} onClick={() => void toggleVoiceRecord()}
                        className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105"
                        style={{ background: isRecording ? "#ef4444" : "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                        {isRecording ? (
                          <svg viewBox="0 0 24 24" fill="white" style={{ width: 16, height: 16 }}><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} style={{ width: 18, height: 18 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2M12 19v4" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] pb-2 px-5" style={{ color: "rgba(255,255,255,0.18)" }}>
                    Enter to send · Shift+Enter for new line
                  </p>
                  </>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* ══════════════════════ LONG PRESS BOTTOM SHEET (mobile) ══════════════════════ */}
      {longPressMsg && (() => {
        const msg      = longPressMsg;
        const isMe     = msg.senderId === currentUserId;
        const isDeleted = !!msg.isDeleted;
        const ageMs     = longPressMsgTime - new Date(msg.createdAt).getTime();
        const canEdit   = isMe && !isDeleted && ageMs < 15 * 60 * 1000;
        const canDelAll = (isMe || isAdmin) && !isDeleted && (isAdmin || ageMs < 24 * 60 * 60 * 1000);
        const reactions = msg.reactions ?? {};

        const close = () => setLongPressMsg(null);

        return (
          <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
            onClick={close}>

            {/* Message preview */}
            <div className="px-4 pb-3 flex justify-center pointer-events-none">
              <div className="max-w-[80vw] px-4 py-2.5 rounded-2xl text-sm text-white"
                style={{ background: isMe ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "rgba(255,255,255,0.12)" }}>
                {msg.replyTo && (
                  <div className="mb-1.5 px-2 py-1 rounded-lg text-xs"
                    style={{ background: "rgba(0,0,0,0.2)", borderLeft: `3px solid ${getAvatarColors(msg.replyTo.sender.name)[0]}` }}>
                    <p className="font-semibold" style={{ color: getAvatarColors(msg.replyTo.sender.name)[0] }}>{msg.replyTo.sender.name}</p>
                    <p className="opacity-60 truncate">{msg.replyTo.content}</p>
                  </div>
                )}
                <p className="leading-relaxed" style={{ wordBreak: "break-word" }}>{msg.content}</p>
              </div>
            </div>

            {/* Bottom sheet */}
            <div className="rounded-t-3xl overflow-hidden" style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.08)" }}
              onClick={(e) => e.stopPropagation()}>

              {/* Reaction row */}
              <div className="flex items-center justify-around px-5 py-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {QUICK_EMOJIS.map((emoji) => {
                  const mine = reactions[emoji]?.includes(currentUserId);
                  const count = reactions[emoji]?.length ?? 0;
                  return (
                    <button key={emoji}
                      onClick={() => { void reactToMessage(msg.id, emoji); close(); }}
                      className="flex flex-col items-center gap-1 transition-all active:scale-90"
                      style={{ minWidth: 40 }}>
                      <span className="text-2xl" style={{ filter: mine ? "none" : "grayscale(0.2)" }}>{emoji}</span>
                      {count > 0 && <span className="text-[10px] font-semibold" style={{ color: mine ? "#c4b5fd" : "rgba(255,255,255,0.4)" }}>{count}</span>}
                    </button>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="pb-safe">
                {/* Reply */}
                <button onClick={() => { setReplyTo(msg); setTimeout(() => inputRef.current?.focus(), 80); close(); }}
                  className="w-full flex items-center gap-4 px-6 py-4 active:bg-white/5 transition-all text-left">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.15)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth={2} style={{ width: 18, height: 18 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h13a5 5 0 010 10H9m-6-10l4-4m-4 4l4 4"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-white">Reply</span>
                </button>

                {canEdit && (
                  <button onClick={() => { setEditingId(msg.id); setEditContent(msg.content); close(); }}
                    className="w-full flex items-center gap-4 px-6 py-4 active:bg-white/5 transition-all text-left">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.07)" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} style={{ width: 18, height: 18 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Edit</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Within 15 minutes</p>
                    </div>
                  </button>
                )}

                {/* Copy */}
                <button onClick={() => { navigator.clipboard?.writeText(msg.content).catch(() => {}); close(); }}
                  className="w-full flex items-center gap-4 px-6 py-4 active:bg-white/5 transition-all text-left">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.07)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} style={{ width: 18, height: 18 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-white">Copy</span>
                </button>

                {!isDeleted && (
                  <button onClick={() => { void deleteMessage(msg.id, "me"); close(); }}
                    className="w-full flex items-center gap-4 px-6 py-4 active:bg-white/5 transition-all text-left">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(234,179,8,0.12)" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth={2} style={{ width: 18, height: 18 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium" style={{ color: "#fbbf24" }}>Delete for Me</span>
                  </button>
                )}

                {canDelAll && (
                  <button onClick={() => { void deleteMessage(msg.id, "everyone"); close(); }}
                    className="w-full flex items-center gap-4 px-6 py-4 active:bg-white/5 transition-all text-left"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth={2} style={{ width: 18, height: 18 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#f87171" }}>Delete for Everyone</p>
                      {!isAdmin && <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Within 24 hours</p>}
                    </div>
                  </button>
                )}

                {/* Safe area spacer */}
                <div style={{ height: "env(safe-area-inset-bottom, 16px)" }} />
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════ NEW CHAT MODAL ══════════════════════════ */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}>
          <div className="w-full max-w-md flex flex-col rounded-3xl overflow-hidden max-h-[88vh]"
            style={{ background: "#0f0f1c", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>

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
              <div className="flex gap-2 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                {(["direct", "group"] as const).map((t) => (
                  <button key={t} onClick={() => { setNewChatType(t); setSelectedMembers([]); }}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: newChatType === t ? "rgba(124,58,237,0.3)" : "transparent", color: newChatType === t ? "#c4b5fd" : "rgba(255,255,255,0.4)" }}>
                    {t === "direct" ? "💬 Direct Message" : "👥 Group Chat"}
                  </button>
                ))}
              </div>

              {newChatType === "group" && (
                <input value={groupName} onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name..."
                  className="w-full rounded-2xl px-4 py-3 text-sm text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }} />
              )}

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

              <div className="flex items-center gap-2 px-3 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2} style={{ width: 14, height: 14 }}>
                  <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
                </svg>
                <input value={sidebarSearch} onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder="Search people..."
                  className="flex-1 py-2.5 text-xs bg-transparent outline-none text-white placeholder:text-white/30" />
              </div>

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
                      style={{ background: isSelected ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.03)", border: isSelected ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent" }}>
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

            <div className="flex gap-3 px-6 py-4 flex-shrink-0"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={() => { setShowNewChat(false); setSelectedMembers([]); setSidebarSearch(""); }}
                className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
                Cancel
              </button>
              <button onClick={createChat} disabled={selectedMembers.length === 0}
                className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                {newChatType === "direct" ? "Open Chat" : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
