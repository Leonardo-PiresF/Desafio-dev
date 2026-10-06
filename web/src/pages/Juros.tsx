import { useState, type FormEvent } from "react";
import { api } from "../api";
import { Painel } from "../components/Painel";
import { TituloPagina } from "../components/TituloPagina";
import type { CalculoJuros } from "../types";
import { diasEntre, formatarData, formatarMoeda, hojeEmBrasilia, plural } from "../utils/formatar";

// O campo guarda centavos e vai formatando enquanto a pessoa digita,
// do jeito que app de banco faz: 1 -> 0,01 / 15 -> 0,15 / 1500 -> 15,00
function useCampoMoeda() {
  const [centavos, setCentavos] = useState(0);

  return {
    valor: centavos / 100,
    props: {
      value: centavos ? formatarMoeda(centavos / 100) : "",
      onChange: (e: { target: { value: string } }) => {
        const digitos = e.target.value.replace(/\D/g, "").slice(0, 12);
        setCentavos(Number(digitos));
      },
    },
  };
}

export default function Juros() {
  const hoje = hojeEmBrasilia();
  const valor = useCampoMoeda();
  const [vencimento, setVencimento] = useState("");
  const [dataCalculo, setDataCalculo] = useState(hoje);
  const [resultado, setResultado] = useState<CalculoJuros | null>(null);
  const [erro, setErro] = useState("");
  const [calculando, setCalculando] = useState(false);

  async function calcular(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valor.valor) {
      setErro("Informe um valor maior que zero");
      return;
    }

    setCalculando(true);
    setErro("");
    try {
      // só manda a data se for diferente de hoje, assim quem decide o "hoje" é a API
      setResultado(
        await api.juros({
          valor: valor.valor,
          vencimento,
          dataCalculo: dataCalculo === hoje ? undefined : dataCalculo,
        }),
      );
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCalculando(false);
    }
  }

  return (
    <>
      <TituloPagina
        titulo="Juros por atraso"
        descricao="Juros de 2,5% ao dia sobre o valor original, contados a partir do vencimento."
      />

      <div className="grade-juros">
        <Painel titulo="Dados do título">
          <form className="formulario" onSubmit={calcular}>
            {erro && <div className="alerta alerta--erro">{erro}</div>}

            <div className="campo">
              <label htmlFor="valor">Valor</label>
              <input
                id="valor"
                inputMode="numeric"
                autoComplete="off"
                placeholder="R$ 0,00"
                required
                {...valor.props}
              />
            </div>

            <div className="linha-campos">
              <div className="campo">
                <label htmlFor="vencimento">Vencimento</label>
                <input
                  id="vencimento"
                  type="date"
                  required
                  value={vencimento}
                  onChange={(e) => setVencimento(e.target.value)}
                />
              </div>
              <div className="campo">
                <label htmlFor="data-calculo">Data do cálculo</label>
                <input
                  id="data-calculo"
                  type="date"
                  required
                  value={dataCalculo}
                  onChange={(e) => setDataCalculo(e.target.value)}
                />
              </div>
            </div>
            <small className="dica">
              {dataCalculo === hoje ? (
                "A data do cálculo vem preenchida com hoje (horário de Brasília)."
              ) : (
                <button type="button" className="link" onClick={() => setDataCalculo(hoje)}>
                  Usar a data de hoje ({formatarData(hoje)})
                </button>
              )}
            </small>

            <button className="botao" disabled={calculando}>
              {calculando ? "Calculando…" : "Calcular"}
            </button>
          </form>
        </Painel>

        <Painel titulo="Demonstrativo">
          {resultado ? (
            <Demonstrativo calculo={resultado} />
          ) : (
            <p className="vazio">Preencha os dados e clique em Calcular.</p>
          )}
        </Painel>
      </div>
    </>
  );
}

function Demonstrativo({ calculo }: { calculo: CalculoJuros }) {
  const emAtraso = calculo.diasEmAtraso > 0;
  const faltam = diasEntre(calculo.dataCalculo, calculo.vencimento);

  let situacao = `Vencido há ${plural(calculo.diasEmAtraso, "dia")}`;
  if (!emAtraso) situacao = faltam > 0 ? `A vencer em ${plural(faltam, "dia")}` : "Vence hoje";

  return (
    <table className="tabela tabela--demonstrativo">
      <tbody>
        <tr>
          <th>Situação</th>
          <td>
            <span className={`selo ${emAtraso ? "selo--saida" : "selo--entrada"}`}>{situacao}</span>
          </td>
        </tr>
        <tr>
          <th>Vencimento</th>
          <td>{formatarData(calculo.vencimento)}</td>
        </tr>
        <tr>
          <th>Data do cálculo</th>
          <td>{formatarData(calculo.dataCalculo)}</td>
        </tr>
        <tr>
          <th>Valor original</th>
          <td>{formatarMoeda(calculo.valorOriginal)}</td>
        </tr>
        <tr>
          <th>
            Juros
            {emAtraso && (
              <small>
                {String(calculo.taxaDiaria).replace(".", ",")}% × {plural(calculo.diasEmAtraso, "dia")}
              </small>
            )}
          </th>
          <td className={emAtraso ? "texto-erro" : undefined}>{formatarMoeda(calculo.juros)}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th>Valor atualizado</th>
          <td>{formatarMoeda(calculo.valorAtualizado)}</td>
        </tr>
      </tfoot>
    </table>
  );
}
