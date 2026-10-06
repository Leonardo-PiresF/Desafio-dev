const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numero = new Intl.NumberFormat("pt-BR");
const porcentagem = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 2 });

export const formatarMoeda = (valor: number) => moeda.format(valor);
export const formatarNumero = (valor: number) => numero.format(valor);
export const formatarPorcentagem = (fracao: number) => porcentagem.format(fracao);

// "2026-10-05" -> "05/10/2026" sem passar por new Date (que puxaria pro fuso local)
export function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function hojeEmBrasilia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export function diasEntre(inicio: string, fim: string) {
  return Math.round((Date.parse(fim) - Date.parse(inicio)) / 86_400_000);
}

export const plural = (quantidade: number, singular: string, plural = `${singular}s`) =>
  `${formatarNumero(quantidade)} ${quantidade === 1 ? singular : plural}`;
