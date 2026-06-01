import AddLeadForm from "@/components/leads/add-lead-form";
import StatusSelect from "@/components/leads/status-select";
import DeleteLead from "@/components/leads/delete-lead";
import Link from "next/link";
import SearchFilter from "@/components/leads/search-filter";
import LeadsTable from "@/components/leads/leads-table";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { authOptions } from "@/lib/auth";

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
    <main className="min-h-screen bg-zinc-950 text-white p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-4xl font-bold">
            Leads Pipeline
          </h1>
        </div>

        <AddLeadForm />

        <SearchFilter />

        {filteredLeads.length === 0 ? (
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-12 text-center">
            <h3 className="text-2xl font-semibold mb-2">
              No leads found
            </h3>

            <p className="text-zinc-400">
              Create your first lead or
              adjust your filters.
            </p>
          </div>
        ) : (
          <LeadsTable
            leads={paginatedLeads}
          />
        )}

        <div className="flex items-center justify-center gap-4 mt-8">
          {currentPage > 1 && (
            <Link
              href={`/leads?page=${currentPage - 1}`}
              className="bg-zinc-900 border border-white/10 px-5 py-2 rounded-xl"
            >
              Previous
            </Link>
          )}

          <p className="text-zinc-400">
            Page {currentPage} of{" "}
            {totalPages}
          </p>

          {currentPage < totalPages && (
            <Link
              href={`/leads?page=${currentPage + 1}`}
              className="bg-zinc-900 border border-white/10 px-5 py-2 rounded-xl"
            >
              Next
            </Link>
          )}
        </div>

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
    </main>
  );
}