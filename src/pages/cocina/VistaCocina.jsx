// VistaCocina.jsx — CU-07
// Vista simplificada para el cocinero. Muestra pedidos Pendientes
// y permite marcarlos como Listo con confirmación.

import { useState, useEffect } from "react";
import { getPedidos, marcarComoListo } from "../../services/pedidoService";
import Modal from "../../components/ui/Modal";
import "./Cocina.css";

const VistaCocina = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, pedidoId: null, nro: null });
  const [feedback, setFeedback] = useState("");

  const cargar = async () => {
    setLoading(true);
    const data = await getPedidos("Pendiente");
    // Ordenar por hora de registro (id más bajo = más antiguo)
    setPedidos(data.sort((a, b) => a.id - b.id));
    setLoading(false);
  };

  useEffect(() => {
    cargar();
    // Polling cada 30s para que la cocina se actualice sola
    const interval = setInterval(cargar, 30000);
    return () => clearInterval(interval);
  }, []);

  const abrirModal = (pedido) =>
    setModal({ open: true, pedidoId: pedido.id, nro: pedido.nroPedido });

  const confirmarListo = async () => {
    try {
      await marcarComoListo(modal.pedidoId);
      setFeedback(`Pedido #${modal.nro} marcado como Listo.`);
      setTimeout(() => setFeedback(""), 3000);
      setModal({ open: false, pedidoId: null, nro: null });
      cargar();
    } catch (e) {
      setFeedback(`Error: ${e.message}`);
    }
  };

  return (
    <div className="cocina-container">
      <div className="cocina-header">
        <div className="cocina-header__logo-container">
          <img 
            src="/logo-cocina.png" 
            alt="Logo Cocina" 
            className="cocina-header__logo-img" 
          />
        </div>
        
        <h1 className="cocina-title">Cocina</h1>
        <span className="cocina-subtitle">
          {loading ? "Actualizando..." : `${pedidos.length} pedido${pedidos.length !== 1 ? "s" : ""} pendiente${pedidos.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {feedback && <div className="cocina-feedback">{feedback}</div>}

      {!loading && pedidos.length === 0 && (
        <div className="cocina-empty">
          <img 
            src="/pizza-duerme.png" 
            alt="No hay pedidos" 
            className="cocina-empty__img" 
          />
          <p>No hay pedidos pendientes</p>
        </div>
      )}

      <div className="cocina-grid">
        {pedidos.map((p) => (
          <div key={p.id} className="cocina-card">
            <div className="cocina-card__header">
              <span className="cocina-card__nro">Pedido #{p.nroPedido}</span>
            </div>

            {p.cliente && (
              <p className="cocina-card__cliente">{p.cliente}</p>
            )}

            <p className="cocina-card__demora">Demora estimada: {p.demoraEstimada}</p>

            <ul className="cocina-card__lineas">
              {p.lineas.map((l, i) => (
                <li key={i} className="cocina-card__linea">
                  <span className="cocina-card__cant">{l.cantidad}x</span>
                  <span className="cocina-card__desc">
                    {l.variedad} — {l.tipo} — {l.tamanio} porciones
                  </span>
                </li>
              ))}
            </ul>

            <button
              className="btn btn--primary cocina-card__btn"
              onClick={() => abrirModal(p)}
            >
              ✓ Listo
            </button>
          </div>
        ))}
      </div>

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, pedidoId: null, nro: null })}
        onConfirm={confirmarListo}
        title="Confirmar pedido listo"
        body={`¿Confirmás que el pedido #${modal.nro} está completamente preparado y listo para entregar?`}
        confirmLabel="Sí, está listo"
      />
    </div>
  );
};

export default VistaCocina;
