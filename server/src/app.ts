import cors from "cors";
import express from "express";
import { comissoesRoutes } from "./comissoes/comissoes.routes";
import type { Estoque } from "./estoque/estoque";
import { estoqueRoutes } from "./estoque/estoque.routes";
import { jurosRoutes } from "./juros/juros.routes";
import { tratarErros } from "./shared/erros";

export function criarApp(estoque: Estoque) {
  const app = express();

  // em produção, CORS_ORIGIN recebe a URL do front (ex.: https://desafio-dev.vercel.app)
  app.use(cors({ origin: process.env.CORS_ORIGIN ?? true }));
  app.use(express.json());

  app.get("/api/saude", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/comissoes", comissoesRoutes);
  app.use("/api/estoque", estoqueRoutes(estoque));
  app.use("/api/juros", jurosRoutes);

  app.use((_req, res) => {
    res.status(404).json({ erro: "Rota não encontrada" });
  });

  app.use(tratarErros);

  return app;
}
