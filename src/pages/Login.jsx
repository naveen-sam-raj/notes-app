import { useState, useEffect, useRef } from "react";
import { gsap } from "https://esm.sh/gsap@3.12.5";
import { useNavigate } from "react-router-dom";

import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

const getAuthErrorMessage = (errorCode) => {
  switch (errorCode) {
    case "auth/user-not-found":
      return "Account not registered";

    case "auth/wrong-password":
      return "Incorrect password";

    case "auth/email-already-in-use":
      return "Email already registered";

    case "auth/invalid-email":
      return "Invalid email address";

    case "auth/weak-password":
      return "Password must be at least 6 characters";

    case "auth/invalid-credential":
      return "Invalid email or password";

    case "auth/network-request-failed":
      return "Network error. Check internet connection";

    default:
      return "Something went wrong. Try again";
  }
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const cardRef = useRef(null);
  const logoRef = useRef(null);
  const formRef = useRef(null);
  const btnRef = useRef(null);
  const bg1 = useRef(null);
  const bg2 = useRef(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    setErrorMsg("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/"); // home
    } catch (error) {
      setErrorMsg(getAuthErrorMessage(error.code));
    }
  };

  const handleSignup = async () => {
    setErrorMsg("");

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/login");
    } catch (error) {
      setErrorMsg(getAuthErrorMessage(error.code));
    }
  };

  useEffect(() => {
    // soft bg float
    gsap.to(bg1.current, {
      x: 30,
      y: -20,
      duration: 8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
    gsap.to(bg2.current, {
      x: -25,
      y: 25,
      duration: 10,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 2,
    });

    // card entrance
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(
      cardRef.current,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7 },
    )
      .fromTo(
        logoRef.current,
        { y: -15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45 },
        "-=0.3",
      )
      .fromTo(
        formRef.current,
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45 },
        "-=0.2",
      )
      .fromTo(
        btnRef.current,
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35 },
        "-=0.15",
      );
  }, []);

  const switchTab = (next) => {
    if (next === tab) return;
    gsap.to(formRef.current, {
      y: 10,
      opacity: 0,
      duration: 0.18,
      ease: "power2.in",
      onComplete: () => {
        setTab(next);
        setForm({ name: "", email: "", password: "" });
        gsap.fromTo(
          formRef.current,
          { y: -10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.22, ease: "power2.out" },
        );
      },
    });
  };

  const handleSubmit = async () => {
    if (!form.email || !form.password) return;

    setLoading(true);

    try {
      if (tab === "login") {
        // ✅ LOGIN
        await signInWithEmailAndPassword(auth, form.email, form.password);

        navigate("/"); // go Home
      } else {
        // ✅ SIGNUP
        const userCred = await createUserWithEmailAndPassword(
          auth,
          form.email,
          form.password,
        );

        // update name safely
        if (form.name) {
          await updateProfile(userCred.user, {
            displayName: form.name,
          });
        }

        // clear form
        setForm({ name: "", email: "", password: "" });

        // switch to login tab
        setTab("login");

        // success message
        setErrorMsg("✅ Account created! Please login.");
      }
    } catch (err) {
      setErrorMsg(getAuthErrorMessage(err.code));
    } finally {
      setLoading(false); // ⭐ ALWAYS runs
    }
  };

  const inp = (id, type, placeholder) => (
    <div style={{ position: "relative" }}>
      <input
        type={id === "password" ? (showPass ? "text" : "password") : type}
        placeholder={placeholder}
        value={form[id] || ""}
        onChange={(e) => setForm({ ...form, [id]: e.target.value })}
        onFocus={() => setFocused(id)}
        onBlur={() => setFocused(null)}
        style={{
          width: "100%",
          padding: "0.78rem 1rem",
          paddingRight: id === "password" ? "3.5rem" : "1rem",
          background: "#0f172a",
          border: `1.5px solid ${focused === id ? "#22d3ee" : "#1e293b"}`,
          borderRadius: 10,
          color: "#f0f9ff",
          fontSize: "0.93rem",
          fontFamily: "inherit",
          outline: "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
          boxShadow:
            focused === id ? "0 0 0 3px rgba(34,211,238,0.12)" : "none",
        }}
      />
      {id === "password" && (
        <button
          onClick={() => setShowPass((p) => !p)}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: showPass ? "#22d3ee" : "#475569",
            fontSize: "1rem",
            padding: 0,
            lineHeight: 1,
            transition: "color 0.2s",
          }}
        >
          {showPass ? (
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      )}
    </div>
  );

  {
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#020c1b",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: #334155; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #0f172a inset !important;
          -webkit-text-fill-color: #f0f9ff !important;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* soft background glows — just 2, subtle */}
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
            "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 65%)",
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
            "radial-gradient(circle, rgba(59,130,246,0.13) 0%, transparent 65%)",
          filter: "blur(40px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ════ CARD ════ */}
      <div
        ref={cardRef}
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 400,
          margin: "1rem",
          background: "#0b1628",
          border: "1px solid #1e293b",
          borderRadius: 20,
          padding: "2.4rem 2rem",
          boxShadow:
            "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,211,238,0.06)",
        }}
      >
        {/* thin top accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "30%",
            right: "30%",
            height: 2,
            background:
              "linear-gradient(90deg, transparent, #22d3ee, transparent)",
            borderRadius: "0 0 4px 4px",
          }}
        />

        {/* ── LOGO ── */}
        <div
          ref={logoRef}
          style={{ textAlign: "center", marginBottom: "1.8rem" }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 12,
              marginBottom: "0.85rem",
              background: "rgba(34,211,238,0.08)",
              border: "1px solid rgba(34,211,238,0.2)",
            }}
          >
            <svg
              width="22"
              height="22"
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
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "1.6rem",
              fontWeight: 700,
              color: "#f0f9ff",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            Note<span style={{ color: "#22d3ee" }}>Flow</span>
          </h1>
          <p
            style={{
              color: "#475569",
              fontSize: "0.82rem",
              marginTop: "0.35rem",
              fontWeight: 400,
            }}
          >
            {tab === "login"
              ? "Welcome back! Please sign in."
              : "Create your free account."}
          </p>
        </div>

        {/* ── TABS ── */}
        <div
          style={{
            display: "flex",
            background: "#0f172a",
            borderRadius: 10,
            padding: 4,
            marginBottom: "1.6rem",
            border: "1px solid #1e293b",
          }}
        >
          {["login", "signup"].map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              style={{
                flex: 1,
                padding: "0.55rem",
                border: "none",
                borderRadius: 7,
                background:
                  tab === t
                    ? "linear-gradient(135deg, rgba(6,182,212,0.18), rgba(59,130,246,0.15))"
                    : "transparent",
                color: tab === t ? "#22d3ee" : "#475569",
                fontFamily: "inherit",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.25s",
                border:
                  tab === t
                    ? "1px solid rgba(34,211,238,0.25)"
                    : "1px solid transparent",
              }}
            >
              {t === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* ── FORM ── */}
        <div
          ref={formRef}
          style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
        >
          {errorMsg && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#f87171",
                padding: "0.6rem",
                borderRadius: 8,
                fontSize: "0.85rem",
                marginBottom: "1rem",
                textAlign: "center",
              }}
            >
              {errorMsg}
            </div>
          )}
          {tab === "signup" && (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "#64748b",
                  marginBottom: "0.35rem",
                }}
              >
                Name
              </label>
              {inp("name", "text", "Your name")}
            </div>
          )}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#64748b",
                marginBottom: "0.35rem",
              }}
            >
              Email
            </label>
            {inp("email", "email", "you@example.com")}
          </div>
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.35rem",
              }}
            >
              <label
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "#64748b",
                }}
              >
                Password
              </label>
              {tab === "login" && (
                <button
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    color: "#22d3ee",
                    fontFamily: "inherit",
                    fontWeight: 500,
                  }}
                >
                  Forgot?
                </button>
              )}
            </div>
            {inp(
              "password",
              "password",
              tab === "signup" ? "Min 6 characters" : "••••••••",
            )}
          </div>
          {/* CTA */}
          <button
            ref={btnRef}
            onClick={handleSubmit}
            disabled={loading}
            onMouseEnter={() =>
              gsap.to(btnRef.current, { scale: 1.02, duration: 0.18 })
            }
            onMouseLeave={() =>
              gsap.to(btnRef.current, { scale: 1, duration: 0.18 })
            }
            style={{
              marginTop: "0.3rem",
              width: "100%",
              padding: "0.82rem",
              border: "none",
              borderRadius: 10,
              cursor: loading ? "wait" : "pointer",
              background: "linear-gradient(135deg, #0891b2, #22d3ee)",
              color: "#001a24",
              fontFamily: "inherit",
              fontSize: "0.9rem",
              fontWeight: 700,
              boxShadow: "0 4px 20px rgba(34,211,238,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "opacity 0.2s, box-shadow 0.2s",
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? (
              <>
                <div
                  style={{
                    width: 17,
                    height: 17,
                    border: "2px solid rgba(0,26,36,0.3)",
                    borderTopColor: "#001a24",
                    borderRadius: "50%",
                    animation: "spin 0.75s linear infinite",
                  }}
                />
                {tab === "login" ? "Signing in..." : "Creating..."}
              </>
            ) : tab === "login" ? (
              "Sign In →"
            ) : (
              "Create Account →"
            )}
          </button>
          {/* divider */}
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
            <span style={{ color: "#334155", fontSize: "0.75rem" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
          </div>
          {/* Google */}

          {/* switch */}
          <p
            style={{
              textAlign: "center",
              color: "#475569",
              fontSize: "0.82rem",
              marginTop: "0.2rem",
            }}
          >
            {tab === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              onClick={() => switchTab(tab === "login" ? "signup" : "login")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#22d3ee",
                fontSize: "0.82rem",
                fontWeight: 600,
                fontFamily: "inherit",
              }}
            >
              {tab === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
