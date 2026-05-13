// reporteService.js — INC-03

import { getFacturas } from "./facturaService";

// Convierte un Date a formato LocalDateTime que Spring acepta: "2026-05-13T00:00:00"
const toLocalDateTime = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
};

const buildParams = (start, end) =>
  new URLSearchParams({ start: toLocalDateTime(start), end: toLocalDateTime(end) });

// ── Pizzas más pedidas ──────────────────────────────────────────────────────
// GET /reportes/pizzas-mas-pedidas?start=&end=
// Backend devuelve: [ [nombre, tipoCoccion, tamanio, cantidad], ... ]
export const getPizzasMasPedidas = async (start, end) => {
  const res = await fetch(`/reportes/pizzas-mas-pedidas?${buildParams(start, end)}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Error al obtener reporte (${res.status})`);
  const data = await res.json();
  return data.map((row) => ({
    nombre:      row[0],
    tipoCoccion: row[1],
    tamanio:     row[2],
    total:       Number(row[3]),
  }));
};

// ── Ingresos por período ────────────────────────────────────────────────────
// Usa GET /factura/traer y filtra en cliente para tener el detalle de facturas.
// Necesario para la tabla de facturas en IngresosPorPeriodo.
export const getResumenPeriodoConFacturas = async (start, end) => {
  const todasLasFacturas = await getFacturas();

  const filtradas = todasLasFacturas.filter((f) => {
    if (!f.fechaEmision) return false;
    const fecha = new Date(f.fechaEmision);
    return fecha >= start && fecha <= end;
  });

  const totalIngresos = filtradas.reduce((acc, f) => acc + f.total, 0);

  return {
    totalIngresos,
    cantidadPedidos: filtradas.length,
    facturas: filtradas,
  };
};

// ── Volumen de pedidos por período ──────────────────────────────────────────
// GET /reportes/ingresos?start=&end=        → IncomeReportDto  { totalRecaudado, cantidadFacturas }
// GET /reportes/pedidos-por-periodo?start=&end= → OrdersReportDto { cantidadPedidos, montoTotal }
// Usado por VolumenPedidos (KPIs + gráficos por día desde /factura/traer).
export const getResumenPeriodo = async (start, end) => {
  const params = buildParams(start, end);

  const [incomeRes, ordersRes, todasLasFacturas] = await Promise.all([
    fetch(`/reportes/ingresos?${params}`, { credentials: "include" }),
    fetch(`/reportes/pedidos-por-periodo?${params}`, { credentials: "include" }),
    getFacturas(),
  ]);

  if (!incomeRes.ok) throw new Error(`Error al obtener ingresos (${incomeRes.status})`);
  if (!ordersRes.ok) throw new Error(`Error al obtener pedidos (${ordersRes.status})`);

  const income = await incomeRes.json();
  // income: { desde, hasta, totalRecaudado, cantidadFacturas }

  // Filtramos las facturas del período para los gráficos por día
  const facturasFiltradas = todasLasFacturas.filter((f) => {
    if (!f.fechaEmision) return false;
    const fecha = new Date(f.fechaEmision);
    return fecha >= start && fecha <= end;
  });

  return {
  totalIngresos:   Number(income.totalRecaudado ?? 0),
  cantidadPedidos: Number(income.cantidadFacturas ?? 0),
  facturas:        facturasFiltradas,
};
};
