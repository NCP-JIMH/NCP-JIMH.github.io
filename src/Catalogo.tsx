import { useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Variante { nombre: string; volumen: string; precio: number; activo: boolean; }

interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  estado: "Activo" | "Inactivo";
  variantes: Variante[];
  precioFinal: number;
  neto: number;
  iva: number;
  descripcion: string;
  img: string;
}

// ── Datos ────────────────────────────────────────────────────────────────────

const CATEGORIAS = ["Frappes Gourmet", "Elotes", "Tostitos con Elote", "Vasololos", "Adiciones"];

const catColors: Record<string, { bg: string; text: string }> = {
  "Frappes Gourmet":    { bg: "#fce7f3", text: "#9d174d" },
  "Elotes":             { bg: "#d1fae5", text: "#065f46" },
  "Tostitos con Elote": { bg: "#dbeafe", text: "#1e40af" },
  "Vasololos":          { bg: "#ede9fe", text: "#5b21b6" },
  "Adiciones":          { bg: "#fef3c7", text: "#92400e" },
};

const initialProductos: Producto[] = [
  { id: 1, nombre: "Chispas", categoria: "Adiciones", estado: "Activo", variantes: [{ nombre: "Porción", volumen: "-", precio: 5, activo: true }], precioFinal: 5, neto: 4.35, iva: 0.65, descripcion: "Extra de chispas de chocolate", img: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=300&h=180&fit=crop&auto=format" },
  { id: 2, nombre: "Choco-Avellana", categoria: "Frappes Gourmet", estado: "Activo", variantes: [{ nombre: "Chico", volumen: "12", precio: 35, activo: true }, { nombre: "Mediano", volumen: "16", precio: 45, activo: true }, { nombre: "Grande", volumen: "20", precio: 55, activo: true }], precioFinal: 35, neto: 30.43, iva: 4.57, descripcion: "Frappe de chocolate con avellana", img: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&h=180&fit=crop&auto=format" },
  { id: 3, nombre: "Crema Batida", categoria: "Adiciones", estado: "Activo", variantes: [{ nombre: "Porción", volumen: "-", precio: 5, activo: true }], precioFinal: 5, neto: 4.35, iva: 0.65, descripcion: "Extra de crema batida para tu bebida", img: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=180&fit=crop&auto=format" },
  { id: 4, nombre: "Elote", categoria: "Elotes", estado: "Activo", variantes: [{ nombre: "Chico", volumen: "12", precio: 25, activo: true }, { nombre: "Grande", volumen: "20", precio: 35, activo: true }], precioFinal: 25, neto: 21.74, iva: 3.26, descripcion: "Vaso con granos de elote preparados con mantequilla, mayonesa, queso y aderezos", img: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=300&h=180&fit=crop&auto=format" },
  { id: 5, nombre: "Ferrero", categoria: "Frappes Gourmet", estado: "Activo", variantes: [{ nombre: "Chico", volumen: "12", precio: 35, activo: true }, { nombre: "Mediano", volumen: "16", precio: 45, activo: true }, { nombre: "Grande", volumen: "20", precio: 55, activo: true }], precioFinal: 35, neto: 30.43, iva: 4.57, descripcion: "Frappe estilo Ferrero Rocher", img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=180&fit=crop&auto=format" },
  { id: 6, nombre: "GomitasLokas", categoria: "Vasololos", estado: "Activo", variantes: [{ nombre: "a2", volumen: "-", precio: 4, activo: true }], precioFinal: 4, neto: 3.48, iva: 0.52, descripcion: "Gomitas con chamoy y chile", img: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=300&h=180&fit=crop&auto=format" },
  { id: 7, nombre: "Mazapán", categoria: "Frappes Gourmet", estado: "Activo", variantes: [{ nombre: "Chico", volumen: "12", precio: 35, activo: true }, { nombre: "Mediano", volumen: "16", precio: 45, activo: true }, { nombre: "Grande", volumen: "20", precio: 55, activo: true }], precioFinal: 35, neto: 30.43, iva: 4.57, descripcion: "Frappe de mazapán", img: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=300&h=180&fit=crop&auto=format" },
  { id: 8, nombre: "Nieve Limón", categoria: "Vasololos", estado: "Activo", variantes: [{ nombre: "Chico", volumen: "12", precio: 30, activo: true }, { nombre: "Mediano", volumen: "16", precio: 40, activo: true }, { nombre: "Grande", volumen: "20", precio: 50, activo: true }], precioFinal: 30, neto: 26.09, iva: 3.91, descripcion: "Vaso de botana con base de nieve de limón y acompañados de chamoy, tajín o miguelito", img: "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=300&h=180&fit=crop&auto=format" },
  { id: 9, nombre: "Nieve Mango", categoria: "Vasololos", estado: "Activo", variantes: [{ nombre: "Chico", volumen: "12", precio: 30, activo: true }, { nombre: "Mediano", volumen: "16", precio: 40, activo: true }, { nombre: "Grande", volumen: "20", precio: 50, activo: true }], precioFinal: 30, neto: 26.09, iva: 3.91, descripcion: "Vaso de botana con base de nieve de mango y acompañados de chamoy, tajín o miguelito", img: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=300&h=180&fit=crop&auto=format" },
  { id: 10, nombre: "Oreo", categoria: "Frappes Gourmet", estado: "Activo", variantes: [{ nombre: "Chico", volumen: "12", precio: 35, activo: true }, { nombre: "Mediano", volumen: "16", precio: 45, activo: true }, { nombre: "Grande", volumen: "20", precio: 55, activo: true }], precioFinal: 35, neto: 30.43, iva: 4.57, descripcion: "Frappe de galletas Oreo", img: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=300&h=180&fit=crop&auto=format" },
  { id: 11, nombre: "Salsa Chamoy", categoria: "Adiciones", estado: "Activo", variantes: [{ nombre: "Porción", volumen: "-", precio: 5, activo: true }], precioFinal: 5, neto: 4.35, iva: 0.65, descripcion: "Extra de salsa chamoy", img: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=300&h=180&fit=crop&auto=format" },
  { id: 12, nombre: "Tostitos con Elote", categoria: "Tostitos con Elote", estado: "Activo", variantes: [{ nombre: "Mediano", volumen: "16", precio: 40, activo: true }, { nombre: "Grande", volumen: "20", precio: 50, activo: true }], precioFinal: 40, neto: 34.78, iva: 5.22, descripcion: "Botana preparada con totopos, elote y aderezos", img: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=180&fit=crop&auto=format" },
];

// ── Styles helpers ────────────────────────────────────────────────────────────

const inputSt: React.CSSProperties = {
  width: "100%", padding: "10px 14px", fontSize: "0.85rem",
  border: "1px solid #e5e7eb", borderRadius: "10px",
  background: "#fafafa", fontFamily: "'Inter', sans-serif",
  outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
};

function focusPink(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.target.style.borderColor = "#f06292";
}
function blurGray(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.target.style.borderColor = "#e5e7eb";
}

// ── Sub-views ─────────────────────────────────────────────────────────────────

interface FormProductoProps {
  modo: "nuevo" | "editar";
  inicial?: Producto;
  onGuardar: (p: Omit<Producto, "id" | "variantes" | "neto" | "iva"> & { precioFinal: number }) => void;
  onCancelar: () => void;
}

function FormProducto({ modo, inicial, onGuardar, onCancelar }: FormProductoProps) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [categoria, setCategoria] = useState(inicial?.categoria ?? "");
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? "");
  const [imgUrl, setImgUrl] = useState(inicial?.img ?? "");
  const [activo, setActivo] = useState(inicial?.estado !== "Inactivo");

  const valido = nombre.trim() && categoria;

  function submit() {
    if (!valido) return;
    onGuardar({
      nombre: nombre.trim(),
      categoria,
      descripcion: descripcion.trim(),
      img: imgUrl.trim() || "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&h=180&fit=crop&auto=format",
      estado: activo ? "Activo" : "Inactivo",
      precioFinal: inicial?.precioFinal ?? 0,
    });
  }

  return (
    <div style={{ padding: "28px 32px", overflowY: "auto", height: "100%" }}>
      {/* Back + title */}
      <button onClick={onCancelar} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", color: "#e91e63", fontSize: "0.85rem", fontWeight: 600, fontFamily: "'Inter', sans-serif", marginBottom: "16px", padding: 0 }}>
        ← Regresar al Catálogo
      </button>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1e1b4b", margin: "0 0 4px" }}>
        {modo === "nuevo" ? "Nuevo Producto" : "Editar Producto"}
      </h1>
      <p style={{ fontSize: "0.82rem", color: "#6b7280", margin: "0 0 28px" }}>
        {modo === "nuevo" ? "Crea un nuevo producto para el catálogo" : "Modifica la información del producto"}
      </p>

      <div style={{ maxWidth: "560px", background: "#fff", borderRadius: "16px", border: "1px solid #f3f4f6", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", padding: "28px" }}>
        {/* Nombre + Categoría */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Nombre del Producto</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Frappé de Chocolate"
              style={inputSt} onFocus={focusPink} onBlur={blurGray} />
          </div>
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Categoría</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)}
              style={{ ...inputSt, appearance: "auto" }} onFocus={focusPink} onBlur={blurGray}>
              <option value="">Selecciona una categoría</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Descripción */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Descripción</label>
          <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
            placeholder="Describe el producto, ingredientes, características..."
            rows={4}
            style={{ ...inputSt, resize: "vertical", lineHeight: 1.5 }}
            onFocus={focusPink as any} onBlur={blurGray as any} />
        </div>

        {/* URL imagen */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
            URL de Imagen <span style={{ color: "#9ca3af", fontWeight: 400 }}>(opcional)</span>
          </label>
          <input value={imgUrl} onChange={e => setImgUrl(e.target.value)} placeholder="https://ejemplo.com/imagen.jpg"
            style={inputSt} onFocus={focusPink} onBlur={blurGray} />
          <p style={{ fontSize: "0.7rem", color: "#9ca3af", margin: "5px 0 0", display: "flex", alignItems: "center", gap: "4px" }}>
            ℹ️ También puedes subir imágenes directamente desde el catálogo
          </p>
        </div>

        {/* Activo checkbox */}
        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginBottom: "24px" }}>
          <input type="checkbox" checked={activo} onChange={e => setActivo(e.target.checked)}
            style={{ width: "16px", height: "16px", accentColor: "#e91e63" }} />
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Producto activo en el catálogo</span>
        </label>

        {/* Botones */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={submit} disabled={!valido}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "11px 22px", borderRadius: "10px", border: "none",
              background: valido ? "linear-gradient(90deg, #f06292, #e91e63)" : "#e5e7eb",
              color: valido ? "#fff" : "#9ca3af",
              fontSize: "0.88rem", fontWeight: 700, cursor: valido ? "pointer" : "not-allowed",
              fontFamily: "'Inter', sans-serif",
              boxShadow: valido ? "0 4px 12px rgba(233,30,99,0.3)" : "none",
            }}>
            💾 {modo === "nuevo" ? "Crear Producto" : "Actualizar Producto"}
          </button>
          <button onClick={onCancelar}
            style={{ padding: "11px 22px", borderRadius: "10px", border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: "0.88rem", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Variantes View ────────────────────────────────────────────────────────────

interface VariantesViewProps {
  producto: Producto;
  onCambio: (variantes: Variante[]) => void;
  onVolver: () => void;
}

function VariantesView({ producto, onCambio, onVolver }: VariantesViewProps) {
  const [variantes, setVariantes] = useState<Variante[]>(producto.variantes);

  function toggleVariante(i: number) {
    const updated = variantes.map((v, idx) => idx === i ? { ...v, activo: !v.activo } : v);
    setVariantes(updated);
    onCambio(updated);
  }

  function eliminarVariante(i: number) {
    const updated = variantes.filter((_, idx) => idx !== i);
    setVariantes(updated);
    onCambio(updated);
  }

  const thSt: React.CSSProperties = { padding: "12px 20px", fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left", background: "#f9fafb", borderBottom: "1px solid #f3f4f6" };
  const tdSt: React.CSSProperties = { padding: "14px 20px", fontSize: "0.82rem", color: "#374151", borderBottom: "1px solid #f9fafb" };

  return (
    <div style={{ padding: "28px 32px", overflowY: "auto", height: "100%" }}>
      <button onClick={onVolver} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", color: "#e91e63", fontSize: "0.85rem", fontWeight: 600, fontFamily: "'Inter', sans-serif", marginBottom: "16px", padding: 0 }}>
        ← Regresar al Catálogo
      </button>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1e1b4b", margin: "0 0 4px" }}>Variantes del Producto</h1>
      <p style={{ fontSize: "0.82rem", color: "#6b7280", margin: "0 0 24px" }}>
        Administra las variantes de <strong style={{ color: "#e91e63" }}>{producto.nombre}</strong>
      </p>

      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f3f4f6", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden", maxWidth: "800px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Nombre", "Volumen (oz)", "Precio", "Estado", "Acciones"].map(h => (
                <th key={h} style={thSt}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {variantes.map((v, i) => (
              <tr key={i}>
                <td style={tdSt}>{v.nombre}</td>
                <td style={tdSt}>{v.volumen}</td>
                <td style={{ ...tdSt, fontWeight: 700 }}>${v.precio.toFixed(2)}</td>
                <td style={tdSt}>
                  <span style={{ padding: "3px 12px", borderRadius: "99px", fontSize: "0.72rem", fontWeight: 600, background: v.activo ? "#d1fae5" : "#f3e8ff", color: v.activo ? "#065f46" : "#6d28d9" }}>
                    {v.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td style={tdSt}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => toggleVariante(i)} style={{ padding: "6px 14px", borderRadius: "8px", border: "none", background: v.activo ? "#fef3c7" : "#d1fae5", color: v.activo ? "#92400e" : "#065f46", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                      {v.activo ? "⊘ Desactivar" : "✓ Activar"}
                    </button>
                    <button onClick={() => eliminarVariante(i)} style={{ padding: "6px 14px", borderRadius: "8px", border: "none", background: "#f3e8ff", color: "#6d28d9", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                      🗑 Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {variantes.length === 0 && (
              <tr><td colSpan={5} style={{ ...tdSt, textAlign: "center", color: "#9ca3af", padding: "32px" }}>Sin variantes registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Modal Imagen ──────────────────────────────────────────────────────────────

function ModalImagen({ onCerrar }: { onCerrar: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", width: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1e1b4b", display: "flex", alignItems: "center", gap: "8px" }}>
            📷 Subir Imagen de Producto
          </h2>
          <button onClick={onCerrar} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#9ca3af" }}>✕</button>
        </div>

        <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151", display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
          📁 Selecciona una imagen
        </label>
        <input type="file" accept=".jpg,.jpeg,.png,.webp"
          style={{ width: "100%", padding: "10px", fontSize: "0.82rem", border: "1px solid #e5e7eb", borderRadius: "10px", background: "#fafafa", boxSizing: "border-box", fontFamily: "'Inter', sans-serif" }} />
        <p style={{ fontSize: "0.7rem", color: "#6b7280", margin: "8px 0 4px" }}>
          <strong>Formatos permitidos:</strong> JPEG (*.jpg, *.jpeg), PNG (*.png), WEBP (*.webp)
        </p>
        <p style={{ fontSize: "0.7rem", color: "#9ca3af", margin: "0 0 20px", display: "flex", alignItems: "center", gap: "4px" }}>
          ℹ️ Formatos: JPG, PNG, WebP. Máxima: 5MB. Recomendado: 800×800px
        </p>

        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={onCerrar} style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "none", background: "#f59e0b", color: "#fff", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
            ✕ Cancelar
          </button>
          <button style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "none", background: "linear-gradient(90deg, #f06292, #e91e63)", color: "#fff", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif", boxShadow: "0 4px 10px rgba(233,30,99,0.3)" }}>
            ⬆ Subir Imagen
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Eliminar ────────────────────────────────────────────────────────────

function ModalEliminar({ nombre, onConfirmar, onCerrar }: { nombre: string; onConfirmar: () => void; onCerrar: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", width: "360px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🗑️</div>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e1b4b", margin: "0 0 8px" }}>Eliminar Producto</h2>
        <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0 0 24px" }}>
          ¿Estás seguro que deseas eliminar <strong style={{ color: "#e91e63" }}>{nombre}</strong>? Esta acción no se puede deshacer.
        </p>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={onCerrar} style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: "0.88rem", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
            Cancelar
          </button>
          <button onClick={onConfirmar} style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "none", background: "#7b1fa2", color: "#fff", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
            🗑 Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Catalogo ─────────────────────────────────────────────────────────────

type Vista = "lista" | "nuevo" | "editar" | "variantes";

interface CatalogoProps { isAdmin: boolean; }

export default function Catalogo({ isAdmin }: CatalogoProps) {
  const [productos, setProductos] = useState<Producto[]>(initialProductos);
  const [vista, setVista] = useState<Vista>("lista");
  const [seleccionado, setSeleccionado] = useState<Producto | null>(null);
  const [buscar, setBuscar] = useState("");
  const [categoria, setCategoria] = useState("Todas las categorías");
  const [estado, setEstado] = useState("Todos los estados");
  const [modalImg, setModalImg] = useState<number | null>(null);
  const [modalEliminar, setModalEliminar] = useState<Producto | null>(null);

  // ── Computed ──
  const filtrados = productos.filter(p => {
    const matchB = !buscar || p.nombre.toLowerCase().includes(buscar.toLowerCase());
    const matchC = categoria === "Todas las categorías" || p.categoria === categoria;
    const matchE = estado === "Todos los estados" || p.estado === estado;
    return matchB && matchC && matchE;
  });
  const totalVariantes = filtrados.reduce((s, p) => s + p.variantes.length, 0);
  const activos = filtrados.filter(p => p.estado === "Activo").length;

  // ── Acciones ──
  function toggleEstado(id: number) {
    setProductos(prev => prev.map(p => p.id === id ? { ...p, estado: p.estado === "Activo" ? "Inactivo" : "Activo" } : p));
  }

  function eliminarProducto(id: number) {
    setProductos(prev => prev.filter(p => p.id !== id));
    setModalEliminar(null);
  }

  function guardarNuevo(data: ReturnType<typeof Object.assign>) {
    const nuevo: Producto = {
      id: Date.now(), variantes: [], neto: +(data.precioFinal * 0.869).toFixed(2), iva: +(data.precioFinal * 0.131).toFixed(2),
      ...data,
    };
    setProductos(prev => [...prev, nuevo]);
    setVista("lista");
  }

  function guardarEdicion(data: ReturnType<typeof Object.assign>) {
    if (!seleccionado) return;
    setProductos(prev => prev.map(p => p.id === seleccionado.id ? { ...p, ...data } : p));
    setVista("lista");
    setSeleccionado(null);
  }

  function actualizarVariantes(id: number, variantes: Variante[]) {
    setProductos(prev => prev.map(p => p.id === id ? { ...p, variantes } : p));
  }

  // ── Sub-views ──
  if (vista === "nuevo")
    return <FormProducto modo="nuevo" onGuardar={guardarNuevo} onCancelar={() => setVista("lista")} />;

  if (vista === "editar" && seleccionado)
    return <FormProducto modo="editar" inicial={seleccionado} onGuardar={guardarEdicion} onCancelar={() => { setVista("lista"); setSeleccionado(null); }} />;

  if (vista === "variantes" && seleccionado)
    return <VariantesView producto={seleccionado} onCambio={v => actualizarVariantes(seleccionado.id, v)} onVolver={() => { setVista("lista"); setSeleccionado(null); }} />;

  // ── Lista ──
  const inputSt2: React.CSSProperties = { width: "100%", padding: "9px 14px", fontSize: "0.82rem", border: "1px solid #e5e7eb", borderRadius: "8px", background: "#fafafa", fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ padding: "28px 32px", overflowY: "auto", height: "100%" }}>
      {/* Modales */}
      {modalImg !== null && <ModalImagen onCerrar={() => setModalImg(null)} />}
      {modalEliminar && <ModalEliminar nombre={modalEliminar.nombre} onConfirmar={() => eliminarProducto(modalEliminar.id)} onCerrar={() => setModalEliminar(null)} />}

      <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1e1b4b", margin: "0 0 20px", display: "flex", alignItems: "center", gap: "10px" }}>
        🛍️ Catálogo de Productos
      </h1>

      {/* Filtros */}
      <div style={{ background: "#fff", borderRadius: "16px", padding: "16px 24px", marginBottom: "20px", border: "1px solid #f3f4f6", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "grid", gridTemplateColumns: `1fr 200px 200px ${isAdmin ? "auto auto" : "auto"}`, gap: "12px", alignItems: "end" }}>
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6b7280", display: "block", marginBottom: "5px" }}>🔍 Buscar</label>
            <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Nombre del producto..." style={inputSt2} />
          </div>
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6b7280", display: "block", marginBottom: "5px" }}>🏷️ Categoría</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)} style={inputSt2}>
              {["Todas las categorías", ...CATEGORIAS].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6b7280", display: "block", marginBottom: "5px" }}>🔵 Estado</label>
            <select value={estado} onChange={e => setEstado(e.target.value)} style={inputSt2}>
              {["Todos los estados", "Activo", "Inactivo"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={() => { setBuscar(""); setCategoria("Todas las categorías"); setEstado("Todos los estados"); }}
            style={{ padding: "9px 16px", borderRadius: "8px", border: "1px solid #f59e0b", background: "transparent", color: "#f59e0b", fontSize: "0.8rem", cursor: "pointer", fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap" }}>
            🧹 Limpiar
          </button>
          {isAdmin && (
            <button onClick={() => setVista("nuevo")}
              style={{ padding: "9px 18px", borderRadius: "8px", border: "none", background: "linear-gradient(90deg, #f06292, #e91e63)", color: "#fff", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap", boxShadow: "0 4px 10px rgba(233,30,99,0.25)" }}>
              + Nuevo Producto
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
        {[
          { icon: "📦", iconBg: "#dbeafe", label: "Productos Filtrados", value: filtrados.length },
          { icon: "🏷️", iconBg: "#d1fae5", label: "Variantes Totales", value: totalVariantes },
          { icon: "✅", iconBg: "#ffedd5", label: "Productos Activos", value: activos },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: "16px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", border: "1px solid #f3f4f6", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>{s.value}</div>
              <div style={{ fontSize: "0.72rem", color: "#6b7280" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid de productos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
        {filtrados.map(prod => {
          const c = catColors[prod.categoria] || { bg: "#f3f4f6", text: "#374151" };
          return (
            <div key={prod.id} style={{ background: "#fff", borderRadius: "14px", overflow: "hidden", border: "1px solid #f3f4f6", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ position: "relative" }}>
                <img src={prod.img} alt={prod.nombre} style={{ width: "100%", height: "130px", objectFit: "cover" }} />
                <span style={{ position: "absolute", top: "8px", left: "8px", padding: "3px 8px", borderRadius: "99px", fontSize: "0.65rem", fontWeight: 700, background: prod.estado === "Activo" ? "#d1fae5" : "#f3e8ff", color: prod.estado === "Activo" ? "#065f46" : "#6d28d9" }}>
                  ● {prod.estado}
                </span>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111827", marginBottom: "4px" }}>{prod.nombre}</div>
                <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "99px", fontSize: "0.62rem", fontWeight: 600, background: c.bg, color: c.text, marginBottom: "6px" }}>{prod.categoria}</span>
                <div style={{ fontSize: "0.68rem", color: "#6b7280", marginBottom: "4px", lineHeight: 1.5 }}>
                  🔢 {prod.variantes.length} variante(s) &nbsp;|&nbsp; 💰 ${prod.precioFinal}.00
                </div>
                <p style={{ fontSize: "0.68rem", color: "#9ca3af", margin: "0 0 10px", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{prod.descripcion}</p>

                {/* Botones de acción */}
                <div style={{ display: "flex", gap: "6px" }}>
                  {/* Editar — solo admin */}
                  {isAdmin && (
                    <button title="Editar" onClick={() => { setSeleccionado(prod); setVista("editar"); }}
                      style={{ flex: 1, padding: "7px", borderRadius: "8px", border: "none", background: "#dbeafe", color: "#1e40af", cursor: "pointer", fontSize: "0.9rem", transition: "opacity 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}>✏️</button>
                  )}
                  {/* Imagen — solo admin */}
                  {isAdmin && (
                    <button title="Subir imagen" onClick={() => setModalImg(prod.id)}
                      style={{ flex: 1, padding: "7px", borderRadius: "8px", border: "none", background: "#d1fae5", color: "#065f46", cursor: "pointer", fontSize: "0.9rem", transition: "opacity 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}>📷</button>
                  )}
                  {/* Variantes */}
                  <button title="Variantes" onClick={() => { setSeleccionado(prod); setVista("variantes"); }}
                    style={{ flex: 1, padding: "7px", borderRadius: "8px", border: "none", background: "#fce7f3", color: "#9d174d", cursor: "pointer", fontSize: "0.9rem", transition: "opacity 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}>⚙️</button>
                  {/* Activar/Desactivar — solo admin */}
                  {isAdmin && (
                    <button title={prod.estado === "Activo" ? "Desactivar" : "Activar"} onClick={() => toggleEstado(prod.id)}
                      style={{ flex: 1, padding: "7px", borderRadius: "8px", border: "none", background: "#fef3c7", color: "#92400e", cursor: "pointer", fontSize: "0.9rem", transition: "opacity 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}>{prod.estado === "Activo" ? "🔕" : "🔔"}</button>
                  )}
                  {/* Eliminar — solo admin */}
                  {isAdmin && (
                    <button title="Eliminar" onClick={() => setModalEliminar(prod)}
                      style={{ flex: 1, padding: "7px", borderRadius: "8px", border: "none", background: "#f3e8ff", color: "#6d28d9", cursor: "pointer", fontSize: "0.9rem", transition: "opacity 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}>🗑️</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
