"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchFilter() {
  const router = useRouter();

  const [search, setSearch] = useState("");

  function handleSearch() {
    if (search) {
      router.push(`/leads?search=${search}`);
    } else {
      router.push("/leads");
    }
  }

  function handleStatus(value: string) {
    if (value) {
      router.push(`/leads?status=${value}`);
    } else {
      router.push("/leads");
    }
  }

  function handleSort(value: string) {
    if (value) {
      router.push(`/leads?sort=${value}`);
    } else {
      router.push("/leads");
    }
  }

  return (
    <div className="flex gap-4 mb-8">
      <input
        type="text"
        placeholder="Search leads..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 outline-none text-white w-full"
      />

      <button
        onClick={handleSearch}
        className="bg-white text-black px-5 rounded-xl font-semibold"
      >
        Search
      </button>

      <select
        onChange={(e) => handleStatus(e.target.value)}
        className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 outline-none text-white"
      >
        <option value="">All</option>
        <option value="new">New</option>
        <option value="contacted">Contacted</option>
        <option value="proposal">Proposal</option>
        <option value="won">Won</option>
        <option value="lost">Lost</option>
      </select>

      <select
        onChange={(e) => handleSort(e.target.value)}
        className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 outline-none text-white"
      >
        <option value="">Sort</option>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="name">Name</option>
        <option value="budget">Budget</option>
      </select>
    </div>
  );
}