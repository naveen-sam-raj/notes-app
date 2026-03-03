import { useState, useEffect, useRef } from "react";
import { gsap } from "https://esm.sh/gsap@3.12.5";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { signOut } from "firebase/auth";

import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
const INITIAL_NOTES = [
  {
    id: 1,
    title: "Meeting Notes",
    body: "Discuss project timeline with the team. Review milestones and assign tasks for next sprint.",
    date: "2025-02-20",
    color: "#22d3ee",
  },
  {
    id: 2,
    title: "Shopping List",
    body: "Milk, Eggs, Bread, Butter, Coffee, Fruits, Vegetables, Cheese.",
    date: "2025-02-21",
    color: "#3b82f6",
  },
  {
    id: 3,
    title: "Book Ideas",
    body: "Read Atomic Habits, Deep Work, The Lean Startup. Take notes and apply key learnings.",
    date: "2025-02-22",
    color: "#22d3ee",
  },
  {
    id: 4,
    title: "Workout Plan",
    body: "Mon: Chest & Triceps. Wed: Back & Biceps. Fri: Legs & Shoulders. Weekend: Cardio.",
    date: "2025-02-23",
    color: "#3b82f6",
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | "add" | "edit" | "view"
  const [active, setActive] = useState(null); // current note
  const [form, setForm] = useState({ title: "", body: "" });
  const [deleteId, setDeleteId] = useState(null);
  const [sideOpen, setSideOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const handleAISummary = async (note) => {
    setAiSummary("");
    setAiLoading(true);
    setModal("ai");
    requestAnimationFrame(() => {
      if (modalRef.current)
        gsap.fromTo(modalRef.current, { scale: 0.93, opacity: 0, y: 20 }, { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.4)" });
    });
    try {
      const res = await fetch(`${import.meta.env.HF_SERVER}/api/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: note.body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiSummary("⚠️ " + (data.error || "AI failed. Try again."));
      } else {
        setAiSummary(data.summary);
      }
    } catch (err) {
      console.log(err);
      setAiSummary("❌ Could not connect to AI server.");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const loadNotes = async () => {
      const q = query(collection(db, "notes"), where("userId", "==", user.uid));

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setNotes(data);
    };

    loadNotes();
  }, [user]);

  // Refs
  const headerRef = useRef(null);
  const userRef = useRef(null);
  const statsRef = useRef(null);
  const gridRef = useRef(null);
  const bg1 = useRef(null);
  const bg2 = useRef(null);
  const modalRef = useRef(null);
  const sideRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (bg1.current) {
        gsap.to(bg1.current, {
          x: 30,
          y: -25,
          duration: 8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        gsap.to(bg2.current, {
          x: -25,
          y: 20,
          duration: 10,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 2,
        });
      }

      if (
        headerRef.current &&
        userRef.current &&
        statsRef.current &&
        gridRef.current
      ) {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.fromTo(
          headerRef.current,
          { y: -30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55 },
        )
          .fromTo(
            userRef.current,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5 },
            "-=0.2",
          )
          .fromTo(
            statsRef.current,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.45 },
            "-=0.2",
          )
          .fromTo(
            gridRef.current,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.45 },
            "-=0.15",
          );
      }
    });

    return () => ctx.revert(); // ⭐ VERY IMPORTANT
  }, []);
  // animate note cards when notes change
  useEffect(() => {
    const cards = cardRefs.current?.filter(Boolean) || [];

    if (!cards.length) return;

    gsap.fromTo(
      cards,
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.07 },
    );
  }, [notes.length]);

  // modal open animation
  const openModal = (type, note = null) => {
    setActive(note);
    setForm(
      note ? { title: note.title, body: note.body } : { title: "", body: "" },
    );
    setModal(type);
    requestAnimationFrame(() => {
      if (modalRef.current) {
        gsap.fromTo(
          modalRef.current,
          { scale: 0.93, opacity: 0, y: 20 },
          { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.4)" },
        );
      }
    });
  };

  const closeModal = () => {
    if (modalRef.current) {
      gsap.to(modalRef.current, {
        scale: 0.95,
        opacity: 0,
        y: 10,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          setModal(null);
          setActive(null);
          setDeleteId(null);
        },
      });
    } else {
      setModal(null);
      setActive(null);
      setDeleteId(null);
    }
  };

  const handleAddNote = () => {
    if (!user) {
      navigate("/login"); // redirect to login
      return;
    }

    openModal("add"); // open add note modal
  };

  const handleAdd = async () => {
    if (!form.title.trim() || !user) return;

    const newNote = {
      title: form.title,
      body: form.body,
      userId: user.uid,
      date: new Date().toISOString(),
      color: Math.random() > 0.5 ? "#22d3ee" : "#3b82f6",
    };

    const docRef = await addDoc(collection(db, "notes"), newNote);

    setNotes((prev) => [{ id: docRef.id, ...newNote }, ...prev]);

    closeModal();
  };

  const handleEdit = async () => {
    if (!form.title.trim()) return;

    const noteRef = doc(db, "notes", active.id);

    await updateDoc(noteRef, {
      title: form.title,
      body: form.body,
    });

    setNotes((prev) =>
      prev.map((n) =>
        n.id === active.id ? { ...n, title: form.title, body: form.body } : n,
      ),
    );

    closeModal();
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "notes", id));

    setNotes((prev) => prev.filter((n) => n.id !== id));

    closeModal();
  };

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.body.toLowerCase().includes(search.toLowerCase()),
  );

  const today = new Date().toISOString().split("T")[0];
  const todayCount = notes.filter((n) => n.date === today).length;

  // sidebar toggle
  const toggleSide = () => {
    if (!sideOpen) {
      setSideOpen(true);

      requestAnimationFrame(() => {
        if (!sideRef.current) return; // ⭐ FIX

        gsap.fromTo(
          sideRef.current,
          { x: "100%", opacity: 0 },
          { x: "0%", opacity: 1, duration: 0.35, ease: "power3.out" },
        );
      });
    } else {
      if (!sideRef.current) {
        setSideOpen(false);
        return;
      }

      gsap.to(sideRef.current, {
        x: "100%",
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => setSideOpen(false),
      });
    }
  };

  // ── styles
  const S = {
    page: {
      minHeight: "100vh",
      background: "#020c1b",
      fontFamily: "'Inter', system-ui, sans-serif",
      color: "#f0f9ff",
      position: "relative",
      overflow: "hidden",
    },
    card: {
      background: "#0b1628",
      border: "1px solid #1e293b",
      borderRadius: 16,
      padding: "1.4rem",
      cursor: "pointer",
      transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
      position: "relative",
      overflow: "hidden",
    },
    input: {
      width: "100%",
      background: "#0f172a",
      border: "1.5px solid #1e293b",
      borderRadius: 10,
      padding: "0.75rem 1rem",
      color: "#f0f9ff",
      fontSize: "0.92rem",
      fontFamily: "inherit",
      outline: "none",
      transition: "border-color 0.2s",
    },
    label: {
      display: "block",
      fontSize: "0.76rem",
      fontWeight: 600,
      color: "#64748b",
      marginBottom: "0.35rem",
    },
    btn: (variant = "primary") => ({
      padding: "0.72rem 1.3rem",
      border: "none",
      borderRadius: 10,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: "0.88rem",
      fontWeight: 600,
      transition: "all 0.2s",
      ...(variant === "primary" && {
        background: "linear-gradient(135deg,#0891b2,#22d3ee)",
        color: "#001a24",
        boxShadow: "0 4px 16px rgba(34,211,238,0.2)",
      }),
      ...(variant === "ghost" && {
        background: "transparent",
        color: "#64748b",
        border: "1px solid #1e293b",
      }),
      ...(variant === "danger" && {
        background: "rgba(239,68,68,0.12)",
        color: "#f87171",
        border: "1px solid rgba(239,68,68,0.25)",
      }),
      ...(variant === "icon" && {
        background: "rgba(255,255,255,0.04)",
        color: "#64748b",
        border: "1px solid #1e293b",
        padding: "0.45rem 0.7rem",
        borderRadius: 8,
      }),
    }),
  };

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: #334155; }
        textarea { resize: vertical; min-height: 110px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .note-card:hover { border-color: rgba(34,211,238,0.35) !important; transform: translateY(-3px) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important; }
        .icon-btn:hover { color: #22d3ee !important; border-color: rgba(34,211,238,0.3) !important; }
        .add-btn:hover  { box-shadow: 0 6px 24px rgba(34,211,238,0.35) !important; transform: translateY(-1px); }
        input:focus, textarea:focus { border-color: #22d3ee !important; box-shadow: 0 0 0 3px rgba(34,211,238,0.1); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0b1628; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
      `}</style>

      {/* bg glows */}
      <div
        ref={bg1}
        style={{
          position: "fixed",
          width: 500,
          height: 500,
          top: "-10%",
          left: "-10%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 65%)",
          filter: "blur(40px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        ref={bg2}
        style={{
          position: "fixed",
          width: 450,
          height: 450,
          bottom: "-10%",
          right: "-8%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 65%)",
          filter: "blur(40px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ════ HEADER ════ */}
      <header
        ref={headerRef}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(2,12,27,0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid #1e293b",
          padding: "0 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 60,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "rgba(34,211,238,0.1)",
              border: "1px solid rgba(34,211,238,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "'Space Grotesk',sans-serif",
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "#f0f9ff",
            }}
          >
            Note<span style={{ color: "#22d3ee" }}>Flow</span>
          </span>
        </div>

        {/* right */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={handleAddNote}
            className="add-btn"
            style={{
              ...S.btn("primary"),
              padding: "0.5rem 1rem",
              fontSize: "0.82rem",
            }}
          >
            + New Note
          </button>

          {/* LOGIN / USER SWITCH */}
          {!user ? (
            <button
              onClick={() => navigate("/login")}
              style={{
                ...S.btn("primary"),
                padding: "0.5rem 1rem",
                fontSize: "0.82rem",
              }}
            >
              Login
            </button>
          ) : (
            <div
              onClick={toggleSide}
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                cursor: "pointer",
                background: "linear-gradient(135deg,#0891b2,#22d3ee)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.78rem",
                color: "#001a24",
                border: "2px solid rgba(34,211,238,0.3)",
              }}
            >
              {user?.displayName?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
        </div>
      </header>

      {/* ════ MAIN ════ */}
      <main
        style={{ maxWidth: 1000, margin: "0 auto", padding: "1.8rem 1.5rem" }}
      >
        {/* ── USER CARD ── */}
        <div
          ref={userRef}
          style={{
            background: "#0b1628",
            border: "1px solid #1e293b",
            borderRadius: 16,
            padding: "1.5rem 1.8rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "1.4rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* left accent */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              background: "linear-gradient(180deg,#22d3ee,#3b82f6)",
              borderRadius: "16px 0 0 16px",
            }}
          />

          {/* avatar */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              flexShrink: 0,
              background: "linear-gradient(135deg,#0891b2,#22d3ee)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Space Grotesk',sans-serif",
              fontWeight: 700,
              fontSize: "1.1rem",
              color: "#001a24",
              boxShadow: "0 0 20px rgba(34,211,238,0.25)",
            }}
          >
            {user?.displayName?.charAt(0)?.toUpperCase() || "G"}
          </div>

          {/* info */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "'Space Grotesk',sans-serif",
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "#f0f9ff",
              }}
            >
              {user?.displayName || "Guest"}
            </div>
            <div
              style={{ color: "#475569", fontSize: "0.82rem", marginTop: 2 }}
            >
              {user?.email || "No email"}
            </div>
            <div
              style={{ color: "#334155", fontSize: "0.75rem", marginTop: 2 }}
            >
              Member since Recently
            </div>
          </div>

          {/* welcome */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.78rem", color: "#475569" }}>
              Good{" "}
              {new Date().getHours() < 12
                ? "Morning"
                : new Date().getHours() < 17
                  ? "Afternoon"
                  : "Evening"}{" "}
              👋
            </div>
            <div
              style={{
                fontSize: "0.82rem",
                color: "#22d3ee",
                fontWeight: 600,
                marginTop: 2,
              }}
            >
              Ready to take notes?
            </div>
          </div>
        </div>

        {/* ── STATS ── */}
        <div
          ref={statsRef}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: "1rem",
            marginBottom: "1.8rem",
          }}
        >
          {[
            { label: "Total Notes", value: notes.length },
            { label: "Added Today", value: todayCount },
            { label: "Member Since", value: "Recently" },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                background: "#0b1628",
                border: "1px solid #1e293b",
                borderRadius: 14,
                padding: "1.1rem 1.3rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <div style={{ fontSize: "1.5rem" }}>{s.icon}</div>
              <div>
                <div
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    fontFamily: "'Space Grotesk',sans-serif",
                    color: s.color,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#475569",
                    marginTop: 1,
                  }}
                >
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── SEARCH + NOTES ── */}
        <div ref={gridRef}>
          {/* search row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.2rem",
              gap: "1rem",
            }}
          >
            <div style={{ position: "relative", flex: 1 }}>
              <svg
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#475569"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...S.input, paddingLeft: "2.4rem", marginBottom: 0 }}
              />
            </div>
            <span
              style={{
                color: "#334155",
                fontSize: "0.8rem",
                whiteSpace: "nowrap",
              }}
            >
              {filtered.length} note{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* empty */}
          {filtered.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "4rem 1rem",
                color: "#334155",
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>
                📭
              </div>
              <div
                style={{
                  fontWeight: 600,
                  color: "#475569",
                  marginBottom: "0.4rem",
                }}
              >
                No notes found
              </div>
              <div style={{ fontSize: "0.82rem" }}>
                {search
                  ? "Try a different keyword"
                  : 'Click "+ New Note" to get started'}
              </div>
            </div>
          )}

          {/* notes grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))",
              gap: "1rem",
            }}
          >
            {filtered.map((note, i) => (
              <div
                key={note.id}
                ref={(el) => (cardRefs.current[i] = el)}
                className="note-card"
                style={{ ...S.card }}
                onClick={() => openModal("view", note)}
              >
                {/* top color bar */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: `linear-gradient(90deg,${note.color},${note.color}88)`,
                    borderRadius: "16px 16px 0 0",
                  }}
                />

                <div
                  style={{
                    fontFamily: "'Space Grotesk',sans-serif",
                    fontSize: "0.97rem",
                    fontWeight: 700,
                    color: "#f0f9ff",
                    marginBottom: "0.5rem",
                    marginTop: "0.2rem",
                  }}
                >
                  {note.title}
                </div>
                <div
                  style={{
                    color: "#475569",
                    fontSize: "0.82rem",
                    lineHeight: 1.65,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {note.body}
                </div>

                {/* footer */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: "1rem",
                    paddingTop: "0.8rem",
                    borderTop: "1px solid #1e293b",
                  }}
                >
                  <span style={{ fontSize: "0.72rem", color: "#334155" }}>
                    {new Date(note.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <div
                    style={{ display: "flex", gap: 6 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="icon-btn"
                      style={S.btn("icon")}
                      onClick={() => handleAISummary(note)}
                      title="AI Summary"
                    >
                      🤖
                    </button>
                    <button
                      className="icon-btn"
                      style={S.btn("icon")}
                      onClick={() => openModal("edit", note)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="icon-btn"
                      style={{ ...S.btn("icon"), color: "#f87171" }}
                      onClick={() => {
                        setActive(note);
                        setDeleteId(note.id);
                        setModal("delete");
                        requestAnimationFrame(() => {
                          if (modalRef.current)
                            gsap.fromTo(
                              modalRef.current,
                              { scale: 0.93, opacity: 0 },
                              {
                                scale: 1,
                                opacity: 1,
                                duration: 0.25,
                                ease: "back.out(1.4)",
                              },
                            );
                        });
                      }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ════ MODALS ════ */}
      {modal && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0b1628",
              border: "1px solid #1e293b",
              borderRadius: 18,
              padding: "2rem 1.8rem",
              width: "100%",
              maxWidth: 460,
              boxShadow:
                "0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,211,238,0.06)",
              position: "relative",
            }}
          >
            {/* top accent */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "30%",
                right: "30%",
                height: 2,
                background:
                  "linear-gradient(90deg,transparent,#22d3ee,transparent)",
                borderRadius: "0 0 4px 4px",
              }}
            />

            {/* VIEW */}
            {modal === "view" && active && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "1.2rem",
                  }}
                >
                  <h2
                    style={{
                      fontFamily: "'Space Grotesk',sans-serif",
                      fontSize: "1.15rem",
                      fontWeight: 700,
                      color: "#f0f9ff",
                      flex: 1,
                      paddingRight: "1rem",
                    }}
                  >
                    {active.title}
                  </h2>
                  <button
                    onClick={closeModal}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#475569",
                      cursor: "pointer",
                      fontSize: "1.1rem",
                      padding: 4,
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                </div>
                <p
                  style={{
                    color: "#94a3b8",
                    fontSize: "0.9rem",
                    lineHeight: 1.75,
                    marginBottom: "1.5rem",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {active.body}
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "0.7rem",
                    justifyContent: "flex-end",
                  }}
                >
                  <button style={S.btn("ghost")} onClick={closeModal}>
                    Close
                  </button>
                  <button
                    style={S.btn("primary")}
                    onClick={() => openModal("edit", active)}
                  >
                    Edit Note
                  </button>
                </div>
              </>
            )}

            {/* ADD / EDIT */}
            {(modal === "add" || modal === "edit") && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1.4rem",
                  }}
                >
                  <h2
                    style={{
                      fontFamily: "'Space Grotesk',sans-serif",
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: "#f0f9ff",
                    }}
                  >
                    {modal === "add" ? "New Note" : "Edit Note"}
                  </h2>
                  <button
                    onClick={closeModal}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#475569",
                      cursor: "pointer",
                      fontSize: "1.1rem",
                    }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={S.label}>Title</label>
                  <input
                    style={S.input}
                    placeholder="Note title..."
                    value={form.title}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, title: e.target.value }))
                    }
                    autoFocus
                  />
                </div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={S.label}>Content</label>
                  <textarea
                    style={{ ...S.input, resize: "vertical", minHeight: 110 }}
                    placeholder="Write your note..."
                    value={form.body}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, body: e.target.value }))
                    }
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "0.7rem",
                    justifyContent: "flex-end",
                  }}
                >
                  <button style={S.btn("ghost")} onClick={closeModal}>
                    Cancel
                  </button>
                  <button
                    style={S.btn("primary")}
                    onClick={modal === "add" ? handleAdd : handleEdit}
                  >
                    {modal === "add" ? "Save Note" : "Update Note"}
                  </button>
                </div>
              </>
            )}

            {/* DELETE CONFIRM */}
            {modal === "delete" && (
              <>
                <div style={{ textAlign: "center", marginBottom: "1.4rem" }}>
                  <div style={{ fontSize: "2.2rem", marginBottom: "0.75rem" }}>
                    🗑️
                  </div>
                  <h2
                    style={{
                      fontFamily: "'Space Grotesk',sans-serif",
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      color: "#f0f9ff",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Delete Note?
                  </h2>
                  <p style={{ color: "#475569", fontSize: "0.85rem" }}>
                    "<span style={{ color: "#94a3b8" }}>{active?.title}</span>"
                    will be permanently deleted.
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "0.7rem",
                    justifyContent: "center",
                  }}
                >
                  <button style={S.btn("ghost")} onClick={closeModal}>
                    Cancel
                  </button>
                  <button
                    style={S.btn("danger")}
                    onClick={() => handleDelete(deleteId)}
                  >
                    Yes, Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ════ AI SUMMARY MODAL ════ */}
      {modal === "ai" && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0b1628",
              border: "1px solid rgba(34,211,238,0.2)",
              borderRadius: 20,
              padding: "2rem 1.8rem",
              width: "100%", maxWidth: 480,
              boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(34,211,238,0.06)",
              position: "relative",
            }}
          >
            {/* top glow bar */}
            <div style={{
              position: "absolute", top: 0, left: "20%", right: "20%", height: 2,
              background: "linear-gradient(90deg,transparent,#22d3ee,#3b82f6,transparent)",
              borderRadius: "0 0 4px 4px",
            }} />

            {/* header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: "linear-gradient(135deg,rgba(8,145,178,0.2),rgba(34,211,238,0.15))",
                  border: "1px solid rgba(34,211,238,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.3rem",
                  boxShadow: "0 0 20px rgba(34,211,238,0.15)",
                }}>
                  🤖
                </div>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: "#f0f9ff", fontSize: "1rem" }}>
                    AI Summary
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#475569" }}>Powered by Qwen AI</div>
                </div>
              </div>
              <button onClick={closeModal} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "1.1rem", padding: 4 }}>✕</button>
            </div>

            {/* content */}
            {aiLoading ? (
              <div style={{ textAlign: "center", padding: "2rem 0" }}>
                <div style={{
                  width: 40, height: 40, border: "3px solid #1e293b",
                  borderTop: "3px solid #22d3ee", borderRadius: "50%",
                  margin: "0 auto 1rem",
                  animation: "spin 0.8s linear infinite",
                }} />
                <div style={{ color: "#475569", fontSize: "0.85rem" }}>Generating summary...</div>
              </div>
            ) : (
              <div style={{
                background: "rgba(34,211,238,0.04)",
                border: "1px solid rgba(34,211,238,0.12)",
                borderRadius: 12, padding: "1.2rem 1.4rem",
                color: "#cbd5e1", fontSize: "0.92rem",
                lineHeight: 1.75, whiteSpace: "pre-wrap",
              }}>
                {aiSummary}
              </div>
            )}

            {/* close btn */}
            {!aiLoading && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.2rem" }}>
                <button style={S.btn("primary")} onClick={closeModal}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ PROFILE SIDEBAR ════ */}
      {sideOpen && (
        <>
          <div
            onClick={toggleSide}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 80,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
            }}
          />
          <div
            ref={sideRef}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              zIndex: 90,
              width: 280,
              background: "#0b1628",
              borderLeft: "1px solid #1e293b",
              padding: "2rem 1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}
          >
            {/* close */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontWeight: 700,
                  color: "#f0f9ff",
                }}
              >
                Profile
              </span>
              <button
                onClick={toggleSide}
                style={{
                  background: "none",
                  border: "none",
                  color: "#475569",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                }}
              >
                ✕
              </button>
            </div>

            {/* avatar block */}
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#0891b2,#22d3ee)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontWeight: 700,
                  fontSize: "1.3rem",
                  color: "#001a24",
                  margin: "0 auto 0.75rem",
                  boxShadow: "0 0 20px rgba(34,211,238,0.25)",
                }}
              >
                {user?.displayName?.charAt(0)?.toUpperCase() || "G"}
              </div>
              <div
                style={{
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontWeight: 700,
                  color: "#f0f9ff",
                }}
              >
                {user?.displayName || "Guest"}
              </div>
              <div
                style={{ color: "#475569", fontSize: "0.8rem", marginTop: 3 }}
              >
                {user?.email || ""}
              </div>
            </div>

            {/* stats */}
            <div
              style={{
                background: "#0f172a",
                borderRadius: 12,
                padding: "1rem",
                border: "1px solid #1e293b",
              }}
            >
              {[
                { label: "Total Notes", value: notes.length },
                { label: "Added Today", value: todayCount },
                { label: "Member Since", value: "Recently" },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.5rem 0",
                    borderBottom: i < 2 ? "1px solid #1e293b" : "none",
                  }}
                >
                  <span style={{ color: "#475569", fontSize: "0.82rem" }}>
                    {s.label}
                  </span>
                  <span
                    style={{
                      color: "#22d3ee",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                    }}
                  >
                    {s.value}
                  </span>
                </div>
              ))}
            </div>

            {/* logout */}
            <button
              onClick={handleLogout}
              style={{ ...S.btn("danger"), width: "100%", marginTop: "auto" }}
            >
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
