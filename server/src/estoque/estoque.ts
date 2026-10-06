import dadosIniciais from "../data/estoque.json";
import { ErroDeNegocio } from "../shared/erros";
import type { Armazenamento } from "./armazenamento";

export type TipoMovimentacao = "entrada" | "saida";

export interface Produto {
  codigoProduto: number;
  descricaoProduto: string;
  estoque: number;
}

export interface Movimentacao {
  id: number;
  codigoProduto: number;
  tipo: TipoMovimentacao;
  quantidade: number;
  descricao: string;
  estoqueAnterior: number;
  estoqueFinal: number;
  data: string;
}

export interface NovaMovimentacao {
  codigoProduto: number;
  tipo: TipoMovimentacao;
  quantidade: number;
  descricao: string;
}

export interface DadosEstoque {
  produtos: Produto[];
  movimentacoes: Movimentacao[];
  ultimoId: number;
}

function estadoInicial(): DadosEstoque {
  return {
    // structuredClone pra não alterar o JSON importado
    produtos: structuredClone(dadosIniciais.estoque),
    movimentacoes: [],
    ultimoId: 0,
  };
}

export class Estoque {
  private dados: DadosEstoque;

  constructor(private armazenamento: Armazenamento) {
    this.dados = armazenamento.ler() ?? estadoInicial();
  }

  listarProdutos(): Produto[] {
    return this.dados.produtos;
  }

  buscarProduto(codigo: number): Produto {
    const produto = this.dados.produtos.find((p) => p.codigoProduto === codigo);
    if (!produto) {
      throw new ErroDeNegocio(`Produto ${codigo} não encontrado`, 404);
    }
    return produto;
  }

  listarMovimentacoes(codigoProduto?: number): Movimentacao[] {
    const lista = codigoProduto
      ? this.dados.movimentacoes.filter((m) => m.codigoProduto === codigoProduto)
      : this.dados.movimentacoes;

    // mais recentes primeiro
    return [...lista].reverse();
  }

  movimentar({ codigoProduto, tipo, quantidade, descricao }: NovaMovimentacao): Movimentacao {
    const produto = this.buscarProduto(codigoProduto);
    const estoqueAnterior = produto.estoque;

    if (tipo === "saida" && quantidade > estoqueAnterior) {
      throw new ErroDeNegocio(
        `Estoque insuficiente: ${produto.descricaoProduto} tem ${estoqueAnterior} unidade(s) e a saída pedida é de ${quantidade}`,
        409,
      );
    }

    produto.estoque += tipo === "entrada" ? quantidade : -quantidade;

    const movimentacao: Movimentacao = {
      id: ++this.dados.ultimoId,
      codigoProduto,
      tipo,
      quantidade,
      descricao,
      estoqueAnterior,
      estoqueFinal: produto.estoque,
      data: new Date().toISOString(),
    };

    this.dados.movimentacoes.push(movimentacao);
    this.armazenamento.gravar(this.dados);

    return movimentacao;
  }

  restaurar() {
    this.dados = estadoInicial();
    this.armazenamento.gravar(this.dados);
  }
}
