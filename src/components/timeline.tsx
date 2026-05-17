import { useState, useEffect, useRef, useCallback } from "react";
import {
  motion, useScroll, useTransform, AnimatePresence,
  useSpring, useInView,
} from "framer-motion";

/* ════════════════════════════════════════════════════════════
   🎵  MUSIC CONFIG — swap this URL with your own song later
   Supported: MP3, OGG, WAV, AAC  (any public URL or relative path)
   Example:  const MUSIC_URL = "/music/our-song.mp3";
   ════════════════════════════════════════════════════════════ */
const MUSIC_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

/* ─── DATA ─────────────────────────────────────────────────── */
const chapters = [
  {
    year: "1998", roman: "I", label: "Where it all began", title: "The Wedding Day",
    quote: "Two souls, one destiny.",
    body: "On a golden afternoon that smelled of jasmine and possibility, two people looked into each other's eyes and said yes — not just to the day, but to every day after it. That single moment became the root of everything.",
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=900&q=80",
    bg: "#1a0e05", accent: "#e8b87a", tint: "rgba(232,184,122,0.12)",
  },
  {
    year: "2003", roman: "II", label: "Building a home", title: "Our First Home",
    quote: "Love is not a place — but it always feels like coming home.",
    body: "The house that became a home. Weekend breakfasts that stretched into noon. The small rituals — a cup of tea waiting, a light left on. These were not small things. They were the whole story.",
    image: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=900&q=80",
    bg: "#05100a", accent: "#7ecfa4", tint: "rgba(126,207,164,0.10)",
  },
  {
    year: "2008", roman: "III", label: "A family full of light", title: "Growing Together",
    quote: "The best things in life aren't things.",
    body: "Laughter echoing off walls. Tiny shoes by the door. Bedtime stories that went on too long because nobody really wanted them to end. These years were loud, chaotic, and absolutely perfect.",
    image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=900&q=80",
    bg: "#0d0614", accent: "#c9a0e8", tint: "rgba(201,160,232,0.10)",
  },
  {
    year: "2026", roman: "IV", label: "Still choosing each other", title: "Forever & Always",
    quote: "Real love stories never have endings.",
    body: "Twenty-eight years of mornings. Twenty-eight years of ordinary Tuesdays made extraordinary by the simple act of being together. The love that started as a spark is now the warmest, steadiest fire.",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=900&q=80",
    bg: "#100508", accent: "#f0a0b0", tint: "rgba(240,160,176,0.10)",
  },
];

/* ════════════════════════════════════════════════════════════
   MUSIC PLAYER HOOK
   Pipeline: <audio> → MediaElementSource → GainNode → AnalyserNode → speakers
   The AnalyserNode feeds 32 frequency bars to the waveform UI in real time.
   ════════════════════════════════════════════════════════════ */
function useMusicPlayer() {
  const audioRef:any    = useRef(null);
  const ctxRef:any      = useRef(null);
  const gainRef:any     = useRef(null);
  const analyserRef:any = useRef(null);
  const rafRef:any      = useRef(null);

  const [playing,  setPlaying]  = useState(false);
  const [volume,   setVolume]   = useState(0.5);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bars,     setBars]     = useState(Array(32).fill(2));

  /* Build Web Audio graph once (after first user gesture) */
