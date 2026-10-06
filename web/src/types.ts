// Mesmo formato que a API devolve

export interface Venda {
  vendedor: string;
  valor: number;
}

export interface VendaComissionada extends Venda {
  percentual: number;
  comissao: number;
}

export interface ResumoVendedor {
  vendedor: string;
  quantidadeVendas: number;
  totalVendido: number;
  totalComissao: number;
  vendas: VendaComissionada[];
}

export interface RelatorioComissoes {
  resumo: {
    quantidadeVendas: number;
    quantidadeVendedores: number;
    totalVendido: number;
    totalComissao: number;
  };
  vendedores: ResumoVendedor[];
}

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

export interface CalculoJuros {
  valorOriginal: number;
  vencimento: string;
  dataCalculo: string;
  diasEmAtraso: number;
  taxaDiaria: number;
  juros: number;
  valorAtualizado: number;
}
