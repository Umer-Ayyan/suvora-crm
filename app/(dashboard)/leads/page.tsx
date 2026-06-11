import AddLeadForm from "@/components/leads/add-lead-form";
import ImportCSVModal from "@/components/leads/import-csv-modal";
import StatusSelect from "@/components/leads/status-select";
import DeleteLead from "@/components/leads/delete-lead";
import Link from "next/link";
import SearchFilter from "@/components/leads/search-filter";
import LeadsTable from "@/components/leads/leads-table";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { authOptions } from "@/lib/auth";
import ViewToggle from "@/components/leads/view-toggle";
import KanbanBoard from "@/components/leads/kanban-board";

async function getLeads() {
  const headersList = await headers();

  const host = headersList.get("host");

  const protocol =
    process.env.NODE_ENV === "development"
      ? "http"
      : "https";

  const res = await fetch(
    `${protocol}://${host}/api/leads`,
    {
      cache: "no-store",
      headers: {
        cookie:
          headersList.get("cookie") || "",
      },
    }
  );

  return res.json();
}

const columns = [
  "new",
  "contacted",
  "proposal",
  "won",
  "lost",
];

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const leadsData = await getLeads();

  const leads = Array.isArray(leadsData)
    ? leadsData
    : [];

  const params = await searchParams;

  const filteredLeads = leads.filter((lead: any) => {
    const matchesSearch = params.search
      ? lead.name
          .toLowerCase()
          .includes(params.search.toLowerCase())
      : true;

    const matchesStatus = params.status
      ? lead.status === params.status
      : true;

    return matchesSearch && matchesStatus;
  });

  const sortedLeads = [...filteredLeads];

  switch (params.sort) {
    case "newest":
      sortedLeads.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );
      break;

    case "oldest":
      sortedLeads.sort(
        (a: any, b: any) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
      );
      break;

    case "name":
      sortedLeads.sort((a: any, b: any) =>
        a.name.localeCompare(b.name)
      );
      break;

    case "budget":
      sortedLeads.sort(
        (a: any, b: any) =>
          Number(b.budget || 0) -
          Number(a.budget || 0)
      );
      break;
  }

  const currentPage = Number(
    params.page || "1"
  );

  const ITEMS_PER_PAGE = 10;

  const startIndex =
    (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedLeads = sortedLeads.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredLeads.length /
        ITEMS_PER_PAGE
    )
  );

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto animate-slide-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Leads Pipeline</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""} found
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <ImportCSVModal />
        <AddLeadForm />
      </div>

        <SearchFilter />

        <ViewToggle
          tableView={
            filteredLeads.length === 0 ? (
              <div
                className="rounded-2xl p-12 text-center"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(124,58,237,0.15)" }}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: "#a78bfa" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">No leads found</h3>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Create your first lead or adjust your filters.</p>
              </div>
            ) : (
              <LeadsTable leads={paginatedLeads} />
            )
          }
          kanbanView={<KanbanBoard leads={filteredLeads} />}
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            {currentPage > 1 && (
              <Link
                href={`/leads?page=${currentPage - 1}`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
              >
                ← Previous
              </Link>
            )}
            <span className="text-sm px-3" style={{ color: "rgba(255,255,255,0.4)" }}>
              Page {currentPage} of {totalPages}
            </span>
            {currentPage < totalPages && (
              <Link
                href={`/leads?page=${currentPage + 1}`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
              >
                Next →
              </Link>
            )}
          </div>
        )}

        <div className="hidden">
          {columns.map((column) => {
            const columnLeads =
              filteredLeads.filter(
                (lead: any) =>
                  lead.status === column
              );

            return (
              <div
                key={column}
                className="bg-zinc-900 rounded-3xl p-5 border border-white/10 h-[85vh] flex flex-col"
              >
                <h2 className="text-xl font-semibold capitalize mb-5">
                  {column}
                </h2>

                <div className="space-y-4 overflow-y-auto pr-1">
                  {columnLeads.map(
                    (lead: any) => (
                      <div
                        key={lead.id}
                        className="bg-zinc-800 rounded-2xl p-5 min-h-[280px] flex flex-col justify-between"
                      >
                        <Link
                          href={`/leads/${lead.id}`}
                        >
                          <div className="cursor-pointer">
                            <h3 className="font-semibold text-lg">
                              {lead.name}
                            </h3>

                            <p className="text-zinc-400 text-sm mt-1">
                              {
                                lead.source
                              }
                            </p>

                            <p className="text-zinc-500 text-sm mt-3">
                              {
                                lead.company
                              }
                            </p>

                            <p className="text-zinc-500 text-sm">
                              {lead.email}
                            </p>
                          </div>
                        </Link>

                        <div>
                          <StatusSelect
                            id={lead.id}
                            currentStatus={
                              lead.status
                            }
                          />

                          <DeleteLead
                            id={lead.id}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
    </div>
  );
}