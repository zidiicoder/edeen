import { useState } from "react";

const MOODS = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😌", label: "Calm" },
  { emoji: "😔", label: "Sad" },
  { emoji: "😤", label: "Frustrated" },
  { emoji: "🥰", label: "Grateful" },
  { emoji: "😴", label: "Tired" },
];

const INITIAL_ENTRIES = [];

const THEMES = {
  amber: {
    card: "#FFF8EC",
    border: "#F5C842",
    badge: "#FEF3C7",
    badgeText: "#92600A",
    leaf: "#F5C84280",
  },
  mint: {
    card: "#EDFAF4",
    border: "#5DBD8A",
    badge: "#D1FAE5",
    badgeText: "#065F46",
    leaf: "#5DBD8A60",
  },
  lavender: {
    card: "#F5F0FF",
    border: "#9B7FE8",
    badge: "#EDE9FE",
    badgeText: "#4C1D95",
    leaf: "#9B7FE860",
  },
  rose: {
    card: "#FFF0F3",
    border: "#F472B6",
    badge: "#FCE7F3",
    badgeText: "#831843",
    leaf: "#F472B660",
  },
};

function LeafDecoration({ color }) {
  return (
    <svg
      viewBox="0 0 120 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute bottom-0 right-0 w-28 h-36 pointer-events-none select-none"
      aria-hidden="true"
    >
      <path
        d="M90 150 C90 150 20 130 10 60 C0 -10 80 10 90 150Z"
        fill={color}
        opacity="0.6"
      />
      <path
        d="M90 150 L50 80"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.8"
      />
      <path d="M50 80 C40 65 30 55 20 45" stroke={color} strokeWidth="1" opacity="0.6" />
      <path d="M50 80 C55 62 58 50 60 35" stroke={color} strokeWidth="1" opacity="0.6" />
      <path d="M65 110 C55 95 45 85 35 75" stroke={color} strokeWidth="1" opacity="0.5" />
      <path
        d="M110 140 C110 140 60 128 55 85 C50 42 105 55 110 140Z"
        fill={color}
        opacity="0.35"
      />
      <path d="M110 140 L82 100" stroke={color} strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

function JournalCard({ entry, onDelete }) {
  const t = THEMES[entry.theme];
  return (
    <div
      className="relative overflow-hidden rounded-2xl mb-4 shadow-sm"
      style={{ background: t.card, borderLeft: `4px solid ${t.border}` }}
    >
      <LeafDecoration color={t.leaf} />
      <div className="relative z-10 p-5 pr-16">
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-xs font-semibold tracking-widest px-3 py-1 rounded-full"
            style={{ background: t.badge, color: t.badgeText }}
          >
            {entry.date}
          </span>
        </div>
        <h2
          className="text-xl font-bold mb-2 leading-snug"
          style={{ fontFamily: "'Lora', Georgia, serif", color: "#1a1a1a" }}
        >
          {entry.title}
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
          {entry.body}
        </p>
      </div>
      <div
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm"
        style={{ background: "#fff" }}
      >
        {entry.mood}
      </div>
    </div>
  );
}

function NewEntryScreen({ onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState(null);
  const [theme, setTheme] = useState("amber");
  const [titleError, setTitleError] = useState(false);
  const [moodError, setMoodError] = useState(false);

  function handleSave() {
    const titleOk = title.trim().length > 0;
    const moodOk = mood !== null;
    setTitleError(!titleOk);
    setMoodError(!moodOk);
    if (!titleOk || !moodOk) return;
    const now = new Date();
    const dateStr = now
      .toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
      .toUpperCase();
    onSave({ title: title.trim(), body: body.trim(), mood, theme, date: dateStr });
  }

  const t = THEMES[theme];

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col overflow-y-auto hide-scrollbar"
      style={{ background: "#f0ede8" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "#e0dbd4" }}
          aria-label="Go back"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2
          className="text-base font-bold"
          style={{ fontFamily: "'Lora', Georgia, serif", color: "#1a1a1a" }}
        >
          New Entry
        </h2>
        <button
          onClick={handleSave}
          className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all active:scale-95"
          style={{ background: "#1a1a1a", color: "#fff" }}
        >
          Save
        </button>
      </div>

      <div className="px-5 pb-8 flex flex-col gap-5">

        {/* Date display */}
        <p className="text-xs font-semibold tracking-widest" style={{ color: "#aaa" }}>
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase()}
        </p>

        {/* Title */}
        <div>
          <label className="text-xs font-semibold tracking-widest mb-2 block" style={{ color: "#888" }}>
            TITLE
          </label>
          <input
            className="w-full rounded-2xl px-4 py-3 text-base font-semibold outline-none transition-all"
            style={{
              background: titleError ? "#fff0f0" : "#fff",
              fontFamily: "'Lora', Georgia, serif",
              color: "#1a1a1a",
              border: titleError ? "1.5px solid #f87171" : "1.5px solid transparent",
            }}
            placeholder="What's on your mind today?"
            value={title}
            maxLength={80}
            onChange={(e) => { setTitle(e.target.value); setTitleError(false); }}
          />
          <div className="flex justify-between mt-1 px-1">
            {titleError
              ? <span className="text-xs" style={{ color: "#ef4444" }}>Please add a title</span>
              : <span />}
            <span className="text-xs" style={{ color: "#bbb" }}>{title.length}/80</span>
          </div>
        </div>

        {/* Body */}
        <div>
          <label className="text-xs font-semibold tracking-widest mb-2 block" style={{ color: "#888" }}>
            YOUR THOUGHTS
          </label>
          <textarea
            className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none transition-all"
            style={{
              background: "#fff",
              fontFamily: "inherit",
              color: "#333",
              lineHeight: "1.7",
              border: "1.5px solid transparent",
              minHeight: "140px",
            }}
            placeholder="Write freely — no rules, no judgment. This is just for you..."
            value={body}
            maxLength={1000}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="flex justify-end mt-1 px-1">
            <span className="text-xs" style={{ color: "#bbb" }}>{body.length}/1000</span>
          </div>
        </div>

        {/* Mood picker */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold tracking-widest" style={{ color: "#888" }}>
              HOW ARE YOU FEELING?
            </label>
            {moodError && <span className="text-xs" style={{ color: "#ef4444" }}>Pick a mood</span>}
          </div>
          <div
            className="rounded-2xl p-4 grid grid-cols-3 gap-3"
            style={{ background: "#fff", border: moodError ? "1.5px solid #f87171" : "1.5px solid transparent" }}
          >
            {MOODS.map((m) => {
              const selected = mood === m.emoji;
              return (
                <button
                  key={m.emoji}
                  onClick={() => { setMood(m.emoji); setMoodError(false); }}
                  className="flex flex-col items-center gap-1.5 py-2 rounded-xl transition-all"
                  style={{
                    background: selected ? "#1a1a1a" : "#f7f5f2",
                    transform: selected ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: selected ? "#fff" : "#888" }}
                  >
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card color */}
        <div>
          <label className="text-xs font-semibold tracking-widest mb-2 block" style={{ color: "#888" }}>
            CARD COLOR
          </label>
          <div className="flex gap-3">
            {Object.entries(THEMES).map(([key, th]) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className="flex-1 h-10 rounded-xl transition-all flex items-center justify-center"
                style={{
                  background: th.card,
                  border: theme === key ? `2.5px solid ${th.border}` : "2.5px solid transparent",
                }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: th.border }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Live preview */}
        {title.trim().length > 0 && (
          <div>
            <label className="text-xs font-semibold tracking-widest mb-2 block" style={{ color: "#888" }}>
              PREVIEW
            </label>
            <div
              className="relative overflow-hidden rounded-2xl shadow-sm"
              style={{ background: t.card, borderLeft: `4px solid ${t.border}` }}
            >
              <LeafDecoration color={t.leaf} />
              <div className="relative z-10 p-5 pr-14">
                <span
                  className="text-xs font-semibold tracking-widest px-3 py-1 rounded-full inline-block mb-3"
                  style={{ background: t.badge, color: t.badgeText }}
                >
                  {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }).toUpperCase()}
                </span>
                <h3
                  className="text-lg font-bold leading-snug mb-2"
                  style={{ fontFamily: "'Lora', Georgia, serif", color: "#1a1a1a" }}
                >
                  {title}
                </h3>
                {body.trim() && (
                  <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
                    {body.length > 100 ? body.slice(0, 100) + "…" : body}
                  </p>
                )}
              </div>
              {mood && (
                <div
                  className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm"
                  style={{ background: "#fff" }}
                >
                  {mood}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function App() {
  const [entries, setEntries] = useState(INITIAL_ENTRIES);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("journal");

  function handleSave(entry) {
    setEntries([{ id: Date.now(), ...entry }, ...entries]);
    setShowModal(false);
  }

  return (
    <div className="size-full flex items-center justify-center" style={{ background: "#e8e4de" }}>
      {/* Android phone shell */}
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: "min(390px, 100vw)",
          height: "min(844px, 100vh)",
          background: "#f0ede8",
          borderRadius: "min(44px, 0px)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
        }}
      >
        {/* Status bar */}
        <div className="flex justify-between items-center px-6 pt-3 pb-1">
          <span className="text-xs font-semibold" style={{ color: "#333" }}>9:41</span>
          <div className="flex gap-1 items-center">
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <rect x="0" y="4" width="3" height="8" rx="1" fill="#333" />
              <rect x="4.5" y="2.5" width="3" height="9.5" rx="1" fill="#333" />
              <rect x="9" y="0.5" width="3" height="11.5" rx="1" fill="#333" />
              <rect x="13.5" y="0" width="2.5" height="12" rx="1" fill="#333" opacity="0.3" />
            </svg>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="#333">
              <path d="M8 2C5 2 2.5 3.5 1 5.8L2.5 7C3.7 5.1 5.7 4 8 4C10.3 4 12.3 5.1 13.5 7L15 5.8C13.5 3.5 11 2 8 2Z" />
              <path d="M8 5.5C6.2 5.5 4.6 6.3 3.5 7.7L5 9C5.8 7.9 6.8 7.5 8 7.5C9.2 7.5 10.2 7.9 11 9L12.5 7.7C11.4 6.3 9.8 5.5 8 5.5Z" />
              <circle cx="8" cy="11" r="1.5" />
            </svg>
            <div className="flex items-center gap-0.5">
              <div className="rounded-sm" style={{ width: 22, height: 11, border: "1.5px solid #333", padding: "1px" }}>
                <div className="rounded-sm h-full" style={{ width: "75%", background: "#333" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2">
          <div>
            <p className="text-xs font-semibold tracking-widest" style={{ color: "#aaa" }}>
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}
            </p>
            <h1
              className="text-3xl font-bold mt-0.5"
              style={{ fontFamily: "'Lora', Georgia, serif", color: "#1a1a1a" }}
            >
              My Journal
            </h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95"
            style={{ background: "#1a1a1a", color: "#fff" }}
            aria-label="New entry"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3V15M3 9H15" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Mood filter strip */}
        <div className="flex gap-2 px-6 py-3 hide-scrollbar overflow-x-auto">
          {["All", ...MOODS.map((m) => m.emoji)].map((item) => (
            <button
              key={item}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
              style={{
                background: item === "All" ? "#1a1a1a" : "#fff",
                color: item === "All" ? "#fff" : "#555",
                border: "1px solid #e0dbd4",
              }}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Entries */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pb-4">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full" style={{ color: "#bbb" }}>
              <span className="text-5xl mb-3">📖</span>
              <p className="text-sm font-semibold">No entries yet</p>
              <p className="text-xs mt-1">Tap + to write your first one</p>
            </div>
          ) : (
            entries.map((entry) => (
              <JournalCard key={entry.id} entry={entry} />
            ))
          )}
        </div>

        {/* Bottom Nav */}
        <div
          className="flex justify-around items-center px-6 pt-3 pb-5"
          style={{ background: "#fff", borderTop: "1px solid #ece8e2" }}
        >
          {[
            {
              id: "journal",
              label: "Journal",
              icon: (active) => (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="3" y="2" width="16" height="18" rx="3" stroke={active ? "#1a1a1a" : "#bbb"} strokeWidth="1.8" fill={active ? "#f0ede8" : "none"} />
                  <path d="M7 7H15M7 11H15M7 15H11" stroke={active ? "#1a1a1a" : "#bbb"} strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ),
            },
            {
              id: "calendar",
              label: "Calendar",
              icon: (active) => (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="2" y="4" width="18" height="16" rx="3" stroke={active ? "#1a1a1a" : "#bbb"} strokeWidth="1.8" />
                  <path d="M2 9H20" stroke={active ? "#1a1a1a" : "#bbb"} strokeWidth="1.8" />
                  <path d="M7 2V6M15 2V6" stroke={active ? "#1a1a1a" : "#bbb"} strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ),
            },
            {
              id: "insights",
              label: "Insights",
              icon: (active) => (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M3 17L8 11L12 14L17 8L21 11" stroke={active ? "#1a1a1a" : "#bbb"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ),
            },
            {
              id: "profile",
              label: "Profile",
              icon: (active) => (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="7.5" r="3.5" stroke={active ? "#1a1a1a" : "#bbb"} strokeWidth="1.8" />
                  <path d="M3 19C3 15.134 6.686 12 11 12C15.314 12 19 15.134 19 19" stroke={active ? "#1a1a1a" : "#bbb"} strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ),
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center gap-1 transition-all"
            >
              {tab.icon(activeTab === tab.id)}
              <span
                className="text-xs font-semibold"
                style={{ color: activeTab === tab.id ? "#1a1a1a" : "#bbb" }}
              >
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {showModal && (
        <NewEntryScreen onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </div>
  );
}
