import { describe, expect, it } from "vitest";
import { calcularJuros, diasEntre, hojeEmBrasilia } from "./juros";

describe("calcularJuros", () => {
  it("cobra 2,5% por dia de atraso sobre o valor original", () => {
    const calculo = calcularJuros(1000, "2026-10-01", "2026-10-05");

    expect(calculo.diasEmAtraso).toBe(4);
    expect(calculo.juros).toBe(100); // 1000 * 2,5% * 4
    expect(calculo.valorAtualizado).toBe(1100);
  });

  it("não cobra juros se vence hoje", () => {
    expect(calcularJuros(500, "2026-10-05", "2026-10-05").juros).toBe(0);
  });

  it("não cobra juros se ainda não venceu", () => {
    const calculo = calcularJuros(500, "2026-12-01", "2026-10-05");
    expect(calculo.diasEmAtraso).toBe(0);
    expect(calculo.valorAtualizado).toBe(500);
  });

  it("arredonda os centavos", () => {
    // 123,45 * 2,5% * 3 = 9,25875
    expect(calcularJuros(123.45, "2026-10-02", "2026-10-05").juros).toBe(9.26);
  });

  it("conta certo atravessando meses e ano bissexto", () => {
    expect(diasEntre("2028-02-28", "2028-03-01")).toBe(2);
    expect(diasEntre("2026-12-31", "2027-01-01")).toBe(1);
  });
});

describe("hojeEmBrasilia", () => {
  it("usa o fuso de Brasília e não o UTC", () => {
    // 01:30 UTC do dia 6 ainda é 22:30 do dia 5 em Brasília
    expect(hojeEmBrasilia(new Date("2026-10-06T01:30:00Z"))).toBe("2026-10-05");
  });
});
