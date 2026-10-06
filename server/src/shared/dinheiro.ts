// Toda conta com dinheiro é feita em centavos (inteiros) pra não cair
// nos problemas de ponto flutuante do JS (0.1 + 0.2 !== 0.3).

export function paraCentavos(valor: number): number {
  return Math.round(valor * 100);
}

export function paraReais(centavos: number): number {
  return centavos / 100;
}
