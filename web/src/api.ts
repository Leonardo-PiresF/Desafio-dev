import type { CalculoJuros, Movimentacao, Produto, RelatorioComissoes, TipoMovimentacao, Venda } from "./types";

// Em produção a API fica em outro domínio, em dev fica vazio e o proxy do Vite resolve
const BASE_URL = import.meta.env.VITE_API_URL ?? "";

interface DetalheErro {
  campo: string;
  mensagem: string;
}

export class ErroApi extends Error {
  status: number;
  detalhes: DetalheErro[];

  constructor(message: string, status: number, detalhes: DetalheErro[] = []) {
    super(message);
    this.status = status;
    this.detalhes = detalhes;
  }
}

async function requisicao<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  let resposta: Response;

  try {
    resposta = await fetch(BASE_URL + caminho, {
      ...opcoes,
      headers: { "Content-Type": "application/json", ...opcoes.headers },
    });
  } catch {
    throw new ErroApi("Não foi possível falar com a API. Ela está rodando?", 0);
  }

  if (resposta.status === 204) return undefined as T;

  const corpo = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    throw new ErroApi(corpo?.erro ?? "Algo deu errado", resposta.status, corpo?.detalhes);
  }

  return corpo as T;
}

export const api = {
  saude: () => requisicao<{ status: string }>("/api/saude"),

  comissoes: () => requisicao<RelatorioComissoes>("/api/comissoes"),

  calcularComissoes: (vendas: Venda[]) =>
    requisicao<RelatorioComissoes>("/api/comissoes", {
      method: "POST",
      body: JSON.stringify({ vendas }),
    }),

  produtos: () => requisicao<Produto[]>("/api/estoque/produtos"),

  movimentacoes: () => requisicao<Movimentacao[]>("/api/estoque/movimentacoes"),

  movimentar: (dados: { codigoProduto: number; tipo: TipoMovimentacao; quantidade: number; descricao: string }) =>
    requisicao<{ movimentacao: Movimentacao; produto: Produto; mensagem: string }>("/api/estoque/movimentacoes", {
      method: "POST",
      body: JSON.stringify(dados),
    }),

  restaurarEstoque: () => requisicao<void>("/api/estoque/restaurar", { method: "POST" }),

  juros: (params: { valor: number; vencimento: string; dataCalculo?: string }) => {
    const query = new URLSearchParams({ valor: String(params.valor), vencimento: params.vencimento });
    if (params.dataCalculo) query.set("dataCalculo", params.dataCalculo);
    return requisicao<CalculoJuros>(`/api/juros?${query}`);
  },
};
