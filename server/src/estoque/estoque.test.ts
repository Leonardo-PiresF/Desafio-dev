import { beforeEach, describe, expect, it } from "vitest";
import { EmMemoria } from "./armazenamento";
import { Estoque } from "./estoque";

describe("Estoque", () => {
  let armazenamento: EmMemoria;
  let estoque: Estoque;

  beforeEach(() => {
    armazenamento = new EmMemoria();
    estoque = new Estoque(armazenamento);
  });

  it("começa com os produtos do enunciado", () => {
    expect(estoque.listarProdutos()).toHaveLength(5);
    expect(estoque.buscarProduto(101).estoque).toBe(150);
  });

  it("soma na entrada e retorna o estoque final", () => {
    const mov = estoque.movimentar({
      codigoProduto: 101,
      tipo: "entrada",
      quantidade: 50,
      descricao: "Compra do fornecedor",
    });

    expect(mov).toMatchObject({ id: 1, estoqueAnterior: 150, estoqueFinal: 200 });
    expect(estoque.buscarProduto(101).estoque).toBe(200);
  });

  it("subtrai na saída", () => {
    const mov = estoque.movimentar({ codigoProduto: 102, tipo: "saida", quantidade: 25, descricao: "Venda no balcão" });
    expect(mov.estoqueFinal).toBe(50);
  });

  it("permite zerar o estoque", () => {
    const mov = estoque.movimentar({ codigoProduto: 105, tipo: "saida", quantidade: 90, descricao: "Venda" });
    expect(mov.estoqueFinal).toBe(0);
  });

  it("não deixa sair mais do que tem", () => {
    expect(() => estoque.movimentar({ codigoProduto: 105, tipo: "saida", quantidade: 91, descricao: "Venda" })).toThrow(
      /Estoque insuficiente/,
    );
    expect(estoque.buscarProduto(105).estoque).toBe(90);
  });

  it("recusa produto que não existe", () => {
    expect(() =>
      estoque.movimentar({ codigoProduto: 999, tipo: "entrada", quantidade: 1, descricao: "Teste" }),
    ).toThrow(/não encontrado/);
  });

  it("gera ids sequenciais e únicos", () => {
    const ids = [101, 102, 103].map(
      (codigo) => estoque.movimentar({ codigoProduto: codigo, tipo: "entrada", quantidade: 1, descricao: "Ajuste" }).id,
    );
    expect(ids).toEqual([1, 2, 3]);
  });

  it("mantém o histórico e os ids depois de recarregar", () => {
    estoque.movimentar({ codigoProduto: 103, tipo: "saida", quantidade: 10, descricao: "Venda" });

    const recarregado = new Estoque(armazenamento);
    const mov = recarregado.movimentar({ codigoProduto: 103, tipo: "saida", quantidade: 10, descricao: "Venda" });

    expect(mov.id).toBe(2);
    expect(mov.estoqueFinal).toBe(180);
    expect(recarregado.listarMovimentacoes(103)).toHaveLength(2);
  });

  it("lista as movimentações mais recentes primeiro e filtra por produto", () => {
    estoque.movimentar({ codigoProduto: 101, tipo: "entrada", quantidade: 1, descricao: "Ajuste" });
    estoque.movimentar({ codigoProduto: 102, tipo: "entrada", quantidade: 1, descricao: "Compra" });
    estoque.movimentar({ codigoProduto: 101, tipo: "saida", quantidade: 1, descricao: "Venda" });

    expect(estoque.listarMovimentacoes().map((m) => m.id)).toEqual([3, 2, 1]);
    expect(estoque.listarMovimentacoes(101).map((m) => m.id)).toEqual([3, 1]);
  });

  it("restaura o estoque inicial", () => {
    estoque.movimentar({ codigoProduto: 104, tipo: "saida", quantidade: 20, descricao: "Venda" });
    estoque.restaurar();

    expect(estoque.buscarProduto(104).estoque).toBe(320);
    expect(estoque.listarMovimentacoes()).toHaveLength(0);
  });
});
