import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { criarApp } from "./app";
import { EmMemoria } from "./estoque/armazenamento";
import { Estoque } from "./estoque/estoque";

let app: ReturnType<typeof criarApp>;

beforeEach(() => {
  app = criarApp(new Estoque(new EmMemoria()));
});

describe("GET /api/comissoes", () => {
  it("calcula as comissões do JSON do enunciado", async () => {
    const res = await request(app).get("/api/comissoes");

    expect(res.status).toBe(200);
    expect(res.body.resumo).toEqual({
      quantidadeVendas: 36,
      quantidadeVendedores: 4,
      totalVendido: 37321.3,
      totalComissao: 1746.02,
    });
  });
});

describe("POST /api/comissoes", () => {
  it("aceita outro conjunto de vendas", async () => {
    const res = await request(app)
      .post("/api/comissoes")
      .send({ vendas: [{ vendedor: "Teste", valor: 1000 }] });

    expect(res.body.vendedores[0]).toMatchObject({ vendedor: "Teste", totalComissao: 50 });
  });

  it("valida o formato", async () => {
    const res = await request(app)
      .post("/api/comissoes")
      .send({ vendas: [{ vendedor: "", valor: -10 }] });

    expect(res.status).toBe(400);
    expect(res.body.detalhes).toHaveLength(2);
  });

  it("responde 400 pra JSON quebrado", async () => {
    const res = await request(app).post("/api/comissoes").set("Content-Type", "application/json").send("{ vendas: ");
    expect(res.status).toBe(400);
  });
});

describe("POST /api/estoque/movimentacoes", () => {
  it("registra a movimentação e devolve o estoque final", async () => {
    const res = await request(app)
      .post("/api/estoque/movimentacoes")
      .send({ codigoProduto: 101, tipo: "entrada", quantidade: 30, descricao: "Compra do fornecedor" });

    expect(res.status).toBe(201);
    expect(res.body.movimentacao).toMatchObject({ id: 1, estoqueFinal: 180 });
    expect(res.body.mensagem).toContain("Estoque final de Caneta Azul: 180");
  });

  it("retorna 409 quando não tem estoque suficiente", async () => {
    const res = await request(app)
      .post("/api/estoque/movimentacoes")
      .send({ codigoProduto: 102, tipo: "saida", quantidade: 76, descricao: "Venda" });

    expect(res.status).toBe(409);
  });

  it("retorna 404 para produto inexistente", async () => {
    const res = await request(app)
      .post("/api/estoque/movimentacoes")
      .send({ codigoProduto: 1, tipo: "entrada", quantidade: 1, descricao: "Teste" });

    expect(res.status).toBe(404);
  });

  it("valida quantidade e tipo", async () => {
    const res = await request(app)
      .post("/api/estoque/movimentacoes")
      .send({ codigoProduto: 101, tipo: "devolucao", quantidade: 0, descricao: "Teste" });

    expect(res.status).toBe(400);
    expect(res.body.detalhes.map((d: { campo: string }) => d.campo)).toEqual(["tipo", "quantidade"]);
  });
});

describe("GET /api/juros", () => {
  it("calcula usando a data informada", async () => {
    const res = await request(app)
      .get("/api/juros")
      .query({ valor: 200, vencimento: "2026-09-25", dataCalculo: "2026-10-05" });

    expect(res.body).toMatchObject({ diasEmAtraso: 10, juros: 50, valorAtualizado: 250 });
  });

  it("recusa data inexistente", async () => {
    const res = await request(app).get("/api/juros").query({ valor: 200, vencimento: "2026-02-31" });
    expect(res.status).toBe(400);
  });
});
