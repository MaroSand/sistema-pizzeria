// VolumenPedidos.jsx — INC-03
// Cantidad total de pedidos y monto total en el período.
// Incluye gráfico de barras CSS con ingresos por día.

import { useState, useCallback } from "react";
import { getResumenPeriodo } from "../../services/reporteService";
import { useFechas } from "./useFechas";
import "./Reportes.css";

// Agrupa las facturas por día (formato dd/mm)
const agruparPorDia = (facturas) => {
  const mapa = {};
  for (const f of facturas) {
    const dia = new Date(f.fechaEmision).toLocaleDateString("es-AR", {
      day: "2-digit", month: "2-digit",
    });
    if (!mapa[dia]) mapa[dia] = { ingresos: 0, cantidad: 0 };
    mapa[dia].ingresos  += f.total;
    mapa[dia].cantidad  += 1;
  }
  // Ordenar por fecha
  return Object.entries(mapa)
    .sort((a, b) => {
      const [dA, mA] = a[0].split("/").map(Number);
      const [dB, mB] = b[0].split("/").map(Number);
      return mA !== mB ? mA - mB : dA - dB;
    });
};

const VolumenPedidos = () => {
  const { start, end, preset, setPreset, setStart, setEnd, PRESETS } = useFechas();
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const buscar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getResumenPeriodo(start, end);
      setResumen(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  const diasData = resumen ? agruparPorDia(resumen.facturas) : [];
  const maxIngresos = diasData.length > 0 ? Math.max(...diasData.map(([, v]) => v.ingresos)) : 1;
  const maxCantidad = diasData.length > 0 ? Math.max(...diasData.map(([, v]) => v.cantidad)) : 1;

  const promedio = resumen && resumen.cantidadPedidos > 0
  ? (resumen.totalIngresos ?? 0) / resumen.cantidadPedidos
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
            <div className="kpi-card kpi-card--pedidos">
              <div className="kpi-card__label">Total de pedidos</div>
              <div className="kpi-card__valor kpi-card__valor--green">
                {resumen.cantidadPedidos ?? 0}
              </div>
              <div className="kpi-card__sub">pedidos facturados</div>
            </div>
            <div className="kpi-card kpi-card--ingresos">
              <div className="kpi-card__label">Monto total</div>
              <div className="kpi-card__valor kpi-card__valor--primary">
                ${(resumen.totalIngresos ?? 0).toLocaleString("es-AR")}
              </div>
              <div className="kpi-card__sub">recaudado en el período</div>
            </div>
            <div className="kpi-card kpi-card--promedio">
              <div className="kpi-card__label">Ticket promedio</div>
              <div className="kpi-card__valor kpi-card__valor--amber">
                ${promedio.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
              </div>
              <div className="kpi-card__sub">por pedido</div>
            </div>
          </div>

          {resumen.facturas.length === 0 ? (
            <div className="reporte-empty">
              <div className="reporte-empty__icon">📊</div>
              <p>No hay pedidos facturados en el período seleccionado.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "var(--space-lg)", gridTemplateColumns: "1fr 1fr" }}>
              {/* Gráfico ingresos por día */}
              <div className="barchart">
                <div className="barchart__title">Ingresos por día</div>
                {diasData.map(([dia, val]) => (
                  <div key={dia} className="barchart__row">
                    <span className="barchart__label">{dia}</span>
                    <div className="barchart__track">
                      <div
                        className="barchart__fill"
                        style={{ width: `${(val.ingresos / maxIngresos) * 100}%` }}
                      />
                    </div>
                    <span className="barchart__value">
                      ${val.ingresos.toLocaleString("es-AR")}
                    </span>
                  </div>
                ))}
              </div>

              {/* Gráfico pedidos por día */}
              <div className="barchart">
                <div className="barchart__title">Pedidos por día</div>
                {diasData.map(([dia, val]) => (
                  <div key={dia} className="barchart__row">
                    <span className="barchart__label">{dia}</span>
                    <div className="barchart__track">
                      <div
                        className="barchart__fill"
                        style={{
                          width: `${(val.cantidad / maxCantidad) * 100}%`,
                          background: "linear-gradient(90deg, var(--color-green-dark), var(--color-green-light))",
                        }}
                      />
                    </div>
                    <span className="barchart__value" style={{ color: "var(--color-green-light)" }}>
                      {val.cantidad} ped.
                    </span>
                  </div>
                ))}
              </div>
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

export default VolumenPedidos;