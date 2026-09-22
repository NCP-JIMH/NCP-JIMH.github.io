import { useState } from "react";
import Ventas from "@/Ventas";
import Historial from "@/Historial";
import Catalogo from "@/Catalogo";
import Cajeros from "@/Cajeros";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import logoImg from "@/imports/image-1.png";

const ventasData = [
  { dia: "Jue 27", ventas: 120 },
  { dia: "Vie 28", ventas: 280 },
  { dia: "Sáb 29", ventas: 450 },
  { dia: "Dom 30", ventas: 390 },
  { dia: "Lun 31", ventas: 210 },
  { dia: "Mar 1", ventas: 340 },
  { dia: "Mié 2", ventas: 175 },
];

const metodosData = [
  { name: "Efectivo", value: 68, color: "#10b981" },
  { name: "Tarjeta", value: 22, color: "#6366f1" },
  { name: "Transferencia", value: 10, color: "#f59e0b" },
];

const ultimasVentas = [
  { id: "#V20251023144108EF35", cajero: "david", hora: "14:41", metodo: "Efectivo", total: 35.0 },
  { id: "#V20251023135817364Z", cajero: "david", hora: "13:58", metodo: "Efectivo", total: 45.0 },
  { id: "#V20251023135549IED8", cajero: "david", hora: "13:55", metodo: "Tarjeta", total: 35.0 },
  { id: "#V20251023133394901Q0", cajero: "david", hora: "13:39", metodo: "Efectivo", total: 30.0 },
  { id: "#V20251023123958766F", cajero: "david", hora: "12:39", metodo: "Efectivo", total: 35.0 },
];

