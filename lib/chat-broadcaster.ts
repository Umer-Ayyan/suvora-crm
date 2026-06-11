// In-memory SSE broadcaster — works on single-server deployments
type Listener = (data: string) => void;

const listeners = new Map<string, Set<Listener>>();

export function subscribe(roomId: string, cb: Listener): () => void {
  if (!listeners.has(roomId)) listeners.set(roomId, new Set());
  listeners.get(roomId)!.add(cb);
  return () => {
    listeners.get(roomId)?.delete(cb);
    if (listeners.get(roomId)?.size === 0) listeners.delete(roomId);
  };
}

export function broadcast(roomId: string, data: object) {
  const roomListeners = listeners.get(roomId);
  if (!roomListeners) return;
  const payload = JSON.stringify(data);
  roomListeners.forEach((cb) => cb(payload));
}
