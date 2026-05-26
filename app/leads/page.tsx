import AddLeadForm from "@/components/leads/add-lead-form";
async function getLeads() {
  const res = await fetch("http://localhost:3000/api/leads", {
    cache: "no-store",
  });

  return res.json();
}

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">
          Leads Dashboard
        </h1>
            <AddLeadForm />
        <div className="grid gap-4">
          {leads.map((lead: any) => (
            <div
              key={lead.id}
              className="bg-zinc-900 border border-white/10 rounded-2xl p-5"
            >
              <h2 className="text-2xl font-semibold">
                {lead.name}
              </h2>

              <p className="text-zinc-400 mt-1">
                Source: {lead.source}
              </p>

              <p className="text-zinc-500 text-sm mt-2">
                Status: {lead.status}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}