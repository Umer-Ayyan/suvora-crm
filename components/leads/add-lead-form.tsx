"use client";

import { useState } from "react";

export default function AddLeadForm() {
  const [name, setName] = useState("");
  const [source, setSource] = useState("");

  async function handleSubmit(e: any) {
    e.preventDefault();

    await fetch("/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        source,
      }),
    });

    setName("");
    setSource("");

    window.location.reload();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-zinc-900 border border-white/10 rounded-2xl p-6 mb-8"
    >
      <h2 className="text-2xl font-bold mb-4">
        Add New Lead
      </h2>

      <div className="grid gap-4">
        <input
          type="text"
          placeholder="Lead Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 outline-none"
        />

        <input
          type="text"
          placeholder="Source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 outline-none"
        />

        <button
          type="submit"
          className="bg-white text-black rounded-xl py-3 font-semibold"
        >
          Add Lead
        </button>
      </div>
    </form>
  );
}