const buildGraph = useCallback(() => {
  if (ctxRef.current) return;

  const audio = audioRef.current;

  if (!audio) return;

  // FIX TYPESCRIPT ERROR
  const AudioContextClass =
    window.AudioContext ||
    (
      window as typeof window & {
        webkitAudioContext: typeof AudioContext;
      }
    ).webkitAudioContext;

  const ctx = new AudioContextClass();

  const gain = ctx.createGain();

  const analyser = ctx.createAnalyser();

  analyser.fftSize = 64;

  const source =
    ctx.createMediaElementSource(audio);

  source.connect(gain);

  gain.connect(analyser);

  analyser.connect(ctx.destination);

  gain.gain.value = 0.5;

  ctxRef.current = ctx;

  gainRef.current = gain;

  analyserRef.current = analyser;
}, []);
  /* Kick off rAF waveform loop */
  const startVis = useCallback(() => {
    const analyser:any = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser?.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      setBars(Array.from(data).slice(0, 32).map((v) => Math.max(2, (v / 255) * 60)));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopVis = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setBars(Array(32).fill(2));
  }, []);

  /* Sync time / duration / end */
  useEffect(() => {
    const audio:any = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress(audio.currentTime / (audio.duration || 1));
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnd  = () => { setPlaying(false); stopVis(); };
    audio.addEventListener("timeupdate",     onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended",          onEnd);
    return () => {
      audio.removeEventListener("timeupdate",     onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended",          onEnd);
    };
  }, [stopVis]);

  const toggle = useCallback(async () => {
    const audio:any = audioRef.current;
    if (!audio) return;
    buildGraph();
    if (ctxRef.current?.state === "suspended") await ctxRef.current.resume();
    if (playing) { audio.pause(); setPlaying(false); stopVis(); }
    else         { await audio.play(); setPlaying(true); startVis(); }
  }, [playing, buildGraph, startVis, stopVis]);

  const seek = useCallback((ratio:any) => {
    const audio:any = audioRef.current;
    if (audio && audio.duration) audio.currentTime = ratio * audio.duration;
  }, []);

  const changeVolume = useCallback((v:any) => {
    setVolume(v);
    if (gainRef.current)    gainRef.current.gain.value = v;
    if (audioRef.current)   audioRef.current.volume    = v;
  }, []);

  const fmt = (s:any) =>
    isFinite(s) ? `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}` : "0:00";

  return { audioRef, playing, toggle, volume, changeVolume, progress, seek, duration, bars, fmt };
}

/* ─── MUSIC PLAYER UI ─────────────────────────────────────── */
function MusicPlayer() {
  const {
    audioRef, playing, toggle, volume, changeVolume,
    progress, seek, duration, bars, fmt,
  } = useMusicPlayer();
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Hidden audio element — swap src via MUSIC_URL constant at top of file */}
      <audio ref={audioRef} src={MUSIC_URL} preload="metadata" crossOrigin="anonymous" loop />

      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 2.4, type: "spring", stiffness: 140, damping: 20 }}
        style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          zIndex: 500, display: "flex", flexDirection: "column", alignItems: "center",
        }}
      >
        {/* ── Expanded panel ── */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              style={{
                background: "rgba(12,8,4,0.95)",
                border: "1px solid rgba(232,184,122,0.22)",
                borderRadius: 20, padding: "22px 24px 18px",
                marginBottom: 10, width: 310,
                backdropFilter: "blur(24px)",
              }}
            >
              <p style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 13, color: "#e8b87a", margin: "0 0 16px", textAlign: "center", letterSpacing: 1, opacity: 0.85 }}>
                ♪ Our Song — replace with yours
              </p>

              {/* Live frequency waveform */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 2.5, height: 52, marginBottom: 16, justifyContent: "center" }}>
                {bars.map((h, i) => (
                  <motion.div key={i}
                    animate={{ height: playing ? h : 2 }}
                    transition={{ duration: 0.07 }}
                    style={{
                      width: 5.5, borderRadius: 3, minHeight: 2,
                      background: `hsl(${32 + i * 2},78%,${48 + (h / 60) * 22}%)`,
                    }}
                  />
                ))}
              </div>

              {/* Seek bar */}
              <div
                style={{ position: "relative", height: 5, background: "rgba(232,184,122,0.13)", borderRadius: 4, marginBottom: 7, cursor: "pointer" }}
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  seek((e.clientX - r.left) / r.width);
                }}
              >
                <div style={{ height: "100%", background: "linear-gradient(90deg,#c2855a,#e8b87a)", borderRadius: 4, width: `${Math.round(progress * 100)}%`, transition: "width 0.18s linear" }} />
                <div style={{ position: "absolute", top: "50%", left: `${Math.round(progress * 100)}%`, transform: "translate(-50%,-50%)", width: 13, height: 13, borderRadius: "50%", background: "#e8b87a", boxShadow: "0 0 10px rgba(232,184,122,0.7)", pointerEvents: "none" }} />
              </div>

              {/* Time */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
                <span style={{ fontFamily: "sans-serif", fontSize: 10, color: "rgba(232,184,122,0.45)", letterSpacing: 1 }}>{fmt(progress * duration)}</span>
                <span style={{ fontFamily: "sans-serif", fontSize: 10, color: "rgba(232,184,122,0.45)", letterSpacing: 1 }}>{fmt(duration)}</span>
              </div>

              {/* Volume */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 14, userSelect: "none" }}>{volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}</span>
                <input
                  type="range" min={0} max={1} step={0.01} value={volume}
                  onChange={(e) => changeVolume(parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: "#e8b87a", cursor: "pointer" }}
                />
                <span style={{ fontFamily: "sans-serif", fontSize: 10, color: "rgba(232,184,122,0.45)", minWidth: 32, textAlign: "right" }}>
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Pill ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          background: "rgba(12,8,4,0.90)",
          border: "1px solid rgba(232,184,122,0.28)",
          borderRadius: 100, padding: "10px 20px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 10px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(232,184,122,0.07)",
        }}>
          {/* Play / Pause */}
          <motion.button
            onClick={toggle}
            whileHover={{ scale: 1.14 }}
            whileTap={{ scale: 0.88 }}
            title={playing ? "Pause" : "Play our song"}
            style={{
              width: 42, height: 42, borderRadius: "50%", border: "none", cursor: "pointer",
              background: playing ? "rgba(232,184,122,0.10)" : "#e8b87a",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              transition: "background 0.3s",
            }}
          >
            {playing ? (
              <svg width="14" height="14" viewBox="0 0 14 14">
                <rect x="2"   y="1" width="3.5" height="12" rx="1.5" fill="#e8b87a"/>
                <rect x="8.5" y="1" width="3.5" height="12" rx="1.5" fill="#e8b87a"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14">
                <path d="M3 1.5L12.5 7L3 12.5Z" fill="#1a0e05"/>
              </svg>
            )}
          </motion.button>

          {/* Mini bars */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 22 }}>
            {bars.slice(0, 10).map((h, i) => (
              <motion.div key={i}
                animate={{ height: playing ? Math.max(2, h * 0.37) : 2 }}
                transition={{ duration: 0.07 }}
                style={{ width: 3, borderRadius: 2, minHeight: 2, background: `rgba(232,184,122,${0.3 + (h / 60) * 0.7})` }}
              />
            ))}
          </div>

          <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 15, color: "rgba(232,184,122,0.85)", letterSpacing: 0.5, userSelect: "none", whiteSpace: "nowrap" }}>
            {playing ? "Now Playing ♪" : "Play Our Song"}
          </span>

          {/* Chevron */}
          <motion.button
            onClick={() => setExpanded((e) => !e)}
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            title="Toggle player"
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(232,184,122,0.4)", fontSize: 11, padding: 0, marginLeft: 2, lineHeight: 1 }}
          >▲</motion.button>
        </div>
      </motion.div>
    </>
  );
}

