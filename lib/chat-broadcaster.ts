// In-memory SSE broadcaster — works on single-server deployments
type Listener = (data: string) => void;

// Room-level: keyed by roomId
const roomListeners = new Map<string, Set<Listener>>();
// User-level: keyed by userId (for global notifications)
const userListeners = new Map<string, Set<Listener>>();

// ── Room subscriptions ──────────────────────────────────────────────────────
export function subscribe(roomId: string, cb: Listener): () => void {
  if (!roomListeners.has(roomId)) roomListeners.set(roomId, new Set());
  roomListeners.get(roomId)!.add(cb);
  return () => {
    roomListeners.get(roomId)?.delete(cb);
    if (roomListeners.get(roomId)?.size === 0) roomListeners.delete(roomId);
  };
}

// ── User subscriptions (global, all rooms) ──────────────────────────────────
export function subscribeUser(userId: string, cb: Listener): () => void {
  if (!userListeners.has(userId)) userListeners.set(userId, new Set());
  userListeners.get(userId)!.add(cb);
  return () => {
    userListeners.get(userId)?.delete(cb);
    if (userListeners.get(userId)?.size === 0) userListeners.delete(userId);
  };
}

// ── Broadcast ────────────────────────────────────────────────────────────────
// memberIds: everyone in the room (to push global notifications)
export function broadcast(roomId: string, data: object, memberIds: string[] = []) {
  const payload = JSON.stringify({ __type: "message", ...data });

  // Push to anyone currently viewing this room
  roomListeners.get(roomId)?.forEach((cb) => cb(payload));

  // Push to every member's global stream (so sidebar updates even when room is not open)
  const globalPayload = JSON.stringify({ __type: "message", __roomId: roomId, ...data });
  memberIds.forEach((uid) => {
    userListeners.get(uid)?.forEach((cb) => cb(globalPayload));
  });
}

// ── Broadcast edit/delete ─────────────────────────────────────────────────────
export function broadcastEdit(roomId: string, messageId: string, content: string, memberIds: string[] = []) {
  const payload = JSON.stringify({ __type: "edit", messageId, content });
  roomListeners.get(roomId)?.forEach((cb) => cb(payload));
  const global = JSON.stringify({ __type: "edit", __roomId: roomId, messageId, content });
  memberIds.forEach((uid) => userListeners.get(uid)?.forEach((cb) => cb(global)));
}

export function broadcastDelete(roomId: string, messageId: string, memberIds: string[] = []) {
  const payload = JSON.stringify({ __type: "delete", messageId });
  roomListeners.get(roomId)?.forEach((cb) => cb(payload));
  const global = JSON.stringify({ __type: "delete", __roomId: roomId, messageId });
  memberIds.forEach((uid) => userListeners.get(uid)?.forEach((cb) => cb(global)));
}

// ── Broadcast read receipt ────────────────────────────────────────────────────
// readerId opened the room → notify everyone in the room so senders see blue ticks
export function broadcastRead(roomId: string, readerId: string) {
  const payload = JSON.stringify({ __type: "read", readerId });
  roomListeners.get(roomId)?.forEach((cb) => cb(payload));
}
