import { useState } from "react";

interface Cajero { id: number; nombre: string; rol: "cajero" | "admin"; }

const cajeroInicial: Cajero[] = [
  { id: 1, nombre: "a", rol: "cajero" },
  { id: 2, nombre: "david", rol: "admin" },
  { id: 3, nombre: "kevin", rol: "cajero" },
];

export default function Cajeros() {
  const [cajeros, setCajeros] = useState<Cajero[]>(cajeroInicial);
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");

  function agregar() {
    if (!nombre.trim() || password.length < 6) return;
    setCajeros(prev => [...prev, { id: Date.now(), nombre: nombre.trim(), rol: "cajero" }]);
    setNombre("");
    setPassword("");
  }

  function eliminar(id: number) {
    setCajeros(prev => prev.filter(c => c.id !== id));
  }

  function guardarEdicion(id: number) {
    if (!editNombre.trim()) return;
    setCajeros(prev => prev.map(c => c.id === id ? { ...c, nombre: editNombre.trim() } : c));
    setEditandoId(null);
    setEditNombre("");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", fontSize: "0.85rem",
    border: "1px solid #e5e7eb", borderRadius: "10px",
    background: "#fafafa", fontFamily: "'Inter', sans-serif",
    outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const rolBadge = (rol: string) => ({
    padding: "4px 12px", borderRadius: "99px", fontSize: "0.72rem", fontWeight: 600,
    background: rol === "admin" ? "#fef3c7" : "#dbeafe",
    color: rol === "admin" ? "#92400e" : "#1e40af",
    display: "inline-flex", alignItems: "center", gap: "4px",
  } as React.CSSProperties);

  return (
    <div style={{ display: "flex", height: "100%", gap: 0 }}>
      {/* ── Main table ── */}
      <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1e1b4b", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "10px" }}>
          👥 Gestión de Cajeros
        </h1>
        <p style={{ fontSize: "0.82rem", color: "#6b7280", margin: "0 0 24px" }}>Administra los usuarios con rol de cajero del sistema</p>

        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f3f4f6", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#374151", display: "flex", alignItems: "center", gap: "8px" }}>
              ≡ Usuarios Registrados
            </span>
            <span style={{ padding: "4px 12px", borderRadius: "99px", fontSize: "0.72rem", fontWeight: 700, background: "#ede9fe", color: "#e91e63" }}>
              {cajeros.length} usuario(s)
            </span>
          </div>

          {/* Table */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {[
                  { icon: "👤", label: "USUARIO" },
                  { icon: "🏷️", label: "ROL" },
                  { icon: "⚙️", label: "ACCIONES" },
                ].map(h => (
                  <th key={h.label} style={{ padding: "12px 24px", fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left", borderBottom: "1px solid #f3f4f6" }}>
                    {h.icon} {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cajeros.map(cajero => (
                <tr key={cajero.id}
                  style={{ transition: "background 0.15s", borderBottom: "1px solid #f9fafb" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#faf5ff")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "14px 24px" }}>
                    {editandoId === cajero.id ? (
                      <input value={editNombre} onChange={e => setEditNombre(e.target.value)}
                        style={{ ...inputStyle, width: "180px" }}
                        onFocus={e => e.target.style.borderColor = "#f06292"}
                        onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                    ) : (
                      <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#374151" }}>{cajero.nombre}</span>
                    )}
                  </td>
                  <td style={{ padding: "14px 24px" }}>
                    <span style={rolBadge(cajero.rol)}>
                      {cajero.rol === "admin" ? "👑" : "🏪"} {cajero.rol}
                    </span>
                  </td>
                  <td style={{ padding: "14px 24px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {editandoId === cajero.id ? (
                        <>
                          <button onClick={() => guardarEdicion(cajero.id)} style={{ padding: "7px 14px", borderRadius: "8px", border: "none", background: "#d1fae5", color: "#065f46", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>✓ Guardar</button>
                          <button onClick={() => setEditandoId(null)} style={{ padding: "7px 14px", borderRadius: "8px", border: "none", background: "#f3f4f6", color: "#6b7280", fontSize: "0.78rem", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditandoId(cajero.id); setEditNombre(cajero.nombre); }}
                            title="Editar" style={{ width: "34px", height: "34px", borderRadius: "8px", border: "none", background: "#dbeafe", color: "#1e40af", cursor: "pointer", fontSize: "0.9rem" }}>✏️</button>
                          {cajero.rol !== "admin" && (
                            <button onClick={() => eliminar(cajero.id)}
                              title="Eliminar" style={{ width: "34px", height: "34px", borderRadius: "8px", border: "none", background: "#f3e8ff", color: "#6d28d9", cursor: "pointer", fontSize: "0.9rem" }}>🗑️</button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div style={{ width: "280px", minWidth: "280px", background: "#fff", borderLeft: "1px solid #f3f4f6", padding: "0" }}>
        <div style={{ background: "linear-gradient(90deg, #f06292, #e91e63)", padding: "18px 24px" }}>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
            👤 Agregar Cajero
          </h2>
        </div>
        <div style={{ padding: "24px" }}>
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
              👤 Nombre de Usuario
            </label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del cajero"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = "#f06292"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
              🔒 Contraseña
            </label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña segura"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = "#f06292"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
            <p style={{ fontSize: "0.68rem", color: "#9ca3af", margin: "6px 0 0", display: "flex", alignItems: "center", gap: "4px" }}>
              ℹ️ Mínimo 6 caracteres recomendados
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={agregar} disabled={!nombre.trim() || password.length < 6}
              style={{
                flex: 1, padding: "10px", borderRadius: "10px", border: "none",
                background: (!nombre.trim() || password.length < 6) ? "#e5e7eb" : "#10b981",
                color: (!nombre.trim() || password.length < 6) ? "#9ca3af" : "#fff",
                fontSize: "0.82rem", fontWeight: 600, cursor: (!nombre.trim() || password.length < 6) ? "not-allowed" : "pointer",
                fontFamily: "'Inter', sans-serif",
              }}>
              ✓ Agregar Cajero
            </button>
            <button onClick={() => { setNombre(""); setPassword(""); }}
              style={{ padding: "10px 14px", borderRadius: "10px", border: "none", background: "#f59e0b", color: "#fff", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
              🧹 Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
