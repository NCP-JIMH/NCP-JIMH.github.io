import { useState } from "react";

const categorias = ["Todos", "Frappes Gourmet", "Elotes", "Tostitos con Elote", "Vasololos", "Adiciones"];

const productos = [
  { id: 1, nombre: "Choco-Avellana", categoria: "Frappes Gourmet", img: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&h=200&fit=crop&auto=format", variantes: [{ label: "Chico (12 oz)", precio: 35 }, { label: "Mediano (16 oz)", precio: 45 }, { label: "Grande (20 oz)", precio: 55 }] },
  { id: 2, nombre: "Ferrero", categoria: "Frappes Gourmet", img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=200&fit=crop&auto=format", variantes: [{ label: "Chico (12 oz)", precio: 35 }, { label: "Mediano (16 oz)", precio: 45 }, { label: "Grande (20 oz)", precio: 55 }] },
  { id: 3, nombre: "Mazapán", categoria: "Frappes Gourmet", img: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=300&h=200&fit=crop&auto=format", variantes: [{ label: "Chico (12 oz)", precio: 35 }, { label: "Mediano (16 oz)", precio: 45 }, { label: "Grande (20 oz)", precio: 55 }] },
  { id: 4, nombre: "Oreo", categoria: "Frappes Gourmet", img: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=200&fit=crop&auto=format", variantes: [{ label: "Chico (12 oz)", precio: 35 }, { label: "Mediano (16 oz)", precio: 45 }, { label: "Grande (20 oz)", precio: 55 }] },
  { id: 5, nombre: "Elote", categoria: "Elotes", img: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=300&h=200&fit=crop&auto=format", variantes: [{ label: "Chico (12 oz)", precio: 25 }, { label: "Grande (20 oz)", precio: 35 }] },
  { id: 6, nombre: "Tostitos con Elote", categoria: "Tostitos con Elote", img: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=200&fit=crop&auto=format", variantes: [{ label: "Mediano (16 oz)", precio: 40 }, { label: "Grande (20 oz)", precio: 50 }] },
  { id: 7, nombre: "GomitasLokas", categoria: "Vasololos", img: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=300&h=200&fit=crop&auto=format", variantes: [{ label: "a2", precio: 4 }] },
  { id: 8, nombre: "Nieve Limón", categoria: "Vasololos", img: "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=300&h=200&fit=crop&auto=format", variantes: [{ label: "Chico (12 oz)", precio: 30 }, { label: "Mediano (16 oz)", precio: 40 }, { label: "Grande (20 oz)", precio: 50 }] },
  { id: 9, nombre: "Nieve Mango", categoria: "Vasololos", img: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=300&h=200&fit=crop&auto=format", variantes: [{ label: "Chico (12 oz)", precio: 30 }, { label: "Mediano (16 oz)", precio: 40 }, { label: "Grande (20 oz)", precio: 50 }] },
  { id: 10, nombre: "Chispas", categoria: "Adiciones", img: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=300&h=200&fit=crop&auto=format", variantes: [{ label: "Porción", precio: 5 }] },
  { id: 11, nombre: "Crema Batida", categoria: "Adiciones", img: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=200&fit=crop&auto=format", variantes: [{ label: "Porción", precio: 5 }] },
  { id: 12, nombre: "Salsa Chamoy", categoria: "Adiciones", img: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=300&h=200&fit=crop&auto=format", variantes: [{ label: "Porción", precio: 5 }] },
];

const catColors: Record<string, { bg: string; text: string }> = {
  "Frappes Gourmet": { bg: "#fce7f3", text: "#9d174d" },
  "Elotes":          { bg: "#d1fae5", text: "#065f46" },
  "Tostitos con Elote": { bg: "#dbeafe", text: "#1e40af" },
  "Vasololos":       { bg: "#ede9fe", text: "#5b21b6" },
  "Adiciones":       { bg: "#fef3c7", text: "#92400e" },
};

interface CartItem { productoId: number; nombre: string; variante: string; precio: number; qty: number; }

export default function Ventas() {
  const [catActiva, setCatActiva] = useState("Todos");
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [metodoPago, setMetodoPago] = useState<"Efectivo" | "Tarjeta">("Efectivo");

  const filtrados = catActiva === "Todos" ? productos : productos.filter(p => p.categoria === catActiva);
  const total = carrito.reduce((s, i) => s + i.precio * i.qty, 0);

  function agregar(prod: typeof productos[0], variante: { label: string; precio: number }) {
    setCarrito(prev => {
      const key = `${prod.id}-${variante.label}`;
      const existe = prev.find(i => i.productoId === prod.id && i.variante === variante.label);
      if (existe) return prev.map(i => i.productoId === prod.id && i.variante === variante.label ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { productoId: prod.id, nombre: prod.nombre, variante: variante.label, precio: variante.precio, qty: 1 }];
    });
  }

  function quitar(productoId: number, variante: string) {
    setCarrito(prev => prev.flatMap(i => {
      if (i.productoId !== productoId || i.variante !== variante) return [i];
      return i.qty > 1 ? [{ ...i, qty: i.qty - 1 }] : [];
    }));
  }

  function cobrar() {
    if (carrito.length === 0) return;
    setCarrito([]);
    alert(`✅ Venta registrada por $${total.toFixed(2)} — ${metodoPago}`);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", fontSize: "0.85rem",
    border: "1px solid #e5e7eb", borderRadius: "10px",
    background: "#fafafa", fontFamily: "'Inter', sans-serif",
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", height: "100%", gap: 0 }}>
      {/* ── Product Area ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 28px 28px 32px" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1e1b4b", margin: "0 0 4px" }}>🛒 Punto de Venta</h1>
        <p style={{ fontSize: "0.82rem", color: "#6b7280", margin: "0 0 20px" }}>Selecciona productos para agregar al carrito</p>

        {/* Filtros */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
          <span style={{ fontSize: "0.78rem", color: "#6b7280", display: "flex", alignItems: "center", gap: "4px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Filtrar por Categoría
          </span>
          {categorias.map(cat => (
            <button key={cat} onClick={() => setCatActiva(cat)} style={{
              padding: "6px 14px", borderRadius: "20px", border: "none", cursor: "pointer",
              fontSize: "0.78rem", fontWeight: 500, fontFamily: "'Inter', sans-serif",
              background: catActiva === cat ? "#e91e63" : "#f3f4f6",
              color: catActiva === cat ? "#fff" : "#374151",
              transition: "all 0.2s",
            }}>{cat}</button>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
          {filtrados.map(prod => {
            const c = catColors[prod.categoria] || { bg: "#f3f4f6", text: "#374151" };
            return (
              <div key={prod.id} style={{ background: "#fff", borderRadius: "14px", overflow: "hidden", border: "1px solid #f3f4f6", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <img src={prod.img} alt={prod.nombre} style={{ width: "100%", height: "130px", objectFit: "cover" }} />
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#111827", marginBottom: "4px" }}>{prod.nombre}</div>
                  <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "99px", fontSize: "0.65rem", fontWeight: 600, background: c.bg, color: c.text, marginBottom: "10px" }}>{prod.categoria}</span>
                  {prod.variantes.map(v => (
                    <div key={v.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{v.label} <strong style={{ color: "#111827" }}>${v.precio}.00</strong></span>
                      <button onClick={() => agregar(prod, v)} style={{
                        width: "24px", height: "24px", borderRadius: "50%", border: "none",
                        background: "#e91e63", color: "#fff", cursor: "pointer", fontSize: "1rem",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>+</button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Cart Panel ── */}
      <div style={{ width: "280px", minWidth: "280px", background: "#fff", borderLeft: "1px solid #f3f4f6", display: "flex", flexDirection: "column", padding: "24px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e1b4b" }}>🛒 Carrito</span>
          <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Items: {carrito.reduce((s, i) => s + i.qty, 0)}</span>
        </div>

        {carrito.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af" }}>
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🛒</div>
            <p style={{ fontSize: "0.8rem", margin: 0 }}>Carrito vacío</p>
            <p style={{ fontSize: "0.72rem", margin: "4px 0 0", color: "#c4b5fd" }}>Agrega productos para empezar</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", marginBottom: "12px" }}>
            {carrito.map(item => (
              <div key={`${item.productoId}-${item.variante}`} style={{ padding: "10px 0", borderBottom: "1px solid #f9fafb" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "2px" }}>{item.nombre}</div>
                <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginBottom: "6px" }}>{item.variante}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button onClick={() => quitar(item.productoId, item.variante)} style={{ width: "22px", height: "22px", borderRadius: "50%", border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: "0.9rem", color: "#6b7280" }}>−</button>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#111827" }}>{item.qty}</span>
                    <button onClick={() => agregar(productos.find(p => p.id === item.productoId)!, { label: item.variante, precio: item.precio })} style={{ width: "22px", height: "22px", borderRadius: "50%", border: "none", background: "#e91e63", color: "#fff", cursor: "pointer", fontSize: "0.9rem" }}>+</button>
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#e91e63" }}>${(item.precio * item.qty).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "14px" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151", marginBottom: "10px" }}>Método de Pago</div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
            {(["Efectivo", "Tarjeta"] as const).map(m => (
              <button key={m} onClick={() => setMetodoPago(m)} style={{
                flex: 1, padding: "8px", borderRadius: "8px", border: "none", cursor: "pointer",
                fontSize: "0.75rem", fontWeight: 600, fontFamily: "'Inter', sans-serif",
                background: metodoPago === m ? "#10b981" : "#f3f4f6",
                color: metodoPago === m ? "#fff" : "#6b7280",
                transition: "all 0.2s",
              }}>
                {m === "Efectivo" ? "💵" : "💳"} {m}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
            <span style={{ fontSize: "0.85rem", color: "#6b7280", fontWeight: 600 }}>Total:</span>
            <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#e91e63" }}>${total.toFixed(2)}</span>
          </div>
          <button onClick={cobrar} disabled={carrito.length === 0} style={{
            width: "100%", padding: "12px", borderRadius: "10px", border: "none",
            background: carrito.length === 0 ? "#e5e7eb" : "linear-gradient(90deg, #f06292, #e91e63)",
            color: carrito.length === 0 ? "#9ca3af" : "#fff",
            fontSize: "0.88rem", fontWeight: 700, cursor: carrito.length === 0 ? "not-allowed" : "pointer",
            fontFamily: "'Inter', sans-serif", transition: "all 0.2s",
            boxShadow: carrito.length > 0 ? "0 4px 12px rgba(123,31,162,0.3)" : "none",
          }}>
            ✅ Registrar Venta
          </button>
        </div>
      </div>
    </div>
  );
}
