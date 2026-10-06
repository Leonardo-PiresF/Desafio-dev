import { paraCentavos, paraReais } from "../shared/dinheiro";

export const TAXA_DIARIA = 2.5; // % ao dia

const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;

export interface CalculoJuros {
  valorOriginal: number;
  vencimento: string;
  dataCalculo: string;
  diasEmAtraso: number;
  taxaDiaria: number;
  juros: number;
  valorAtualizado: number;
}

// "Hoje" no fuso de Brasília. Sem isso, depois das 21h o servidor
// (que normalmente roda em UTC) já estaria no dia seguinte.
export function hojeEmBrasilia(agora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(agora);
}

// Datas no formato YYYY-MM-DD. Converto as duas pra UTC pra contar
// só dias inteiros, sem interferência de horário de verão.
export function diasEntre(inicio: string, fim: string): number {
  return Math.round((Date.parse(fim) - Date.parse(inicio)) / UM_DIA_EM_MS);
}

// Juros simples: 2,5% sobre o valor original por dia de atraso.
// Se ainda não venceu (ou vence hoje), não tem juros.
export function calcularJuros(valor: number, vencimento: string, dataCalculo = hojeEmBrasilia()): CalculoJuros {
  const diasEmAtraso = Math.max(0, diasEntre(vencimento, dataCalculo));
  const valorEmCentavos = paraCentavos(valor);
  const jurosEmCentavos = Math.round((valorEmCentavos * TAXA_DIARIA * diasEmAtraso) / 100);

  return {
    valorOriginal: paraReais(valorEmCentavos),
    vencimento,
    dataCalculo,
    diasEmAtraso,
    taxaDiaria: TAXA_DIARIA,
    juros: paraReais(jurosEmCentavos),
    valorAtualizado: paraReais(valorEmCentavos + jurosEmCentavos),
  };
}