const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: "ventas",
    label: "Ventas",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  },
  {
    id: "historial",
    label: "Historial",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: "catalogo",
    label: "Catálogo",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    id: "cajeros",
    label: "Cajeros",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

interface DashboardProps {
  onLogout: () => void;
  role: "admin" | "cajero";
  username: string;
}

const cajeroOnlyIds = ["ventas"];

export default function Dashboard({ onLogout, role, username }: DashboardProps) {
  const visibleNav = role === "admin" ? navItems : navItems.filter(n => cajeroOnlyIds.includes(n.id));
  const [activeNav, setActiveNav] = useState(role === "admin" ? "dashboard" : "ventas");
  const metaSemanal = 2000;
  const ventasSemana = ventasData.reduce((s, d) => s + d.ventas, 0);
  const progreso = Math.min((ventasSemana / metaSemanal) * 100, 100);

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif", background: "#f8f9fe" }}>
      {/* ── Sidebar ── */}
      <aside
        style={{
          width: "130px",
          minWidth: "130px",
          background: "#fff",
          borderRight: "1px solid #fce7f3",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "20px 10px",
          boxShadow: "2px 0 12px rgba(124,58,237,0.06)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "16px",
            overflow: "hidden",
            border: "2px solid #fce7f3",
            marginBottom: "24px",
            boxShadow: "0 4px 12px rgba(124,58,237,0.15)",
          }}
        >
          <img src={logoImg} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
          {visibleNav.map((item) => {
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  padding: "10px 6px",
                  borderRadius: "12px",
                  border: "none",
                  cursor: "pointer",
                  background: active ? "linear-gradient(135deg, #f06292, #e91e63)" : "transparent",
                  color: active ? "#fff" : "#6b7280",
                  fontSize: "0.7rem",
                  fontWeight: active ? 600 : 400,
                  transition: "all 0.2s",
                  width: "100%",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        {/* User */}
        <div
          style={{
            width: "100%",
            padding: "10px 8px",
            borderRadius: "12px",
            background: "#fff0f6",
            border: "1px solid #fce7f3",
            marginBottom: "10px",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "2px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#3b0764" }}>{username}</span>
          </div>
          <span style={{ fontSize: "0.65rem", color: "#9ca3af" }}>{role === "admin" ? "Admin" : "Cajero"} · En línea</span>
        </div>

        <button
          onClick={onLogout}
          style={{
            width: "100%",
            padding: "10px 8px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(90deg, #9575cd, #7b1fa2)",
            color: "#fff",
            fontSize: "0.72rem",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
            boxShadow: "0 3px 8px rgba(244,63,94,0.3)",
          }}
        >
          ⏻ Cerrar Sesión
        </button>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, overflowY: activeNav === "dashboard" ? "auto" : "hidden", display: "flex", flexDirection: "column" }}>
        {activeNav === "ventas" && <Ventas />}
        {activeNav === "historial" && <Historial />}
        {activeNav === "catalogo" && <Catalogo isAdmin={role === "admin"} />}
        {activeNav === "cajeros" && <Cajeros />}
        {activeNav === "dashboard" && <div style={{ padding: "28px 32px", overflowY: "auto", flex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <span style={{ fontSize: "1.4rem" }}>📊</span>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1e1b4b", margin: 0 }}>
              Dashboard de Ventas
            </h1>
          </div>
          <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0 0 16px" }}>
            Centro de control del negocio
          </p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {[
              { label: "+ Agregar Cajero", color: "#e91e63", nav: "cajeros" },
              { label: "+ Nueva Venta", color: "#f06292", nav: "ventas" },
              { label: "📋 Ver Historial", color: "#ec4899", nav: "historial" },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={() => setActiveNav(btn.nav)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: `1px solid ${btn.color}`,
                  background: "transparent",
                  color: btn.color,
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = btn.color;
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = btn.color;
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
          {[
            { icon: "💰", iconBg: "#d1fae5", iconColor: "#065f46", label: "Ventas del Día", value: "$1,975.00" },
            { icon: "🛒", iconBg: "#dbeafe", iconColor: "#1e40af", label: "Transacciones Hoy", value: "47" },
            { icon: "📈", iconBg: "#ffedd5", iconColor: "#92400e", label: "Promedio por Venta", value: "$42.02" },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                border: "1px solid #f3f4f6",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: card.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.4rem",
                  flexShrink: 0,
                }}
              >
                {card.icon}
              </div>
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>{card.value}</div>
                <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>{card.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Progreso Semanal */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "20px 24px",
            marginBottom: "20px",
            border: "1px solid #f3f4f6",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div>
              <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#374151" }}>📅 Progreso Semanal</span>
              <span style={{ fontSize: "0.78rem", color: "#9ca3af", marginLeft: "10px" }}>
                Meta de la semana: <strong style={{ color: "#7b1fa2" }}>${metaSemanal.toLocaleString()}.00</strong>
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#e91e63" }}>${ventasSemana.toLocaleString()}.00</div>
              <div style={{ fontSize: "0.75rem", color: "#10b981" }}>{progreso.toFixed(0)}%</div>
            </div>
          </div>
          <div style={{ height: "10px", background: "#f3f4f6", borderRadius: "99px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${progreso}%`,
                background: "linear-gradient(90deg, #f06292, #e91e63)",
                borderRadius: "99px",
                transition: "width 0.6s ease",
              }}
            />
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", marginBottom: "20px" }}>
          {/* Line Chart */}
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "20px 24px",
              border: "1px solid #f3f4f6",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#374151", marginBottom: "16px" }}>
              📈 Ventas Últimos 7 Días
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ventasData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(v: number) => [`$${v}`, "Ventas"]}
                  contentStyle={{ borderRadius: "10px", border: "1px solid #ede9fe", fontSize: "0.8rem" }}
                />
                <Line
                  type="monotone"
                  dataKey="ventas"
                  stroke="#f06292"
                  strokeWidth={2.5}
                  dot={{ fill: "#e91e63", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "20px 24px",
              border: "1px solid #f3f4f6",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
              💳 Métodos de Pago
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={metodosData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {metodosData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v}%`, "Porcentaje"]} contentStyle={{ borderRadius: "10px", fontSize: "0.8rem" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "0.75rem" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Últimas Ventas */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "20px 24px",
            border: "1px solid #f3f4f6",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#374151" }}>🟠 Últimas Ventas</span>
            <button
              style={{
                background: "none",
                border: "none",
                color: "#e91e63",
                fontSize: "0.8rem",
                cursor: "pointer",
                fontWeight: 500,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Ver todas →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {/* Table Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto auto",
                gap: "16px",
                padding: "8px 12px",
                background: "#fff0f6",
                borderRadius: "8px",
                marginBottom: "4px",
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "#e91e63",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              <span>ID / Cajero</span>
              <span>Hora</span>
              <span>Método</span>
              <span style={{ textAlign: "right" }}>Total</span>
            </div>

            {ultimasVentas.map((venta, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto auto",
                  gap: "16px",
                  alignItems: "center",
                  padding: "12px",
                  borderBottom: i < ultimasVentas.length - 1 ? "1px solid #f9fafb" : "none",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151", fontFamily: "monospace" }}>
                    {venta.id}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#9ca3af", marginLeft: "8px" }}>
                    {venta.cajero}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "#6b7280" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {venta.hora}
                </div>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: "99px",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    background: venta.metodo === "Efectivo" ? "#d1fae5" : venta.metodo === "Tarjeta" ? "#dbeafe" : "#fef3c7",
                    color: venta.metodo === "Efectivo" ? "#065f46" : venta.metodo === "Tarjeta" ? "#1e40af" : "#92400e",
                  }}
                >
                  {venta.metodo}
                </span>
                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#111827", textAlign: "right" }}>
                  ${venta.total.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
        </div>}
      </main>
    </div>
  );
}
