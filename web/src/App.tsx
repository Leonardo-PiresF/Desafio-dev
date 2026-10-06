import { useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router";
import { api } from "./api";
import Comissoes from "./pages/Comissoes";
import Estoque from "./pages/Estoque";
import Juros from "./pages/Juros";

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
    <>
      <header className="topo">
        <div className="topo__conteudo">
          <span className="logo">
            <img src="/favicon.svg" alt="" width={24} height={24} />
            Desafio Dev
          </span>

          <nav className="abas" aria-label="Exercícios">
            <NavLink to="/comissoes">Comissões</NavLink>
            <NavLink to="/estoque">Estoque</NavLink>
            <NavLink to="/juros">Juros</NavLink>
          </nav>

          <span className={`status-api status-api--${statusApi}`} title="Situação da API">
            {statusApi === "verificando" ? "Conectando…" : statusApi === "online" ? "API online" : "API offline"}
          </span>
        </div>
      </header>

      <main className="conteudo">
        <Routes>
          <Route path="/" element={<Navigate to="/comissoes" replace />} />
          <Route path="/comissoes" element={<Comissoes />} />
          <Route path="/estoque" element={<Estoque />} />
          <Route path="/juros" element={<Juros />} />
          <Route path="*" element={<Navigate to="/comissoes" replace />} />
        </Routes>
      </main>

      <footer className="rodape">Leonardo Ferreira · Desafio técnico</footer>
    </>
  );
}
