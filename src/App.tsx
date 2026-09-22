import { useState } from "react";
import logoImg from "@/imports/image-1.png";
import Dashboard from "@/Dashboard";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

const usuarios: Record<string, { password: string; role: "admin" | "cajero" }> = {
  admin:  { password: "admin",  role: "admin"  },
  david:  { password: "david",  role: "admin"  },
  kevin:  { password: "kevin",  role: "cajero" },
  cajero: { password: "cajero", role: "cajero" },
};

export default function App() {
  const [session, setSession] = useState<{ role: "admin" | "cajero"; username: string } | null>(null);
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (session) return <Dashboard onLogout={() => setSession(null)} role={session.role} username={session.username} />;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!usuario.trim() || !password.trim()) {
      setError("Por favor completa todos los campos.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const u = usuarios[usuario.toLowerCase()];
      if (u && u.password === password) {
        setSession({ role: u.role, username: usuario });
      } else {
        setError("Usuario o contraseña incorrectos.");
      }
    }, 1200);
  }

  const inputBase: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    fontSize: "0.88rem",
    border: "1.5px solid #E2E8F0",
    borderRadius: "12px",
    background: "#F8FAFC",
    color: "#1E293B",
    fontFamily: "'Inter', sans-serif",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F4F7FB",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          margin: "0 16px",
          background: "#FFFFFF",
          borderRadius: "24px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          padding: "40px 36px 36px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Logo — squircle */}
        <div
          style={{
            width: "88px",
            height: "88px",
            borderRadius: "22px",
            overflow: "hidden",
            background: "rgba(251, 191, 36, 0.10)",
            border: "1.5px solid rgba(251, 191, 36, 0.25)",
            marginBottom: "22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={logoImg}
            alt="Shakes Snack"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#0F172A",
            margin: "0 0 6px",
            letterSpacing: "-0.02em",
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          Iniciar Sesión
        </h1>
        <p style={{ fontSize: "0.82rem", color: "#94A3B8", margin: "0 0 28px" }}>
          Sistema de Administración · Shakes Snack
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Usuario */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#475569", letterSpacing: "0.03em" }}>
              Usuario
            </label>
            <input
              type="text"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              placeholder="Ingresa tu usuario"
              autoComplete="username"
              style={inputBase}
              onFocus={e => {
                e.target.style.borderColor = "#2DB2FF";
                e.target.style.boxShadow = "0 0 0 3px rgba(45,178,255,0.12)";
              }}
              onBlur={e => {
                e.target.style.borderColor = "#E2E8F0";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Contraseña */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#475569", letterSpacing: "0.03em" }}>
              Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
                style={{ ...inputBase, paddingRight: "42px" }}
                onFocus={e => {
                  e.target.style.borderColor = "#2DB2FF";
                  e.target.style.boxShadow = "0 0 0 3px rgba(45,178,255,0.12)";
                }}
                onBlur={e => {
                  e.target.style.borderColor = "#E2E8F0";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
                style={{
                  position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 0,
                  display: "flex", alignItems: "center",
                }}
              >
                <EyeIcon open={showPass} />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: "10px", padding: "10px 14px", fontSize: "0.8rem", color: "#BE123C", textAlign: "center" }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: "14px",
              border: "none",
              background: loading ? "#7DD3FC" : "#2DB2FF",
              color: "#fff",
              fontSize: "0.92rem",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Nunito', sans-serif",
              letterSpacing: "0.01em",
              boxShadow: loading ? "none" : "0 4px 14px rgba(45,178,255,0.35)",
              transition: "background 0.2s, box-shadow 0.2s, transform 0.15s",
              marginTop: "4px",
            }}
            onMouseEnter={e => {
              if (!loading) {
                e.currentTarget.style.background = "#0EA5E9";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 18px rgba(45,178,255,0.4)";
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = loading ? "#7DD3FC" : "#2DB2FF";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = loading ? "none" : "0 4px 14px rgba(45,178,255,0.35)";
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <svg style={{ animation: "spin 1s linear infinite" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Iniciando sesión...
              </span>
            ) : "Iniciar Sesión"}
          </button>
        </form>

        {/* Footer */}
        <p style={{ marginTop: "24px", fontSize: "0.72rem", color: "#CBD5E1" }}>
          © 2026 Shakes Snack · Todos los derechos reservados
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
