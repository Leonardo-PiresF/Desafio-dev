// Versão de terminal do exercício 1:
//   npm run comissoes                    -> usa o JSON do enunciado
//   npm run comissoes -- caminho/do.json -> usa outro arquivo

import { readFileSync } from "node:fs";
import dadosPadrao from "../data/vendas.json";
import { calcularComissoes, type Venda } from "./comissao";

const caminho = process.argv[2];
const vendas: Venda[] = caminho ? JSON.parse(readFileSync(caminho, "utf-8")).vendas : dadosPadrao.vendas;

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const linhas = calcularComissoes(vendas).map((v) => ({
  Vendedor: v.vendedor,
  Vendas: v.quantidadeVendas,
  "Total vendido": brl.format(v.totalVendido),
  Comissão: brl.format(v.totalComissao),
}));

console.table(linhas);
