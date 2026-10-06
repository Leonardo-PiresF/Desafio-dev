import { Router } from "express";
import { z } from "zod";
import { calcularJuros } from "./juros";

const dataValida = (campo: string) =>
  z
    .string({ error: `Informe a ${campo}` })
    .regex(/^\d{4}-\d{2}-\d{2}$/, `A ${campo} deve estar no formato AAAA-MM-DD`)
    .refine((data) => {
      // Date.parse aceita 2026-02-31 e joga pra março, então confiro na volta
      const convertida = new Date(`${data}T00:00:00Z`);
      return !Number.isNaN(convertida.getTime()) && convertida.toISOString().startsWith(data);
    }, `A ${campo} não é uma data válida`);

const jurosSchema = z.object({
  valor: z.coerce.number({ error: "Informe o valor" }).positive("O valor deve ser maior que zero"),
  vencimento: dataValida("data de vencimento"),
  // opcional: permite simular o cálculo em outro dia
  dataCalculo: dataValida("data do cálculo").optional(),
});

export const jurosRoutes = Router();

// GET /api/juros?valor=1500&vencimento=2026-09-20
jurosRoutes.get("/", (req, res) => {
  const { valor, vencimento, dataCalculo } = jurosSchema.parse(req.query);
  res.json(calcularJuros(valor, vencimento, dataCalculo));
});
