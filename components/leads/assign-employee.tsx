"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function AssignEmployee({
  leadId,
  employees,
  currentEmployeeId,
}: {
  leadId: string;
  employees: any[];
  currentEmployeeId?: string | null;
}) {
  const [employeeId, setEmployeeId] =
    useState(
      currentEmployeeId || ""
    );

  async function save() {
    const res = await fetch(
      `/api/leads/${leadId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          createdById:
            employeeId,
        }),
      }
    );

    if (res.ok) {
      toast.success(
        "Lead reassigned"
      );

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      toast.error(
        "Failed"
      );
    }
  }

  return (
    <div className="space-y-4">
      <select
        value={employeeId}
        onChange={(e) =>
          setEmployeeId(
            e.target.value
          )
        }
        className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3"
      >
        <option value="">
          Unassigned
        </option>

        {employees.map(
          (employee) => (
            <option
              key={
                employee.id
              }
              value={
                employee.id
              }
            >
              {employee.name} (
              {
                employee.employeeId
              }
              )
            </option>
          )
        )}
      </select>

      <button
        onClick={save}
        className="w-full bg-white text-black rounded-xl py-3 font-semibold"
      >
        Save Assignment
      </button>
    </div>
  );
}