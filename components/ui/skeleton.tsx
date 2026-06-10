export function Skeleton({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-xl animate-pulse ${className}`}
      style={{ background: "rgba(255,255,255,0.06)", ...style }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <Skeleton className="w-7 h-7 rounded-lg flex-shrink-0" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24 ml-8" />
      <Skeleton className="h-4 w-28 ml-8" />
      <Skeleton className="h-6 w-16 rounded-full ml-auto" />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <Skeleton className="h-7 w-48 mb-2" />
      <Skeleton className="h-4 w-64 mb-8" />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Skeleton className="h-5 w-40 mb-5" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3 py-2">
                <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <Skeleton className="h-5 w-48 mb-5" />
      <div className="grid md:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
              <div><Skeleton className="h-4 w-28 mb-1.5" /><Skeleton className="h-3 w-16" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} className="h-14 rounded-xl" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonLeads() {
  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <Skeleton className="h-7 w-44 mb-2" />
      <Skeleton className="h-4 w-32 mb-6" />
      <Skeleton className="h-10 w-36 rounded-xl mb-6" />

      <div className="flex gap-3 mb-6">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      <Skeleton className="h-10 w-44 rounded-xl mb-5" />

      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="h-10" style={{ background: "rgba(255,255,255,0.02)" }} />
        {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  );
}

export function SkeletonLeadDetail() {
  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <Skeleton className="h-4 w-28 mb-6" />

      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="w-14 h-14 rounded-2xl flex-shrink-0" />
        <div><Skeleton className="h-7 w-48 mb-2" /><Skeleton className="h-4 w-36" /></div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Skeleton className="h-4 w-24 mb-4" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                <div className="flex-1"><Skeleton className="h-3 w-16 mb-1.5" /><Skeleton className="h-4 w-28" /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Skeleton className="h-5 w-40 mb-5" />
              {Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} className="h-10 w-full mb-3 rounded-xl" />)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonEmployees() {
  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <Skeleton className="h-7 w-52 mb-2" />
      <Skeleton className="h-4 w-32 mb-6" />
      <Skeleton className="h-10 w-40 rounded-xl mb-6" />

      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="h-10" style={{ background: "rgba(255,255,255,0.02)" }} />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-24 ml-8" />
            <Skeleton className="h-5 w-16 rounded-full ml-8" />
            <div className="ml-auto flex gap-2">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonEmployeeDetail() {
  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <Skeleton className="h-4 w-36 mb-6" />

      <div className="rounded-2xl p-6 mb-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-2xl flex-shrink-0" />
          <div><Skeleton className="h-6 w-40 mb-2" /><Skeleton className="h-4 w-56" /></div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>

      <div className="rounded-2xl p-6 mb-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <Skeleton className="h-5 w-36 mb-5" />
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}
