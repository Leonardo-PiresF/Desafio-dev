import { useState, type FormEvent } from "react";
import { api } from "../api";
import { CabecalhoPagina } from "../components/CabecalhoPagina";
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
        await api.juros({ valor: valor.valor, vencimento, dataCalculo: dataCalculo === hoje ? undefined : dataCalculo }),
      );
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCalculando(false);
    }
  }

  return (
    <>
      <CabecalhoPagina numero="03" titulo="Juros por atraso">
        <p>
          A partir de um valor e da data de vencimento, calcula quanto ficou de juros até hoje, com taxa de{" "}
          <strong>2,5% ao dia</strong> sobre o valor original.
        </p>
      </CabecalhoPagina>

      <div className="juros">
        <form className="cartao form-juros" onSubmit={calcular}>
          <div className="campo">
            <label htmlFor="valor">Valor</label>
            <input
              id="valor"
              inputMode="numeric"
              autoComplete="off"
              placeholder="R$ 0,00"
              required
              className="mono"
              {...valor.props}
            />
          </div>

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
            <label htmlFor="data-calculo">Calcular em</label>
            <input
              id="data-calculo"
              type="date"
              required
              value={dataCalculo}
              onChange={(e) => setDataCalculo(e.target.value)}
              aria-describedby="dica-data"
            />
            <p id="dica-data" className="dica">
              {dataCalculo === hoje ? (
                "Hoje, no horário de Brasília"
              ) : (
                <button type="button" className="link" onClick={() => setDataCalculo(hoje)}>
                  Voltar para hoje ({formatarData(hoje)})
                </button>
              )}
            </p>
          </div>

          {erro && <p className="aviso aviso--erro">{erro}</p>}

          <button className="botao" disabled={calculando}>
            {calculando ? "Calculando…" : "Calcular juros"}
          </button>
        </form>

        {resultado ? <Resultado calculo={resultado} /> : <ResultadoVazio />}
      </div>
    </>
  );
}

function Resultado({ calculo }: { calculo: CalculoJuros }) {
  const emDia = calculo.diasEmAtraso === 0;
  const faltam = diasEntre(calculo.dataCalculo, calculo.vencimento);

  return (
    <section className="cartao resultado" aria-live="polite">
      <p className={`resultado__situacao ${emDia ? "resultado__situacao--ok" : ""}`}>
        {emDia
          ? faltam > 0
            ? `Dentro do prazo, vence em ${plural(faltam, "dia")}`
            : "Vence hoje, ainda sem juros"
          : `${plural(calculo.diasEmAtraso, "dia")} em atraso`}
      </p>

      <p className="resultado__total">
        <span>Valor atualizado</span>
        {formatarMoeda(calculo.valorAtualizado)}
      </p>

      <dl className="resultado__linhas">
        <div>
          <dt>Valor original</dt>
          <dd>{formatarMoeda(calculo.valorOriginal)}</dd>
        </div>
        <div>
          <dt>Vencimento</dt>
          <dd>{formatarData(calculo.vencimento)}</dd>
        </div>
        <div>
          <dt>Calculado em</dt>
          <dd>{formatarData(calculo.dataCalculo)}</dd>
        </div>
        <div className="resultado__juros">
          <dt>Juros</dt>
          <dd>{formatarMoeda(calculo.juros)}</dd>
        </div>
      </dl>

      {!emDia && (
        <p className="formula">
          {formatarMoeda(calculo.valorOriginal)} × {String(calculo.taxaDiaria).replace(".", ",")}% ×{" "}
          {plural(calculo.diasEmAtraso, "dia")} = {formatarMoeda(calculo.juros)}
        </p>
      )}
    </section>
  );
}

function ResultadoVazio() {
  return (
    <section className="cartao resultado resultado--vazio">
      <p>Preencha o valor e o vencimento para ver os juros.</p>
      <p className="dica">
        Pagamentos no dia do vencimento ou antes dele não têm juros. A partir do dia seguinte, cada dia soma 2,5% do
        valor original.
      </p>
    </section>
  );
}
