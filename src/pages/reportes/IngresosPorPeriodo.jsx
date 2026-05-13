// IngresosPorPeriodo.jsx — INC-03
// Muestra el total recaudado en un rango de fechas, calculado sobre facturas emitidas.

import { useState, useCallback } from "react";
import { getResumenPeriodoConFacturas } from "../../services/reporteService";
import { useFechas } from "./useFechas";
import "./Reportes.css";

const formatFecha = (isoString) => {
  if (!isoString) return "—";
  try {
    return new Date(isoString).toLocaleString("es-AR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return isoString; }
};

const IngresosPorPeriodo = () => {
  const { start, end, preset, setPreset, setStart, setEnd, PRESETS } = useFechas();
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const buscar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getResumenPeriodoConFacturas(start, end);
      setResumen(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  const promedio = resumen && resumen.cantidadPedidos > 0
    ? resumen.totalIngresos / resumen.cantidadPedidos
    : 0;

  return (
    <div>
      {/* Filtros */}
      <div className="reportes-filtros">
        <div className="reportes-filtros__group">
          <span className="reportes-filtros__label">Desde</span>
          <input
            type="date"
            className="reportes-filtros__input"
            value={start.toISOString().slice(0, 10)}
            onChange={(e) => { setStart(new Date(e.target.value + "T00:00:00")); setPreset(""); }}
          />
        </div>
        <div className="reportes-filtros__group">
          <span className="reportes-filtros__label">Hasta</span>
          <input
            type="date"
            className="reportes-filtros__input"
            value={end.toISOString().slice(0, 10)}
            onChange={(e) => { setEnd(new Date(e.target.value + "T23:59:59")); setPreset(""); }}
          />
        </div>
        <div className="reportes-filtros__group">
          <span className="reportes-filtros__label">Acceso rápido</span>
          <div className="reportes-filtros__preset-group">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                className={`reportes-filtros__preset ${preset === p.id ? "reportes-filtros__preset--active" : ""}`}
                onClick={() => setPreset(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn--primary" onClick={buscar} disabled={loading}>
          {loading ? "Calculando..." : "Ver reporte"}
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {resumen && !loading && (
        <>
          {/* KPIs */}
          <div className="kpi-grid">
            <div className="kpi-card kpi-card--ingresos">
              <div className="kpi-card__label">Total recaudado</div>
              <div className="kpi-card__valor kpi-card__valor--primary">
                ${resumen.totalIngresos.toLocaleString("es-AR")}
              </div>
              <div className="kpi-card__sub">en el período seleccionado</div>
            </div>
            <div className="kpi-card kpi-card--pedidos">
              <div className="kpi-card__label">Facturas emitidas</div>
              <div className="kpi-card__valor kpi-card__valor--green">
                {resumen.cantidadPedidos}
              </div>
              <div className="kpi-card__sub">pedidos facturados</div>
            </div>
            <div className="kpi-card kpi-card--promedio">
              <div className="kpi-card__label">Ticket promedio</div>
              <div className="kpi-card__valor kpi-card__valor--amber">
                ${promedio.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
              </div>
              <div className="kpi-card__sub">por pedido</div>
            </div>
          </div>

          {/* Tabla de facturas */}
          {resumen.facturas.length === 0 ? (
            <div className="reporte-empty">
              <div className="reporte-empty__icon">💰</div>
              <p>No hay facturas en el período seleccionado.</p>
            </div>
          ) : (
            <div className="ingresos-tabla-wrapper">
              <table className="ingresos-tabla">
                <thead>
                  <tr>
                    <th>Factura #</th>
                    <th>Fecha emisión</th>
                    <th>Cliente</th>
                    <th>Pedido #</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.facturas
                    .sort((a, b) => new Date(b.fechaEmision) - new Date(a.fechaEmision))
                    .map((f) => (
                      <tr key={f.id}>
                        <td style={{ fontWeight: 700 }}>#{f.nroFactura}</td>
                        <td style={{ color: "var(--color-text-secondary)" }}>{formatFecha(f.fechaEmision)}</td>
                        <td>{f.pedido.cliente || <em style={{ color: "var(--color-text-muted)" }}>Consumidor Final</em>}</td>
                        <td style={{ color: "var(--color-text-secondary)" }}>#{f.pedido.nroPedido}</td>
                        <td>${f.total.toLocaleString("es-AR")}</td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ fontWeight: 700 }}>
                      Total del período
                    </td>
                    <td>${resumen.totalIngresos.toLocaleString("es-AR")}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}

      {!resumen && !loading && (
        <div className="reporte-empty">
          <img 
            src="/calendario.png" 
            alt="Seleccioná un período y presioná 'Ver reporte' para comenzar." 
            className="reporte-empty__img" 
          />
          <p>Seleccioná un período y presioná "Ver reporte" para comenzar.</p>
        </div>
      )}
    </div>
  );
};

export default IngresosPorPeriodo;