/* ─── PARTICLES / STAR FIELD ─────────────────────────────── */
function useParticles(count = 60) {
  return useRef(Array.from({ length: count }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: 1 + Math.random() * 2.5, opacity: 0.15 + Math.random() * 0.5,
    duration: 4 + Math.random() * 8, delay: Math.random() * 6,
  }))).current;
}
function StarField({ accent }:any) {
  const particles = useParticles(80);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {particles.map((p) => (
        <motion.div key={p.id}
          style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, borderRadius: "50%", background: accent }}
          animate={{ opacity: [p.opacity * 0.3, p.opacity, p.opacity * 0.3], scale: [1, 1.6, 1] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ─── PETALS ─────────────────────────────────────────────── */
const PETALS = Array.from({ length: 22 }, (_, i) => ({
  id: i, x: Math.random() * 100, delay: Math.random() * 20,
  dur: 14 + Math.random() * 10, size: 7 + Math.random() * 11,
  drift: (Math.random() - 0.5) * 160, rot: Math.random() * 360,
}));
function Petals() {
  return (
    <>
      {PETALS.map((p) => (
        <motion.div key={p.id}
          style={{ position: "fixed", left: `${p.x}%`, top: -30, width: p.size, height: p.size * 1.5, borderRadius: "50% 0 50% 0", background: "radial-gradient(circle at 35% 35%,#ffd4b0,#e8907a)", opacity: 0, pointerEvents: "none", zIndex: 1 }}
          animate={{ y: ["0vh","105vh"], x: [0, p.drift], rotate: [p.rot, p.rot + 540], opacity: [0, 0.45, 0.45, 0] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </>
  );
}

/* ─── FLOATING MUSIC NOTES ───────────────────────────────── */
const NOTES_CHARS = ["♩","♪","♫","♬","♭"];
const FLOATING_NOTES = Array.from({ length: 14 }, (_, i) => ({
  id: i, right: 5 + Math.random() * 15, top: Math.random() * 80 + 10,
  size: 16 + Math.random() * 18, hue: 30 + Math.random() * 30,
  dur: 5 + Math.random() * 4, delay: Math.random() * 12,
  dx1: (Math.random() - 0.5) * 30, dx2: (Math.random() - 0.5) * 60,
  char: NOTES_CHARS[i % NOTES_CHARS.length],
}));
function MusicNotes() {
  return (
    <>
      {FLOATING_NOTES.map((n) => (
        <motion.div key={n.id}
          style={{ position: "fixed", right: `${n.right}%`, top: `${n.top}%`, fontSize: n.size, color: `hsl(${n.hue},70%,70%)`, pointerEvents: "none", zIndex: 1, opacity: 0, fontFamily: "serif" }}
          animate={{ y: [0, -80], opacity: [0, 0.35, 0], x: [n.dx1, n.dx2] }}
          transition={{ duration: n.dur, delay: n.delay, repeat: Infinity, ease: "easeOut" }}
        >{n.char}</motion.div>
      ))}
    </>
  );
}

/* ─── TYPEWRITER ─────────────────────────────────────────── */
function Typewriter({ text, accent, delay = 0 }:any) {
  const [displayed, setDisplayed] = useState("");
  const [started,   setStarted]   = useState(false);
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setStarted(true), delay * 1000);
    return () => clearTimeout(t);
  }, [inView, delay]);
  useEffect(() => {
    if (!started) return;
    let i = 0;
    const iv = setInterval(() => { setDisplayed(text.slice(0, ++i)); if (i >= text.length) clearInterval(iv); }, 38);
    return () => clearInterval(iv);
  }, [started, text]);
  return (
    <span ref={ref} style={{ fontStyle: "italic", color: accent, fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "clamp(17px,2.8vw,24px)", letterSpacing: 0.5 }}>
      "{displayed}"
      {displayed.length < text.length && started && (
        <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}
          style={{ display: "inline-block", width: 2, height: "1em", background: accent, marginLeft: 2, verticalAlign: "middle" }} />
      )}
    </span>
  );
}

/* ─── CHAPTER CARD ───────────────────────────────────────── */
function ChapterCard({ chapter, index }:any) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const isLeft = index % 2 === 0;
  const [flipped, setFlipped] = useState(false);

  return (
    <div ref={ref} style={{ position: "relative", display: "flex", justifyContent: "center", marginBottom: "10rem", minHeight: 540 ,border:'2px solid green'}}>

      {/* Timeline node */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }} animate={inView ? { scale: 1, rotate: 0 } : {}}
        transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 18 }}
        style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 64, height: 64, borderRadius: "50%", background: chapter.bg, border: `2.5px solid ${chapter.accent}`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20, boxShadow: `0 0 0 10px rgba(0,0,0,0.6), 0 0 40px ${chapter.accent}55`, flexDirection: "column" }}
      >
        <motion.div
          animate={{ boxShadow: [`0 0 0px ${chapter.accent}00`, `0 0 18px ${chapter.accent}88`, `0 0 0px ${chapter.accent}00`] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          style={{ borderRadius: "50%", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}
        >
          <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", color: chapter.accent, fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>Ch.</span>
          <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", color: chapter.accent, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{chapter.roman}</span>
        </motion.div>
      </motion.div>

      {/* Card wrapper */}
      <motion.div
        initial={{ opacity: 0, x: isLeft ? -120 : 120, rotateY: isLeft ? -15 : 15 }}
        animate={inView ? { opacity: 1, x: 0, rotateY: 0 } : {}}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        style={{ width: "45%", marginLeft: isLeft ? 0 : "auto", marginRight: isLeft ? "auto" : 0, perspective: 1200 }}
      >
        <motion.div
          style={{ position: "relative", transformStyle: "preserve-3d", cursor: "pointer" }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 14 }}
          onClick={() => setFlipped((f) => !f)}
          whileHover={{ scale: 1.025, y: -6 }}
        >
          {/* FRONT */}
          <div style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", borderRadius: 24, overflow: "hidden", background: chapter.bg, border: `1px solid ${chapter.accent}33`, boxShadow: `0 24px 80px rgba(0,0,0,0.65), inset 0 0 80px ${chapter.tint}` }}>
            <div style={{ position: "relative", overflow: "hidden", height: 300 }}>
              <motion.img src={chapter.image} alt={chapter.title} whileHover={{ scale: 1.08 }} transition={{ duration: 0.8 }}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "brightness(0.8) saturate(1.1)" }}
              />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${chapter.bg} 0%, transparent 55%)` }} />
              {[0,1,2,3,4].map((n) => <div key={`t${n}`} style={{ position: "absolute", top: 12, left: `${n*20+2}%`, width: 14, height: 10, borderRadius: 3, background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.12)" }} />)}
              {[0,1,2,3,4].map((n) => <div key={`b${n}`} style={{ position: "absolute", bottom: 12, left: `${n*20+2}%`, width: 14, height: 10, borderRadius: 3, background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.12)" }} />)}
              <div style={{ position: "absolute", top: 32, right: 20, background: chapter.accent, color: chapter.bg, fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 20, fontWeight: 700, padding: "4px 16px", borderRadius: 100 }}>{chapter.year}</div>
              <div style={{ position: "absolute", bottom: 72, right: 18, fontSize: 10, color: `${chapter.accent}88`, letterSpacing: 2, fontFamily: "sans-serif", textTransform: "uppercase" }}>tap to flip ↺</div>
            </div>
            <div style={{ padding: "26px 30px 30px" }}>
              <p style={{ fontFamily: "sans-serif", fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: chapter.accent, margin: "0 0 8px", opacity: 0.8 }}>{chapter.label}</p>
              <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "clamp(22px,3.5vw,32px)", fontWeight: 700, color: "#f5ecd8", margin: "0 0 16px", lineHeight: 1.2 }}>{chapter.title}</h2>
              <Typewriter text={chapter.quote} accent={chapter.accent} delay={0.8} />
            </div>
          </div>

          {/* BACK */}
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)", borderRadius: 24, overflow: "hidden", background: chapter.bg, border: `1px solid ${chapter.accent}55`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 36px", textAlign: "center" }}>
            <StarField accent={chapter.accent} />
            <div style={{ position: "relative", zIndex: 2 }}>
              <div style={{ fontSize: 36, marginBottom: 18 }}>♥</div>
              <p style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "clamp(15px,2.2vw,19px)", color: "#e8ddd0", lineHeight: 1.9, margin: 0 }}>{chapter.body}</p>
              <div style={{ width: 60, height: 1, background: chapter.accent, margin: "26px auto 14px" }} />
              <p style={{ fontFamily: "sans-serif", fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: chapter.accent, opacity: 0.7, margin: 0 }}>tap to go back</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ─── STATS ──────────────────────────────────────────────── */
function Stats() {
  const items = [
    { value: "28",   label: "Years Together"  },
    { value: "365×", label: "Days of Choice"  },
    { value: "∞",    label: "Love Remaining"  },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 }}
      style={{ display: "flex", gap: "clamp(24px,6vw,64px)", justifyContent: "center", margin: "52px 0 0" }}>
      {items.map((s, i) => (
        <motion.div key={i} whileHover={{ y: -4 }} style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "clamp(32px,6vw,56px)", fontWeight: 700, color: "#e8b87a", lineHeight: 1 }}>{s.value}</div>
          <div style={{ fontFamily: "sans-serif", fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(232,184,122,0.6)", marginTop: 6 }}>{s.label}</div>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ─── HEART BURST ────────────────────────────────────────── */
function HeartBurst({ trigger }:any) {
  return (
    <AnimatePresence>
      {trigger && Array.from({ length: 16 }, (_, i) => (
        <motion.div key={i}
          initial={{ opacity: 1, x: 0, y: 0, scale: 0.6 }}
          animate={{ opacity: 0, x: (Math.random() - 0.5) * 240, y: -(60 + Math.random() * 140), scale: 1 + Math.random() * 0.8 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, delay: Math.random() * 0.35, ease: "easeOut" }}
          style={{ position: "absolute", left: "50%", top: "50%", fontSize: 20 + Math.random() * 16, pointerEvents: "none", zIndex: 99, transform: "translate(-50%,-50%)" }}
        >❤️</motion.div>
      ))}
    </AnimatePresence>
  );
}

/* ─── CLOSING POEM ───────────────────────────────────────── */
const poem = [
  "Through every season, storm and still,",
  "You've been each other's greatest will.",
  "From that first yes to every day,",
  "Love wrote itself into your way.",
  "",
  "Happy Anniversary, Mom & Dad.",
  "We love you more than words can hold. ♥",
];
function ClosingPoem() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} style={{ textAlign: "center", padding: "60px 24px 140px" }}>
      {poem.map((line, i) => (
        <motion.p key={i}
          initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: i * 0.22 + 0.3, duration: 0.8 }}
          style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: line === "" ? 8 : (i >= 5 ? "clamp(16px,2.8vw,22px)" : "clamp(15px,2.5vw,20px)"), color: i >= 5 ? "#e8b87a" : "rgba(248,235,210,0.75)", lineHeight: 2.2, margin: 0, fontStyle: i < 5 ? "italic" : "normal", fontWeight: i >= 5 ? 600 : 400 }}
        >{line}</motion.p>
      ))}
    </div>
  );
}

/* ─── SCROLL PROGRESS BAR ────────────────────────────────── */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#c2855a,#e8b87a,#c9a0e8)", transformOrigin: "0%", scaleX, zIndex: 1000 }} />
  );
}

/* ─── APP ────────────────────────────────────────────────── */
export default function TimeLinePhotos() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const lineScaleY  = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const heroY       = useTransform(scrollYProgress, [0, 0.25], [0, -90]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0]);
  const [burst, setBurst] = useState(false);
  const fireBurst = useCallback(() => { setBurst(true); setTimeout(() => setBurst(false), 1800); }, []);

  return (
    <div ref={containerRef} style={{ minHeight: "100vh", background: "#0a0603", overflowX: "hidden", position: "relative", fontFamily: "sans-serif", width:'10%0',border:'0px solid red'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap'); *{box-sizing:border-box;} body{margin:0;}`}</style>

      <ScrollProgress />
      <Petals />
      <MusicNotes />
      <MusicPlayer />

      {/* Ambient glows */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "20%", left: "15%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,140,80,0.07) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: "60%", right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(180,120,200,0.06) 0%, transparent 70%)" }} />
      </div>

      {/* ── HERO ── */}
      <motion.section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 24px", position: "relative", y: heroY, opacity: heroOpacity, zIndex: 2 }}>
        <StarField accent="#e8b87a" />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} style={{ width: 1, height: 60, background: "linear-gradient(to bottom, transparent, #e8b87a)", margin: "0 auto 32px" }} />
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ fontFamily: "sans-serif", fontSize: 11, letterSpacing: 6, textTransform: "uppercase", color: "rgba(232,184,122,0.7)", marginBottom: 20 }}>
          A Love Story · Est. 1998
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 80, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.4, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "clamp(52px,12vw,110px)", fontWeight: 700, color: "#f5ecd8", lineHeight: 0.95, margin: "0 0 20px", position: "relative", zIndex: 2 }}
        >
          Our<br /><span style={{ color: "#e8b87a", fontStyle: "italic" }}>Beautiful</span><br />Journey
        </motion.h1>
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.2, duration: 1 }} style={{ width: 120, height: 1, background: "linear-gradient(90deg, transparent, #e8b87a, transparent)", margin: "20px auto" }} />
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: "italic", fontSize: "clamp(16px,2.5vw,22px)", color: "rgba(245,236,216,0.6)", maxWidth: 480, lineHeight: 1.8, margin: 0 }}>
          Twenty-eight years of choosing each other, every single day.
        </motion.p>
        <Stats />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 }} style={{ position: "relative", marginTop: 52 }}>
          <motion.button onClick={fireBurst} whileHover={{ scale: 1.08, boxShadow: "0 0 40px rgba(232,184,122,0.5)" }} whileTap={{ scale: 0.94 }}
            style={{ background: "transparent", border: "1px solid #e8b87a", color: "#e8b87a", borderRadius: 100, padding: "14px 44px", fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 18, cursor: "pointer", letterSpacing: 1, position: "relative", zIndex: 1 }}>
            Send Love ♥
          </motion.button>
          <HeartBurst trigger={burst} />
        </motion.div>
        <motion.div animate={{ y: [0, 12, 0], opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, duration: 2.2 }} style={{ position: "absolute", bottom: 36, fontSize: 20, color: "#e8b87a" }}>↓</motion.div>
      </motion.section>

      {/* ── TIMELINE ── */}
      <section style={{ maxWidth: 1060, margin: "0 auto", padding: "40px 24px 60px", position: "relative", zIndex: 2 }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: "7rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 60, height: 1, background: "linear-gradient(to right, transparent, #e8b87a)" }} />
            <span style={{ fontFamily: "sans-serif", fontSize: 10, letterSpacing: 5, textTransform: "uppercase", color: "rgba(232,184,122,0.7)" }}>The Story So Far</span>
            <div style={{ width: 60, height: 1, background: "linear-gradient(to left, transparent, #e8b87a)" }} />
          </div>
        </motion.div>
        <div style={{ position: "absolute", left: "50%", top: 160, transform: "translateX(-50%)", width: 1, height: "calc(100% - 200px)", background: "rgba(232,184,122,0.12)", zIndex: 0 }}>
          <motion.div style={{ width: "100%", background: "linear-gradient(to bottom,#c2855a,#e8b87a,#c9a0e8,#f0a0b0)", height: "100%", scaleY: lineScaleY, transformOrigin: "top" }} />
        </div>
        {chapters.map((ch, i) => <ChapterCard key={ch.year} chapter={ch} index={i} />)}
      </section>

      {/* ── CLOSING ── */}
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ position: "relative", zIndex: 2 }}>
        <div style={{ width: 1, height: 80, background: "linear-gradient(to bottom, transparent, #e8b87a, transparent)", margin: "0 auto 20px" }} />
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          {["♥","✦","♥"].map((s, i) => (
            <motion.span key={i} animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2.8, delay: i * 0.4 }} style={{ display: "inline-block", color: "#e8b87a", fontSize: 24, margin: "0 10px" }}>{s}</motion.span>
          ))}
        </div>
        <ClosingPoem />
      </motion.section>
    </div>
  );
}
