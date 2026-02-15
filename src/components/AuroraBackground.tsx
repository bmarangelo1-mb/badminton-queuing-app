export default function AuroraBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1200px 800px at 20% 10%, rgba(34,211,238,0.16), transparent 55%), radial-gradient(900px 700px at 80% 20%, rgba(20,184,166,0.14), transparent 60%), radial-gradient(900px 900px at 40% 90%, rgba(99,102,241,0.10), transparent 55%), linear-gradient(180deg, var(--bg0), var(--bg1))',
        }}
      />

      {/* Aurora blobs */}
      <div className="absolute -left-24 top-[-6rem] h-[26rem] w-[26rem] rounded-full bg-[rgba(34,211,238,0.28)] blur-3xl" />
      <div className="absolute -right-28 top-[-5rem] h-[28rem] w-[28rem] rounded-full bg-[rgba(20,184,166,0.26)] blur-3xl" />
      <div className="absolute left-1/3 top-[55%] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[rgba(59,130,246,0.14)] blur-3xl" />

      {/* Subtle noise overlay (pure CSS) */}
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.06), rgba(255,255,255,0.06) 1px, transparent 1px, transparent 2px), repeating-linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.06) 1px, transparent 1px, transparent 3px)',
        }}
      />
    </div>
  );
}

