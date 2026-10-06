import { Router } from "express";
import { z } from "zod";
import type { Estoque } from "./estoque";

const movimentacaoSchema = z.object({
  codigoProduto: z.coerce.number().int(),
  tipo: z.enum(["entrada", "saida"], { error: 'O tipo deve ser "entrada" ou "saida"' }),
  quantidade: z.coerce
    .number()
    .int("A quantidade deve ser um número inteiro")
    .positive("A quantidade deve ser maior que zero"),
  descricao: z
    .string()
    .trim()
    .min(3, "Descreva a movimentação (mínimo de 3 caracteres)")
    .max(80, "A descrição pode ter no máximo 80 caracteres"),
});

export function estoqueRoutes(estoque: Estoque) {
  const router = Router();

  router.get("/produtos", (_req, res) => {
    res.json(estoque.listarProdutos());
  });

  router.get("/movimentacoes", (req, res) => {
    const produto = req.query.produto ? Number(req.query.produto) : undefined;
    res.json(estoque.listarMovimentacoes(produto));
  });

  router.post("/movimentacoes", (req, res) => {
    const dados = movimentacaoSchema.parse(req.body);
    const movimentacao = estoque.movimentar(dados);
    const produto = estoque.buscarProduto(movimentacao.codigoProduto);

    res.status(201).json({
      movimentacao,
      produto,
      mensagem: `Movimentação #${movimentacao.id} registrada. Estoque final de ${produto.descricaoProduto}: ${movimentacao.estoqueFinal}`,
    });
  });

  // volta pro estoque do enunciado, ajuda a testar do zero
  router.post("/restaurar", (_req, res) => {
    estoque.restaurar();
    res.status(204).end();
  });

  return router;
}
