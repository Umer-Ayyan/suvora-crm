export default function SuvoraLogo({ size = 32 }: { size?: number }) {
  const r = Math.round(size * 0.22); // border-radius in px
  return (
    <div className="flex-shrink-0 relative" style={{ width: size, height: size }}>
      {/* Outer soft glow — cyan-blue halo */}
      <div
        className="absolute"
        style={{
          inset: `-${size * 0.35}px`,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56,189,248,0.45) 0%, rgba(99,102,241,0.2) 50%, transparent 70%)",
          filter: `blur(${size * 0.28}px)`,
          pointerEvents: "none",
        }}
      />
      {/* Icon body */}
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          borderRadius: r,
          background: "linear-gradient(145deg, #1e90ff 0%, #3b82f6 30%, #6366f1 70%, #818cf8 100%)",
          boxShadow: `0 0 ${size * 0.5}px rgba(56,189,248,0.5), 0 0 ${size * 0.18}px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.15)`,
        }}
      >
        {/* Bright white-cyan orb in upper-center — the key feature of the logo */}
        <div
          className="absolute"
          style={{
            top: "-10%",
            left: "10%",
            width: "75%",
            height: "75%",
            background: "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.95) 0%, rgba(186,230,253,0.7) 30%, rgba(99,179,237,0.3) 60%, transparent 80%)",
            filter: `blur(${size * 0.04}px)`,
          }}
        />
        {/* Subtle dark-blue bottom gradient to give depth */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, transparent 40%, rgba(15,23,42,0.35) 100%)",
            borderRadius: r,
          }}
        />
        {/* Very fine grid texture */}
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
            `,
            backgroundSize: `${Math.max(4, size * 0.18)}px ${Math.max(4, size * 0.18)}px`,
            borderRadius: r,
          }}
        />
      </div>
    </div>
  );
}
