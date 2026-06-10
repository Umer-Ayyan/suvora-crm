"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const selectStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
};

export default function SearchFilter() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  function handleSearch() {
    router.push(search ? `/leads?search=${search}` : "/leads");
  }

  function handleStatus(value: string) {
    router.push(value ? `/leads?status=${value}` : "/leads");
  }

  function handleSort(value: string) {
    router.push(value ? `/leads?sort=${value}` : "/leads");
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {/* Search + button row */}
      <div className="flex gap-2 flex-1">
        <div className="relative flex-1">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="input-modern w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-white"
            style={selectStyle}
          />
        </div>

        <button
          onClick={handleSearch}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
        >
          Search
        </button>
      </div>

      {/* Filters row */}
      <div className="flex gap-2">
        <select
          onChange={(e) => handleStatus(e.target.value)}
          className="input-modern rounded-xl px-3 py-2.5 text-sm text-white cursor-pointer flex-1 sm:flex-none"
          style={selectStyle}
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="proposal">Proposal</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>

        <select
          onChange={(e) => handleSort(e.target.value)}
          className="input-modern rounded-xl px-3 py-2.5 text-sm text-white cursor-pointer flex-1 sm:flex-none"
          style={selectStyle}
        >
          <option value="">Sort by</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name">Name A–Z</option>
          <option value="budget">Budget</option>
        </select>
      </div>
    </div>
  );
}
