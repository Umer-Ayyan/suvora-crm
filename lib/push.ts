import { prisma } from "@/lib/prisma";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

type PushData = Record<string, unknown>;

interface ExpoMessage {
  to: string;
  sound: "default";
  title: string;
  body: string;
  data?: PushData;
  priority: "high";
  channelId: "default";
}

function isExpoToken(token: string): boolean {
  return token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken[");
}

async function postBatch(messages: ExpoMessage[]): Promise<void> {
  // Expo accepts up to 100 messages per request.
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      });
      const json: any = await res.json().catch(() => null);
      // Remove tokens Expo reports as no longer registered.
      const tickets: any[] = json?.data ?? [];
      const dead: string[] = [];
      tickets.forEach((ticket, idx) => {
        if (
          ticket?.status === "error" &&
          ticket?.details?.error === "DeviceNotRegistered"
        ) {
          dead.push(batch[idx].to);
        }
      });
      if (dead.length) {
        await prisma.pushToken
          .deleteMany({ where: { token: { in: dead } } })
          .catch(() => {});
      }
    } catch (err) {
      console.error("[push] expo send failed", err);
    }
  }
}

/**
 * Send an Expo push notification to one or more users (by userId).
 * Does NOT create in-app Notification rows. Use for chat (high volume).
 */
export async function sendExpoPush(
  userIds: string | string[],
  payload: { title: string; body: string; data?: PushData }
): Promise<void> {
  const ids = Array.from(
    new Set((Array.isArray(userIds) ? userIds : [userIds]).filter(Boolean))
  );
  if (!ids.length) return;

  const rows = await prisma.pushToken.findMany({
    where: { userId: { in: ids } },
    select: { token: true },
  });
  const tokens = rows.map((r) => r.token).filter(isExpoToken);
  if (!tokens.length) return;

  const messages: ExpoMessage[] = tokens.map((to) => ({
    to,
    sound: "default",
    title: payload.title,
    body: payload.body,
    data: payload.data,
    priority: "high",
    channelId: "default",
  }));

  await postBatch(messages);
}

/**
 * Create in-app Notification rows AND send a push for the same event.
 * Use for tasks / leads / leaves / announcements (everything except chat).
 */
export async function notify(
  userIds: string | string[],
  opts: {
    title: string;
    message: string;
    type?: string;
    link?: string;
    data?: PushData;
  }
): Promise<void> {
  const ids = Array.from(
    new Set((Array.isArray(userIds) ? userIds : [userIds]).filter(Boolean))
  );
  if (!ids.length) return;

  await prisma.notification
    .createMany({
      data: ids.map((userId) => ({
        userId,
        title: opts.title,
        message: opts.message,
        type: opts.type ?? "info",
        link: opts.link ?? null,
      })),
    })
    .catch((err) => console.error("[push] notification.createMany failed", err));

  await sendExpoPush(ids, {
    title: opts.title,
    body: opts.message,
    data: { ...(opts.data ?? {}), link: opts.link },
  });
}
