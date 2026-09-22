import { useState } from "react";

const registros = [
  { id: "V20251023144108EF35", fecha: "23/10/2025", hora: "14:41", productos: "Ferrero", cantidad: 1, metodo: "Efectivo", total: 35 },
  { id: "V20251023135817364Z", fecha: "23/10/2025", hora: "13:58", productos: "Mazapán", cantidad: 1, metodo: "Efectivo", total: 45 },
  { id: "V20251023135549IED8", fecha: "23/10/2025", hora: "13:55", productos: "Oreo", cantidad: 1, metodo: "Efectivo", total: 35 },
  { id: "V202510231339490190", fecha: "23/10/2025", hora: "13:39", productos: "Nieve Limón", cantidad: 1, metodo: "Efectivo", total: 30 },
  { id: "V202510231239587B6F", fecha: "23/10/2025", hora: "12:39", productos: "Ferrero", cantidad: 1, metodo: "Efectivo", total: 35 },
  { id: "V20251021205422CBD", fecha: "22/10/2025", hora: "02:54", productos: "Ferrero", cantidad: 1, metodo: "Efectivo", total: 35 },
  { id: "V20251021211201327F", fecha: "21/10/2025", hora: "21:12", productos: "Choco-Avellana", cantidad: 1, metodo: "Efectivo", total: 35 },
  { id: "V20251021210613040G", fecha: "21/10/2025", hora: "21:06", productos: "Choco-Avellana", cantidad: 1, metodo: "Efectivo", total: 35 },
  { id: "V20251020160013865AC", fecha: "20/10/2025", hora: "16:01", productos: "Choco-Avellana", cantidad: 1, metodo: "Efectivo", total: 35 },
  { id: "V20251016103735627F", fecha: "16/10/2025", hora: "16:37", productos: "Ferrero, Choco-Avellana, Oreo, Mazapán", cantidad: 4, metodo: "Efectivo", total: 170 },
  { id: "V20251016103100EBCC", fecha: "16/10/2025", hora: "16:31", productos: "Choco-Avellana, Ferrero", cantidad: 2, metodo: "Efectivo", total: 80 },
  { id: "V20251015115602411B", fecha: "15/10/2025", hora: "17:56", productos: "Choco-Avellana", cantidad: 2, metodo: "Efectivo", total: 90 },
  { id: "V20251015006273929F", fecha: "15/10/2025", hora: "06:27", productos: "Ferrero, Choco-Avellana", cantidad: 2, metodo: "Efectivo", total: 80 },
  { id: "V20251014204848420510", fecha: "14/10/2025", hora: "20:48", productos: "Mazapán, Ferrero, Ferrero", cantidad: 4, metodo: "Tarjeta", total: 190 },
];

const metodoBadge = (m: string) => ({
  background: m === "Efectivo" ? "#d1fae5" : m === "Tarjeta" ? "#dbeafe" : "#fef3c7",
  color: m === "Efectivo" ? "#065f46" : m === "Tarjeta" ? "#1e40af" : "#92400e",
});

export default function Historial() {
  const [buscar, setBuscar] = useState("");
  const [fecha, setFecha] = useState("");
  const [categoria, setCategoria] = useState("Todas las categorías");

  const filtrados = registros.filter(r => {
    const matchBuscar = !buscar || r.id.toLowerCase().includes(buscar.toLowerCase()) || r.productos.toLowerCase().includes(buscar.toLowerCase());
    const matchFecha = !fecha || r.fecha === fecha.split("-").reverse().join("/");
    return matchBuscar && matchFecha;
  });

  const totalFiltrado = filtrados.reduce((s, r) => s + r.total, 0);
  const promedio = filtrados.length > 0 ? totalFiltrado / filtrados.length : 0;

  const thStyle: React.CSSProperties = {
    padding: "12px 16px", fontSize: "0.72rem", fontWeight: 700,
    color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em",
    textAlign: "left", background: "#f9fafb", borderBottom: "1px solid #f3f4f6",
  };

  const tdStyle: React.CSSProperties = {
    padding: "13px 16px", fontSize: "0.8rem", color: "#374151",
    borderBottom: "1px solid #f9fafb",
  };

  return (
    <div style={{ padding: "28px 32px", overflowY: "auto", height: "100%" }}>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1e1b4b", margin: "0 0 4px" }}>Historial de Ventas</h1>
      <p style={{ fontSize: "0.82rem", color: "#6b7280", margin: "0 0 20px" }}>Consulta todas tus ventas anteriores</p>

      {/* Filtros */}
      <div style={{ background: "#fff", borderRadius: "16px", padding: "20px 24px", marginBottom: "20px", border: "1px solid #f3f4f6", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "14px" }}>Filtros de Búsqueda</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 200px 240px auto", gap: "12px", alignItems: "end" }}>
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6b7280", display: "block", marginBottom: "6px" }}>🔍 Buscar</label>
            <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Código de venta o usuario..."
              style={{ width: "100%", padding: "9px 14px", fontSize: "0.82rem", border: "1px solid #e5e7eb", borderRadius: "8px", background: "#fafafa", fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6b7280", display: "block", marginBottom: "6px" }}>📅 Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
              style={{ width: "100%", padding: "9px 14px", fontSize: "0.82rem", border: "1px solid #e5e7eb", borderRadius: "8px", background: "#fafafa", fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6b7280", display: "block", marginBottom: "6px" }}>🏷️ Categoría</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)}
              style={{ width: "100%", padding: "9px 14px", fontSize: "0.82rem", border: "1px solid #e5e7eb", borderRadius: "8px", background: "#fafafa", fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box" }}>
              {["Todas las categorías", "Frappes Gourmet", "Elotes", "Vasololos", "Adiciones"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <button onClick={() => { setBuscar(""); setFecha(""); setCategoria("Todas las categorías"); }}
            style={{ padding: "9px 18px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: "0.8rem", cursor: "pointer", fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap" }}>
            🧹 Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
        {[
          { icon: "📄", iconBg: "#dbeafe", label: "Ventas Filtradas", value: filtrados.length.toString() },
          { icon: "💰", iconBg: "#d1fae5", label: "Total Filtrado", value: `$${totalFiltrado.toFixed(2)}` },
          { icon: "📊", iconBg: "#ffedd5", label: "Promedio", value: `$${promedio.toFixed(2)}` },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: "16px", padding: "18px 24px", display: "flex", alignItems: "center", gap: "14px", border: "1px solid #f3f4f6", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#111827" }}>{s.value}</div>
              <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f3f4f6", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f3f4f6" }}>
          <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#374151" }}>Historial Completo</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["ID", "Fecha", "Hora", "Productos", "Cantidad", "Método", "Total"].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((r, i) => (
                <tr key={i} style={{ transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#faf5ff")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "0.72rem", color: "#e91e63", fontWeight: 600 }}>{r.id}</td>
                  <td style={tdStyle}>{r.fecha}</td>
                  <td style={tdStyle}>{r.hora}</td>
                  <td style={{ ...tdStyle, maxWidth: "240px" }}>{r.productos}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{r.cantidad}</td>
                  <td style={tdStyle}>
                    <span style={{ padding: "3px 10px", borderRadius: "99px", fontSize: "0.7rem", fontWeight: 600, ...metodoBadge(r.metodo) }}>{r.metodo}</span>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: "#111827" }}>${r.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
