// ReportesPage.jsx — CU INC-03
// Dashboard gerencial con 3 reportes: pizzas más pedidas, ingresos por período, volumen.
// Acceso: Dueño.

import { useState } from "react";
import PizzasMasPedidas   from "./PizzasMasPedidas";
import IngresosPorPeriodo from "./IngresosPorPeriodo";
import VolumenPedidos     from "./VolumenPedidos";
import "./Reportes.css";

const TABS = [
  { id: "pizzas",    label: "🍕 Pizzas más pedidas" },
  { id: "ingresos",  label: "💰 Ingresos por período" },
  { id: "volumen",   label: "📊 Pedidos por período" }
];

const ReportesPage = () => {
  const [tabActiva, setTabActiva] = useState("pizzas");

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Reportes</h1>
      </div>

      <div className="reportes-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`reportes-tab ${tabActiva === tab.id ? "reportes-tab--active" : ""}`}
            onClick={() => setTabActiva(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabActiva === "pizzas"   && <PizzasMasPedidas   />}
      {tabActiva === "ingresos" && <IngresosPorPeriodo />}
      {tabActiva === "volumen"  && <VolumenPedidos     />}
    </div>
  );
};

export default ReportesPage;