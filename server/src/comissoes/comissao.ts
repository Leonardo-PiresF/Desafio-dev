import { paraCentavos, paraReais } from "../shared/dinheiro";

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

// Faixas em centavos. Abaixo de R$ 100 não tem comissão,
// de R$ 100 até R$ 499,99 é 1% e a partir de R$ 500 é 5%.
const LIMITE_SEM_COMISSAO = 100_00;
const LIMITE_FAIXA_MAIOR = 500_00;

export function percentualDaVenda(valor: number): number {
  const centavos = paraCentavos(valor);

  if (centavos < LIMITE_SEM_COMISSAO) return 0;
  if (centavos < LIMITE_FAIXA_MAIOR) return 1;
  return 5;
}

// A comissão é arredondada por venda, que é como ela apareceria
// num extrato pro vendedor. O total é a soma das comissões já arredondadas.
export function comissaoDaVenda(valor: number): number {
  const percentual = percentualDaVenda(valor);
  const centavos = Math.round((paraCentavos(valor) * percentual) / 100);
  return paraReais(centavos);
}

export function calcularComissoes(vendas: Venda[]): ResumoVendedor[] {
  const porVendedor = new Map<string, ResumoVendedor>();

  for (const venda of vendas) {
    const nome = venda.vendedor.trim();
    let resumo = porVendedor.get(nome);

    if (!resumo) {
      resumo = { vendedor: nome, quantidadeVendas: 0, totalVendido: 0, totalComissao: 0, vendas: [] };
      porVendedor.set(nome, resumo);
    }

    const comissao = comissaoDaVenda(venda.valor);

    resumo.vendas.push({
      vendedor: nome,
      valor: venda.valor,
      percentual: percentualDaVenda(venda.valor),
      comissao,
    });
    resumo.quantidadeVendas++;
    // soma em centavos e volta pra reais, senão o total sai tipo 11755.699999999
    resumo.totalVendido = paraReais(paraCentavos(resumo.totalVendido) + paraCentavos(venda.valor));
    resumo.totalComissao = paraReais(paraCentavos(resumo.totalComissao) + paraCentavos(comissao));
  }

  return [...porVendedor.values()].sort((a, b) => b.totalComissao - a.totalComissao);
}
