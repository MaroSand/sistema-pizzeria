// FacturacionPage.jsx — CU-10
// Lista los pedidos en estado "Listo" disponibles para facturar.
// Acceso: Empleado de Mostrador.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPedidosListos, calcularTotal } from "../../services/facturaService";
import "./Facturacion.css";

const totalPizzas = (lineas) =>
  lineas.reduce((acc, l) => acc + (Number(l.cantidad) || 0), 0);

const FacturacionPage = () => {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await getPedidosListos();
      setPedidos(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Facturación</h1>
        <button
          className="btn btn--secondary"
          onClick={() => navigate("/facturas")}
        >
          Ver historial
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <p className="empty-message">Cargando...</p>
      ) : pedidos.length === 0 ? (
        <p className="empty-message">No hay pedidos listos para facturar.</p>
      ) : (
        <>
          <p style={{
            color:        "var(--color-text-secondary)",
            fontSize:     "var(--font-size-sm)",
            marginBottom: "var(--space-lg)",
          }}>
            {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""} listo{pedidos.length !== 1 ? "s" : ""} para facturar
          </p>

          <div className="pedidos-listos-list">
            {pedidos.map((p) => {
              const cant = totalPizzas(p.lineas);
              return (
                <div key={p.id} className="pedido-listo-card card">
                  <div className="pedido-listo-card__left">
                    <span className="pedido-nro">#{p.nroPedido}</span>
                    <div>
                      <p className="pedido-cliente">
                        {p.cliente || <em>Consumidor Final</em>}
                      </p>
                      <p className="pedido-meta">
                        {p.fecha} · Demora: {p.demoraEstimada}
                      </p>
                      <p className="pedido-meta">
                        {cant} pizza{cant !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "var(--space-md)", alignItems: "center", flexShrink: 0 }}>
                    <span className="pedido-total">
                      ${calcularTotal(p.lineas).toLocaleString("es-AR")}
                    </span>
                    <button
                      className="btn btn--primary btn--sm"
                      onClick={() => navigate(`/facturacion/${p.id}`)}
                    >
                      Facturar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default FacturacionPage;
