import { authenticator } from "otplib";
import QRCode from "qrcode";

// Allow a 1-step (±30s) drift so slightly out-of-sync clocks still work.
authenticator.options = { window: 1 };

const ISSUER = "Suvora CRM";

/** Generate a fresh base32 TOTP secret. */
export function generateTwoFactorSecret(): string {
  return authenticator.generateSecret();
}

/** otpauth:// URI that an authenticator app can import. */
export function buildOtpAuthUrl(accountLabel: string, secret: string): string {
  return authenticator.keyuri(accountLabel, ISSUER, secret);
}

/** Data-URL PNG QR code for the otpauth URI. */
export async function buildQrDataUrl(otpAuthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpAuthUrl, { margin: 1, width: 240 });
}

/** Verify a 6-digit code against a secret. */
export function verifyTwoFactorCode(code: string, secret: string): boolean {
  if (!code || !secret) return false;
  const clean = code.replace(/\s+/g, "");
  try {
    return authenticator.verify({ token: clean, secret });
  } catch {
    return false;
  }
}
