import { Router } from "express";
import { z } from "zod";
import dados from "../data/vendas.json";
import { paraCentavos, paraReais } from "../shared/dinheiro";
import { calcularComissoes, type Venda } from "./comissao";

const vendasSchema = z.object({
  vendas: z
    .array(
      z.object({
        vendedor: z.string({ error: "Informe o nome do vendedor" }).trim().min(1, "Informe o nome do vendedor"),
        valor: z.number({ error: "O valor deve ser um número" }).nonnegative("O valor da venda não pode ser negativo"),
      }),
      { error: 'Envie uma lista de vendas no campo "vendas"' },
    )
    .min(1, "Envie pelo menos uma venda"),
});

function montarResposta(vendas: Venda[]) {
  const vendedores = calcularComissoes(vendas);

  const somar = (campo: "totalVendido" | "totalComissao") =>
    paraReais(vendedores.reduce((total, v) => total + paraCentavos(v[campo]), 0));

  return {
    resumo: {
      quantidadeVendas: vendas.length,
      quantidadeVendedores: vendedores.length,
      totalVendido: somar("totalVendido"),
      totalComissao: somar("totalComissao"),
    },
    vendedores,
  };
}

export const comissoesRoutes = Router();

// usa o JSON do enunciado
comissoesRoutes.get("/", (_req, res) => {
  res.json(montarResposta(dados.vendas));
});

// recebe outro JSON no mesmo formato ({ "vendas": [...] })
comissoesRoutes.post("/", (req, res) => {
  const { vendas } = vendasSchema.parse(req.body);
  res.json(montarResposta(vendas));
});
