// VolumenPedidos.jsx — INC-03
// Análisis de tendencias: distribución por día de semana y tendencia del período.

import { useState, useCallback } from "react";
import { getResumenPeriodo } from "../../services/reporteService";
import { useFechas } from "./useFechas";
import "./Reportes.css";
import "./VolumenPedidos.css";

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DIAS_COMPLETO = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const agruparPorDiaSemana = (facturas) => {
  const mapa = Array(7).fill(0).map(() => ({ cantidad: 0, ingresos: 0 }));
  for (const f of facturas) {
    const dia = new Date(f.fechaEmision).getDay();
    mapa[dia].cantidad += 1;
    mapa[dia].ingresos += f.total;
  }
  return mapa;
};

const agruparPorDia = (facturas) => {
  const mapa = {};
  for (const f of facturas) {
    const date = new Date(f.fechaEmision);
    const key = date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
    const ts = date.getTime();
    if (!mapa[key]) mapa[key] = { cantidad: 0, ingresos: 0, ts };
    mapa[key].cantidad += 1;
    mapa[key].ingresos += f.total;
  }
  return Object.entries(mapa).sort((a, b) => a[1].ts - b[1].ts);
};

const calcularTendencia = (diasData) => {
  if (diasData.length < 2) return null;
  const mitad = Math.floor(diasData.length / 2);
  const primera = diasData.slice(0, mitad).reduce((a, [, v]) => a + v.cantidad, 0);
  const segunda = diasData.slice(mitad).reduce((a, [, v]) => a + v.cantidad, 0);
  const prom1 = primera / mitad;
  const prom2 = segunda / (diasData.length - mitad);
  const cambio = prom1 > 0 ? ((prom2 - prom1) / prom1) * 100 : 0;
  return { subiendo: cambio > 5, bajando: cambio < -5, porcentaje: Math.abs(cambio).toFixed(0) };
};

const diaMaximo = (semanaData) => {
  let max = 0, idx = 0;
  semanaData.forEach((d, i) => { if (d.cantidad > max) { max = d.cantidad; idx = i; } });
  return max > 0 ? { dia: DIAS_COMPLETO[idx], cantidad: max } : null;
};

const BarraHorizontal = ({ valor, max, color = "var(--color-primary)", label, sublabel, showValue }) => {
  const pct = max > 0 ? (valor / max) * 100 : 0;
  return (
    <div className="vp-barra-row">
      <div className="vp-barra-label">
        <span className="vp-barra-label-main">{label}</span>
        {sublabel && <span className="vp-barra-label-sub">{sublabel}</span>}
      </div>
      <div className="vp-barra-track">
        <div
          className="vp-barra-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="vp-barra-value" style={{ color }}>{showValue(valor)}</span>
    </div>
  );
};

const VolumenPedidos = () => {
  const { start, end, preset, setPreset, setStart, setEnd, PRESETS } = useFechas();
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const semanaData = resumen ? agruparPorDiaSemana(resumen.facturas) : [];
  const diasData   = resumen ? agruparPorDia(resumen.facturas) : [];
  const tendencia  = resumen ? calcularTendencia(diasData) : null;
  const diaPico    = resumen ? diaMaximo(semanaData) : null;
  const maxCantSemana = Math.max(...semanaData.map(d => d.cantidad), 1);

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
          {(diaPico || tendencia) && (
            <div className="vp-insights">
              {diaPico && (
                <div className="vp-insight-card vp-insight-card--pico">
                  <span className="vp-insight-icon">📅</span>
                  <div>
                    <div className="vp-insight-title">Día pico</div>
                    <div className="vp-insight-valor">{diaPico.dia}</div>
                    <div className="vp-insight-sub">{diaPico.cantidad} pedido{diaPico.cantidad !== 1 ? "s" : ""}</div>
                  </div>
                </div>
              )}
              {tendencia && (
                <div className={`vp-insight-card ${tendencia.subiendo ? "vp-insight-card--sube" : tendencia.bajando ? "vp-insight-card--baja" : "vp-insight-card--estable"}`}>
                  <span className="vp-insight-icon">
                    {tendencia.subiendo ? "📈" : tendencia.bajando ? "📉" : "➡️"}
                  </span>
                  <div>
                    <div className="vp-insight-title">Tendencia del período</div>
                    <div className="vp-insight-valor">
                      {tendencia.subiendo ? `+${tendencia.porcentaje}%` : tendencia.bajando ? `-${tendencia.porcentaje}%` : "Estable"}
                    </div>
                    <div className="vp-insight-sub">vs. primera mitad del período</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {resumen.facturas.length === 0 ? (
            <div className="reporte-empty">
              <div className="reporte-empty__icon">📊</div>
              <p>No hay pedidos facturados en el período seleccionado.</p>
            </div>
          ) : (
            <div className="vp-panel">
              <div className="vp-panel-header">
                <h3 className="vp-panel-title">Distribución semanal</h3>
                <p className="vp-panel-desc">¿Qué días se vende más?</p>
              </div>
              <div className="vp-barras">
                {semanaData.map((d, i) => (
                  <BarraHorizontal
                    key={i}
                    label={DIAS_SEMANA[i]}
                    sublabel={d.cantidad > 0 ? `$${d.ingresos.toLocaleString("es-AR")}` : ""}
                    valor={d.cantidad}
                    max={maxCantSemana}
                    color={d.cantidad === maxCantSemana && d.cantidad > 0 ? "var(--color-primary)" : "var(--color-green-light)"}
                    showValue={(v) => v > 0 ? `${v} ped.` : "—"}
                  />
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
            alt="Seleccioná un período"
            className="reporte-empty__img"
          />
          <p>Seleccioná un período y presioná "Ver reporte" para comenzar.</p>
        </div>
      )}
    </div>
  );
};

export default VolumenPedidos;