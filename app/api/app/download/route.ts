import { NextResponse } from "next/server";

// Stable download endpoint for the Android app. The actual APK lives on the
// permanent EAS artifact URL; we redirect here so the link
// (crm.suvora.tech/api/app/download) never changes. On each new build, update
// APK_DOWNLOAD_URL (env on Vercel) — or the fallback below — to the new
// artifact URL and the download page keeps working automatically.
const FALLBACK_APK_URL =
  "https://expo.dev/artifacts/eas/meB6nWVpwCrczLOsl1WQmLPseuBR_Dqred2iA0zqpQ8.apk";

export const dynamic = "force-dynamic";

export function GET() {
  const url = process.env.APK_DOWNLOAD_URL || FALLBACK_APK_URL;
  return NextResponse.redirect(url, 302);
}
