import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

const INTEGRATIONS = [
  {
    name: "Gmail",
    description: "Send and track emails directly from leads. Log conversations automatically.",
    icon: "✉",
    color: "#ea4335",
    bg: "rgba(234,67,53,0.12)",
    status: "planned",
    category: "Email",
  },
  {
    name: "Outlook",
    description: "Sync your Outlook calendar and emails with CRM contacts and deals.",
    icon: "📧",
    color: "#0078d4",
    bg: "rgba(0,120,212,0.12)",
    status: "planned",
    category: "Email",
  },
  {
    name: "WhatsApp Business",
    description: "Send WhatsApp messages to leads and clients. Auto-log conversations.",
    icon: "💬",
    color: "#25d366",
    bg: "rgba(37,211,102,0.12)",
    status: "planned",
    category: "Messaging",
  },
  {
    name: "LinkedIn",
    description: "Import leads directly from LinkedIn. Track profile visits and connections.",
    icon: "in",
    color: "#0a66c2",
    bg: "rgba(10,102,194,0.12)",
    status: "planned",
    category: "Social",
  },
  {
    name: "Apollo.io",
    description: "Enrich lead data with company info, emails, and phone numbers from Apollo.",
    icon: "🚀",
    color: "#6a3de8",
    bg: "rgba(106,61,232,0.12)",
    status: "planned",
    category: "Data",
  },
  {
    name: "Zapier",
    description: "Connect Suvora CRM to 6000+ apps. Automate your workflow.",
    icon: "⚡",
    color: "#ff4a00",
    bg: "rgba(255,74,0,0.12)",
    status: "planned",
    category: "Automation",
  },
  {
    name: "Slack",
    description: "Receive instant notifications in Slack for new leads, won deals, and tasks.",
    icon: "#",
    color: "#4a154b",
    bg: "rgba(74,21,75,0.12)",
    status: "planned",
    category: "Notifications",
  },
  {
    name: "Google Calendar",
    description: "Sync follow-up dates and tasks with Google Calendar. Set reminders.",
    icon: "📅",
    color: "#4285f4",
    bg: "rgba(66,133,244,0.12)",
    status: "planned",
    category: "Productivity",
  },
];

export default async function IntegrationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if ((session.user as any).role !== "admin") redirect("/");

  const categories = [...new Set(INTEGRATIONS.map((i) => i.category))];

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto animate-slide-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Integrations</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          Connect Suvora CRM with your favourite tools and platforms
        </p>
      </div>

      <div className="rounded-2xl p-6 mb-8" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(79,70,229,0.05))", border: "1px solid rgba(124,58,237,0.25)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.2)" }}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold">Integrations Roadmap</p>
            <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
              These integrations are planned for upcoming releases. The architecture is ready — API keys can be added in Settings once each integration ships.
            </p>
          </div>
        </div>
      </div>

      {categories.map((cat) => (
        <div key={cat} className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            {cat}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {INTEGRATIONS.filter((i) => i.category === cat).map((integration) => (
              <div key={integration.name}
                className="flex items-start gap-4 p-5 rounded-2xl transition-all hover:scale-[1.01]"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0 font-bold"
                  style={{ background: integration.bg, color: integration.color }}>
                  {integration.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{integration.name}</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {integration.description}
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full flex-shrink-0 font-medium"
                  style={{ background: "rgba(245,158,11,0.12)", color: "#fcd34d", border: "1px solid rgba(245,158,11,0.25)" }}>
                  Planned
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
