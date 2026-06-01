"use client";

import { useRouter } from "next/navigation";
import StatusSelect from "./status-select";
import DeleteLead from "./delete-lead";
import { useSession } from "next-auth/react";

export default function LeadsTable({
  leads,
}: {
  leads: any[];
}) {
  const router = useRouter();

  const { data: session } = useSession();

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden">
      <table className="w-full">
        <thead className="bg-zinc-800">
          <tr>
            <th className="text-left p-4">
              Name
            </th>

            <th className="text-left p-4">
              Company
            </th>

            <th className="text-left p-4">
              Email
            </th>

            <th className="text-left p-4">
              Budget
            </th>
            <th className="text-left p-4">
  Priority
</th>

<th className="text-left p-4">
  Follow-up
</th>
            <th className="text-left p-4">
              Owner
            </th>

            <th className="text-left p-4">
              Status
            </th>

            {session?.user?.role ===
  "admin" && (
  <th className="text-left p-4">
    Actions
  </th>
)}
          </tr>
        </thead>

        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead.id}
              onClick={() =>
                router.push(
                  `/leads/${lead.id}`
                )
              }
              className="border-t border-white/10 hover:bg-zinc-800 transition cursor-pointer"
            >
              <td className="p-4 font-medium">
                {lead.name}
              </td>

              <td className="p-4 text-zinc-300">
                {lead.company}
              </td>

              <td className="p-4 text-zinc-400">
                {lead.email}
              </td>

              <td className="p-4 text-zinc-300">
                {lead.budget}
              </td>

              <td className="p-4">
  <span
    className={`px-3 py-1 rounded-full text-xs font-semibold ${
      lead.priority === "high"
        ? "bg-red-500/20 text-red-400"
        : lead.priority ===
          "medium"
        ? "bg-yellow-500/20 text-yellow-400"
        : "bg-green-500/20 text-green-400"
    }`}
  >
    {lead.priority || "medium"}
  </span>
</td>

<td className="p-4 text-zinc-300">
  {lead.followUpDate
    ? new Date(
        lead.followUpDate
      ).toLocaleDateString()
    : "-"}
</td>

              <td className="p-4 text-zinc-400">
                {lead.createdBy?.name ||
                  "Unknown"}
              </td>

              <td
                className="p-4"
                onClick={(e) =>
                  e.stopPropagation()
                }
              >
                <StatusSelect
                  id={lead.id}
                  currentStatus={
                    lead.status
                  }
                />
              </td>

              {session?.user?.role ===
  "admin" && (
  <td
    className="p-4"
    onClick={(e) =>
      e.stopPropagation()
    }
  >
    <DeleteLead
      id={lead.id}
    />
  </td>
)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}