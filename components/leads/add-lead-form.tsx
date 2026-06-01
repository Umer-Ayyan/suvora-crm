"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function AddLeadForm() {
  const [name, setName] = useState("");
  const [source, setSource] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");

  const [followUpDate, setFollowUpDate] =
    useState("");

  const [priority, setPriority] =
    useState("medium");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    e: any
  ) {
    e.preventDefault();

    if (!name || !source) {
      toast.error(
        "Lead Name and Source are required"
      );

      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        "/api/leads",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name,
            source,
            company,
            email,
            budget,
            notes,
            followUpDate,
            priority,
          }),
        }
      );

      if (res.ok) {
        toast.success(
          "Lead created successfully"
        );

        setName("");
        setSource("");
        setCompany("");
        setEmail("");
        setBudget("");
        setNotes("");
        setFollowUpDate("");
        setPriority("medium");

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(
          "Failed to create lead"
        );
      }
    } catch {
      toast.error(
        "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-zinc-900 border border-white/10 rounded-3xl p-6 mb-10"
    >
      <h2 className="text-2xl font-bold mb-6">
        Add New Lead
      </h2>

      <div className="grid gap-4">
        <input
          type="text"
          placeholder="Lead Name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          className="bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 outline-none text-white"
        />

        <input
          type="text"
          placeholder="Source"
          value={source}
          onChange={(e) =>
            setSource(e.target.value)
          }
          className="bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 outline-none text-white"
        />

        <input
          type="text"
          placeholder="Company"
          value={company}
          onChange={(e) =>
            setCompany(e.target.value)
          }
          className="bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 outline-none text-white"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 outline-none text-white"
        />

        <input
          type="text"
          placeholder="Budget"
          value={budget}
          onChange={(e) =>
            setBudget(e.target.value)
          }
          className="bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 outline-none text-white"
        />

        <input
          type="date"
          value={followUpDate}
          onChange={(e) =>
            setFollowUpDate(
              e.target.value
            )
          }
          className="bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 outline-none text-white"
        />

        <select
          value={priority}
          onChange={(e) =>
            setPriority(
              e.target.value
            )
          }
          className="bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 outline-none text-white"
        >
          <option value="low">
            Low Priority
          </option>

          <option value="medium">
            Medium Priority
          </option>

          <option value="high">
            High Priority
          </option>
        </select>

        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) =>
            setNotes(e.target.value)
          }
          className="bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 outline-none text-white min-h-[120px]"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-white text-black rounded-xl py-3 font-semibold hover:opacity-80 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Creating Lead..."
            : "Add Lead"}
        </button>
      </div>
    </form>
  );
}