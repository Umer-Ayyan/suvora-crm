import Image from "next/image";

export const metadata = { title: "Get the App · Suvora CRM" };

const APP_VERSION = "1.0.0";
const DOWNLOAD_PATH = "/api/app/download";
const ABSOLUTE_DOWNLOAD_URL = "https://crm.suvora.tech" + DOWNLOAD_PATH;
const QR_SRC =
  "https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=" +
  encodeURIComponent(ABSOLUTE_DOWNLOAD_URL);

const STEPS = [
  "Phone se ye page kholein ya neeche wala QR scan karein.",
  "“Download for Android” par tap karke APK download karein.",
  "Phone agar “Unknown sources / Allow from this source” poochay to Allow karein.",
  "Downloaded file kholein aur Install par tap karein.",
];

export default function GetAppPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div
        className="rounded-3xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Header */}
        <div
          className="px-8 py-10 flex flex-col items-center text-center"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(79,70,229,0.10))" }}
        >
          <div
            className="rounded-3xl overflow-hidden mb-5"
            style={{ width: 92, height: 92, boxShadow: "0 8px 32px rgba(124,58,237,0.45)" }}
          >
            <Image src="/icon-512.png" alt="Suvora CRM" width={92} height={92} />
          </div>
          <h1 className="text-2xl font-bold text-white">Suvora CRM — Mobile App</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
            Android · Version {APP_VERSION}
          </p>

          <a
            href={DOWNLOAD_PATH}
            className="mt-6 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-semibold text-white transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 6px 24px rgba(124,58,237,0.5)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} style={{ width: 20, height: 20 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
            </svg>
            Download for Android
          </a>
          <p className="text-[11px] mt-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            ~92 MB · APK file
          </p>
        </div>

        {/* Body: QR + steps */}
        <div className="px-8 py-8 grid gap-8 md:grid-cols-[auto_1fr] items-start">
          <div className="flex flex-col items-center">
            <div className="rounded-2xl p-3 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={QR_SRC} alt="Scan to download" width={180} height={180} />
            </div>
            <p className="text-xs mt-3 text-center" style={{ color: "rgba(255,255,255,0.5)" }}>
              Phone ke camera se<br />scan karein
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white mb-3">Install kaise karein</h2>
            <ol className="space-y-3">
              {STEPS.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: "rgba(124,58,237,0.4)", border: "1px solid rgba(124,58,237,0.6)" }}
                  >
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>

            <div
              className="mt-6 rounded-xl px-4 py-3 text-xs"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "rgba(255,255,255,0.6)" }}
            >
              Updates apne aap aate hain — app khologe to nayi features khud install ho jati hain. Naya
              APK sirf badi tabdeeli par chahiye hota hai.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
