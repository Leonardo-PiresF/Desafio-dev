import { describe, expect, it } from "vitest";
import dados from "../data/vendas.json";
import { calcularComissoes, comissaoDaVenda, percentualDaVenda } from "./comissao";

describe("percentualDaVenda", () => {
  it.each([
    [0, 0],
    [99.99, 0],
    [100, 1],
    [499.99, 1],
    [500, 5],
    [2100.4, 5],
  ])("venda de R$ %d gera %d%%", (valor, esperado) => {
    expect(percentualDaVenda(valor)).toBe(esperado);
  });
});

describe("comissaoDaVenda", () => {
  it("arredonda pro centavo mais próximo", () => {
    expect(comissaoDaVenda(480.75)).toBe(4.81); // 4,8075
    expect(comissaoDaVenda(250.3)).toBe(2.5); // 2,503
    expect(comissaoDaVenda(950.75)).toBe(47.54); // 47,5375
  });

  it("não gera comissão abaixo de R$ 100", () => {
    expect(comissaoDaVenda(90.75)).toBe(0);
  });
});

describe("calcularComissoes", () => {
  const resultado = calcularComissoes(dados.vendas);
  const doVendedor = (nome: string) => resultado.find((r) => r.vendedor === nome)!;

  it("agrupa as vendas por vendedor", () => {
    expect(resultado).toHaveLength(4);
    expect(doVendedor("João Silva").quantidadeVendas).toBe(10);
    expect(doVendedor("Carlos Oliveira").quantidadeVendas).toBe(8);
  });

  it("calcula os totais do JSON do enunciado", () => {
    expect(doVendedor("João Silva")).toMatchObject({ totalVendido: 10754.7, totalComissao: 495.69 });
    expect(doVendedor("Maria Souza")).toMatchObject({ totalVendido: 9874.3, totalComissao: 465.96 });
    expect(doVendedor("Carlos Oliveira")).toMatchObject({ totalVendido: 7928.35, totalComissao: 379.38 });
    expect(doVendedor("Ana Lima")).toMatchObject({ totalVendido: 8763.95, totalComissao: 404.99 });
  });

  it("ordena do maior para o menor comissionado", () => {
    expect(resultado.map((r) => r.vendedor)).toEqual(["João Silva", "Maria Souza", "Ana Lima", "Carlos Oliveira"]);
  });

  it("trata nomes com espaço sobrando como o mesmo vendedor", () => {
    const [unico] = calcularComissoes([
      { vendedor: "Ana Lima", valor: 200 },
      { vendedor: " Ana Lima ", valor: 600 },
    ]);
    expect(unico).toMatchObject({ quantidadeVendas: 2, totalComissao: 32 });
  });
});
