// PizzasMasPedidas.jsx — INC-03
// Tabla con las variedades y tipos de pizza más pedidas en un rango de fechas.
// Filtro adicional por tipo de cocción.
// Consume GET /reportes/pizzas-mas-pedidas?start=&end=

import { useState, useCallback } from "react";
import { getPizzasMasPedidas } from "../../services/reporteService";
import { useFechas } from "./useFechas";
import "./Reportes.css";

const TIPOS = ["Todos", "PIEDRA", "PARRILLA", "MOLDE"];
const TIPO_LABEL = { PIEDRA: "A la piedra", PARRILLA: "A la parrilla", MOLDE: "De molde" };
const TAM_LABEL  = { SMALL: "8 porc.", MEDIUM: "10 porc.", LARGE: "12 porc." };

const rankClass = (i) => {
  if (i === 0) return "rank-badge--1";
  if (i === 1) return "rank-badge--2";
  if (i === 2) return "rank-badge--3";
  return "rank-badge--n";
};

const PizzasMasPedidas = () => {
  const { start, end, preset, setPreset, setStart, setEnd, PRESETS } = useFechas();
  const [tipoFiltro, setTipoFiltro] = useState("Todos");
  const [datos,    setDatos]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [buscado,  setBuscado]  = useState(false);

  const buscar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const resultado = await getPizzasMasPedidas(start, end);
      setDatos(resultado);
      setBuscado(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  const datosFiltrados = tipoFiltro === "Todos"
    ? datos
    : datos.filter((d) => d.tipoCoccion === tipoFiltro);

  return (
    <div>
      {/* Filtros de fecha */}
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
          {loading ? "Buscando..." : "Ver reporte"}
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {buscado && !loading && (
        <>
          {/* Filtro por tipo de cocción */}
          <div className="tipo-filter">
            {TIPOS.map((t) => (
              <button
                key={t}
                className={`tipo-filter__btn ${tipoFiltro === t ? "tipo-filter__btn--active" : ""}`}
                onClick={() => setTipoFiltro(t)}
              >
                {t === "Todos" ? "Todos los tipos" : TIPO_LABEL[t] ?? t}
              </button>
            ))}
          </div>

          {datosFiltrados.length === 0 ? (
            <div className="reporte-empty">
              <div className="reporte-empty__icon">🍕</div>
              <p>No hay pedidos en el período seleccionado.</p>
            </div>
          ) : (
            <div className="reporte-tabla-wrapper">
              <table className="reporte-tabla">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Variedad</th>
                    <th>Tipo de cocción</th>
                    <th>Tamaño</th>
                    <th>Unidades pedidas</th>
                  </tr>
                </thead>
                <tbody>
                  {datosFiltrados.map((row, i) => (
                    <tr key={i}>
                      <td>
                        <span className={`rank-badge ${rankClass(i)}`}>{i + 1}</span>
                      </td>
                      <td>
                        <div className="rank-nombre">{row.nombre}</div>
                      </td>
                      <td>
                        <div className="rank-tipo">{TIPO_LABEL[row.tipoCoccion] ?? row.tipoCoccion}</div>
                      </td>
                      <td style={{ color: "var(--color-text-secondary)" }}>
                        {TAM_LABEL[row.tamanio] ?? row.tamanio}
                      </td>
                      <td>{row.total.toLocaleString("es-AR")} uds.</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!buscado && !loading && (
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

export default PizzasMasPedidas;