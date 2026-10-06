import { useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router";
import { api } from "./api";
import Comissoes from "./pages/Comissoes";
import Estoque from "./pages/Estoque";
import Juros from "./pages/Juros";

const exercicios = [
  { rota: "/comissoes", numero: "01", titulo: "Comissões", resumo: "Vendas por vendedor" },
  { rota: "/estoque", numero: "02", titulo: "Estoque", resumo: "Entradas e saídas" },
  { rota: "/juros", numero: "03", titulo: "Juros", resumo: "Atraso de pagamento" },
];

type StatusApi = "verificando" | "online" | "offline";

function useStatusApi() {
  const [status, setStatus] = useState<StatusApi>("verificando");

  useEffect(() => {
    const verificar = () =>
      api
        .saude()
        .then(() => setStatus("online"))
        .catch(() => setStatus("offline"));

    verificar();
    const intervalo = setInterval(verificar, 30_000);
    return () => clearInterval(intervalo);
  }, []);

  return status;
}

export default function App() {
  const statusApi = useStatusApi();

  return (
    <div className="layout">
      <aside className="lateral">
        <div className="marca">
          <span className="marca__titulo">Desafio Dev</span>
          <span className="marca__autor">Leonardo Ferreira</span>
        </div>

        <nav className="menu" aria-label="Exercícios">
          {exercicios.map((ex) => (
            <NavLink key={ex.rota} to={ex.rota} className="menu__item" viewTransition>
              <span className="menu__numero">{ex.numero}</span>
              <span>
                <span className="menu__titulo">{ex.titulo}</span>
                <span className="menu__resumo">{ex.resumo}</span>
              </span>
            </NavLink>
          ))}
        </nav>

        <p className={`status-api status-api--${statusApi}`} role="status">
          {statusApi === "verificando" && "Conectando à API…"}
          {statusApi === "online" && "API online"}
          {statusApi === "offline" && "API offline"}
        </p>
      </aside>

      <main className="conteudo">
        <Routes>
          <Route path="/" element={<Navigate to="/comissoes" replace />} />
          <Route path="/comissoes" element={<Comissoes />} />
          <Route path="/estoque" element={<Estoque />} />
          <Route path="/juros" element={<Juros />} />
          <Route path="*" element={<Navigate to="/comissoes" replace />} />
        </Routes>
      </main>
    </div>
  );
}
