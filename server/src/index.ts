import path from "node:path";
import { criarApp } from "./app";
import { ArquivoJson } from "./estoque/armazenamento";
import { Estoque } from "./estoque/estoque";

// Na Vercel só o /tmp aceita escrita (e ele é apagado de tempos em tempos),
// então lá o histórico de movimentações não é permanente.
const arquivoDoBanco =
  process.env.ARQUIVO_ESTOQUE ??
  (process.env.VERCEL ? "/tmp/estoque.json" : path.resolve(process.cwd(), "estoque.db.json"));

const app = criarApp(new Estoque(new ArquivoJson(arquivoDoBanco)));

if (!process.env.VERCEL) {
  const porta = Number(process.env.PORT ?? 3333);
  app.listen(porta, () => {
    console.log(`API rodando em http://localhost:${porta}`);
  });
}

export default app;
