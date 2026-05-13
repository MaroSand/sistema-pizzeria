// PedidosPage.jsx — CU-08
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getPedidos, calcularTotal } from "../../services/pedidoService";
import Badge from "../../components/ui/Badge";
import "./Pedidos.css";

const ESTADOS = ["Todos", "Pendiente", "Listo", "Facturado"];
const ORDEN_ESTADO = { Pendiente: 0, Listo: 1, Facturado: 2 };

const ordenarPedidos = (pedidos) =>
  [...pedidos].sort((a, b) => {
    const grupoA = ORDEN_ESTADO[a.estado] ?? 99;
    const grupoB = ORDEN_ESTADO[b.estado] ?? 99;
    if (grupoA !== grupoB) return grupoA - grupoB;
    if (a.estado === "Facturado") return b.id - a.id;
    return a.id - b.id;
  });

const totalPizzas = (lineas) =>
  lineas.reduce((acc, l) => acc + (Number(l.cantidad) || 0), 0);

const PedidosPage = () => {
  const [todosLosPedidos, setTodosLosPedidos] = useState([]);
  const [filtro,          setFiltro]          = useState("Todos");
  const [loading,         setLoading]         = useState(true);
  const [feedback,        setFeedback]        = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.mensaje) {
      setFeedback(location.state.mensaje);
      const t = setTimeout(() => setFeedback(""), 3500);
      window.history.replaceState({}, "");
      return () => clearTimeout(t);
    }
  }, [location.state]);

  const cargar = useCallback(async () => {
    try {
      const data = await getPedidos();
      setTodosLosPedidos(ordenarPedidos(data));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    cargar();
    const interval = setInterval(cargar, 30000);
    return () => clearInterval(interval);
  }, [cargar]);

  const contadores = todosLosPedidos.reduce((acc, p) => {
    acc[p.estado] = (acc[p.estado] ?? 0) + 1;
    return acc;
  }, {});

  const pedidosFiltrados =
    filtro === "Todos"
      ? todosLosPedidos
      : todosLosPedidos.filter((p) => p.estado === filtro);

  const itemsConSeparadores = [];
  let lastEstado = null;
  for (const p of pedidosFiltrados) {
    if (filtro === "Todos" && p.estado !== lastEstado) {
      itemsConSeparadores.push({ type: "separador", estado: p.estado, key: `sep-${p.estado}` });
      lastEstado = p.estado;
    }
    itemsConSeparadores.push({ type: "pedido", data: p, key: p.id });
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Pedidos</h1>
        <button className="btn btn--primary" onClick={() => navigate("/pedidos/nuevo")}>
          + Nuevo pedido
        </button>
      </div>

      {feedback && (
        <div
          className="alert-error"
          style={{ background: "#eafaf1", borderColor: "#82e0aa", color: "#1e8449", marginBottom: "var(--space-md)" }}
        >
          {feedback}
        </div>
      )}

      <div className="filtros-bar">
        {ESTADOS.map((e) => {
          const count = e === "Todos" ? todosLosPedidos.length : (contadores[e] ?? 0);
          return (
            <button
              key={e}
              className={`filtro-btn ${filtro === e ? "filtro-btn--active" : ""}`}
              onClick={() => setFiltro(e)}
            >
              {e}
              <span className={`filtro-btn__count ${filtro === e ? "filtro-btn__count--active" : ""}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="empty-message">Cargando...</p>
      ) : pedidosFiltrados.length === 0 ? (
        <p className="empty-message">No se encontraron pedidos para los filtros aplicados.</p>
      ) : (
        <div className="pedidos-list">
          {itemsConSeparadores.map((item) =>
            item.type === "separador" ? (
              <div key={item.key} className="estado-separador">
                <span className="estado-separador__label">{item.estado}</span>
                <span className="estado-separador__count">{contadores[item.estado] ?? 0}</span>
              </div>
            ) : (
              (() => {
                const cant = totalPizzas(item.data.lineas);
                return (
                  <div
                    key={item.key}
                    className="pedido-row card"
                    onClick={() => navigate(`/pedidos/${item.data.id}`)}
                  >
                    <div className="pedido-row__left">
                      <span className="pedido-nro">#{item.data.nroPedido}</span>
                      <div>
                        <p className="pedido-cliente">
                          {item.data.cliente || <em>Consumidor Final</em>}
                        </p>
                        <p className="pedido-meta">
                          {item.data.fecha} · Demora: {item.data.demoraEstimada}
                        </p>
                        <p className="pedido-meta">
                          {cant} pizza{cant !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="pedido-row__right">
                      <Badge text={item.data.estado} color={item.data.estado.toLowerCase()} />
                      <span className="pedido-total">
                        ${calcularTotal(item.data.lineas).toLocaleString("es-AR")}
                      </span>
                      {item.data.estado === "Pendiente" ? (
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/pedidos/editar/${item.data.id}`);
                          }}
                        >
                          Editar
                        </button>
                      ) : (
                        <div className="pedido-row__spacer" />
                      )}
                    </div>
                  </div>
                );
              })()
            )
          )}
        </div>
      )}
    </div>
  );
};

export default PedidosPage;
