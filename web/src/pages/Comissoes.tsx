import { Fragment, useEffect, useRef, useState, type ChangeEvent, type Ref } from "react";
import { api, ErroApi } from "../api";
import { Painel } from "../components/Painel";
import { TituloPagina } from "../components/TituloPagina";
import type { RelatorioComissoes, ResumoVendedor, Venda } from "../types";
import { formatarMoeda, formatarNumero, formatarPorcentagem } from "../utils/formatar";

export default function Comissoes() {
  const [relatorio, setRelatorio] = useState<RelatorioComissoes | null>(null);
  const [erro, setErro] = useState("");
  const [usandoJsonProprio, setUsandoJsonProprio] = useState(false);
  const modalRef = useRef<HTMLDialogElement>(null);

  function carregarEnunciado() {
    api
      .comissoes()
      .then((dados) => {
        setRelatorio(dados);
        setUsandoJsonProprio(false);
        setErro("");
      })
      .catch((e: Error) => setErro(e.message));
  }

  useEffect(() => {
    carregarEnunciado();
  }, []);

  return (
    <>
      <TituloPagina
        titulo="Comissões"
        descricao="Comissão de cada vendedor calculada venda a venda."
        acoes={
          <button className="botao" onClick={() => modalRef.current?.showModal()}>
            Importar JSON
          </button>
        }
      />

      <div className="alerta alerta--info">
        <strong>Regra:</strong> vendas abaixo de R$ 100,00 não geram comissão, de R$ 100,00 a R$ 499,99 geram 1% e a
        partir de R$ 500,00 geram 5%.
      </div>

      {erro && <div className="alerta alerta--erro">{erro}</div>}

      {usandoJsonProprio && (
        <div className="alerta alerta--aviso">
          Exibindo os dados do arquivo importado.{" "}
          <button className="link" onClick={carregarEnunciado}>
            Voltar aos dados do enunciado
          </button>
        </div>
      )}

      {relatorio ? <TabelaComissoes relatorio={relatorio} /> : !erro && <p className="carregando">Carregando…</p>}

      <ModalImportar
        ref={modalRef}
        onCalculado={(dados) => {
          setRelatorio(dados);
          setUsandoJsonProprio(true);
          modalRef.current?.close();
        }}
      />
    </>
  );
}

function TabelaComissoes({ relatorio }: { relatorio: RelatorioComissoes }) {
  const { resumo, vendedores } = relatorio;
  const [abertos, setAbertos] = useState<string[]>([]);

  function alternar(nome: string) {
    setAbertos((lista) => (lista.includes(nome) ? lista.filter((n) => n !== nome) : [...lista, nome]));
  }

  return (
    <Painel titulo={`Vendedores (${resumo.quantidadeVendedores})`}>
      <div className="rolagem">
        <table className="tabela">
          <thead>
            <tr>
              <th className="col-acao" aria-label="Detalhes" />
              <th>Vendedor</th>
              <th className="numero">Vendas</th>
              <th className="numero">Total vendido</th>
              <th className="numero">Taxa média</th>
              <th className="numero">Comissão</th>
            </tr>
          </thead>
          <tbody>
            {vendedores.map((vendedor) => {
              const aberto = abertos.includes(vendedor.vendedor);
              const idDetalhe = `detalhe-${vendedor.vendedor.replace(/\s+/g, "-")}`;

              return (
                <Fragment key={vendedor.vendedor}>
                  <tr className={aberto ? "linha-aberta" : undefined}>
                    <td className="col-acao">
                      <button
                        className="botao-expandir"
                        onClick={() => alternar(vendedor.vendedor)}
                        aria-expanded={aberto}
                        aria-controls={idDetalhe}
                        aria-label={`${aberto ? "Ocultar" : "Ver"} vendas de ${vendedor.vendedor}`}
                      >
                        {aberto ? "−" : "+"}
                      </button>
                    </td>
                    <td>{vendedor.vendedor}</td>
                    <td className="numero">{vendedor.quantidadeVendas}</td>
                    <td className="numero">{formatarMoeda(vendedor.totalVendido)}</td>
                    <td className="numero">
                      {formatarPorcentagem(vendedor.totalVendido ? vendedor.totalComissao / vendedor.totalVendido : 0)}
                    </td>
                    <td className="numero">
                      <strong>{formatarMoeda(vendedor.totalComissao)}</strong>
                    </td>
                  </tr>
                  {aberto && (
                    <tr className="linha-detalhe" id={idDetalhe}>
                      <td />
                      <td colSpan={5}>
                        <DetalheVendas vendedor={vendedor} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td />
              <td>Total</td>
              <td className="numero">{resumo.quantidadeVendas}</td>
              <td className="numero">{formatarMoeda(resumo.totalVendido)}</td>
              <td className="numero">
                {formatarPorcentagem(resumo.totalVendido ? resumo.totalComissao / resumo.totalVendido : 0)}
              </td>
              <td className="numero">{formatarMoeda(resumo.totalComissao)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Painel>
  );
}

function DetalheVendas({ vendedor }: { vendedor: ResumoVendedor }) {
  return (
    <table className="tabela tabela--interna">
      <thead>
        <tr>
          <th>Venda</th>
          <th className="numero">Valor</th>
          <th className="numero">Percentual</th>
          <th className="numero">Comissão</th>
        </tr>
      </thead>
      <tbody>
        {vendedor.vendas.map((venda, i) => (
          <tr key={i}>
            <td>{i + 1}ª</td>
            <td className="numero">{formatarMoeda(venda.valor)}</td>
            <td className="numero">
              <span className={`selo selo--faixa-${venda.percentual}`}>{venda.percentual}%</span>
            </td>
            <td className="numero">{venda.comissao ? formatarMoeda(venda.comissao) : "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const EXEMPLO = `{
  "vendas": [
    { "vendedor": "Fulano", "valor": 99.90 },
    { "vendedor": "Fulano", "valor": 350.00 },
    { "vendedor": "Ciclana", "valor": 1200.00 }
  ]
}`;

interface ModalProps {
  ref: Ref<HTMLDialogElement>;
  onCalculado: (dados: RelatorioComissoes) => void;
}

function ModalImportar({ ref, onCalculado }: ModalProps) {
  const [texto, setTexto] = useState(EXEMPLO);
  const [erros, setErros] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  async function lerArquivo(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setTexto(await arquivo.text());
    setErros([]);
  }

  async function calcular() {
    let vendas: Venda[];

    try {
      const json = JSON.parse(texto);
      // aceita tanto { "vendas": [...] } quanto o array direto
      vendas = Array.isArray(json) ? json : json.vendas;
    } catch (e) {
      setErros([`O texto não é um JSON válido (${(e as Error).message})`]);
      return;
    }

    setEnviando(true);
    try {
      onCalculado(await api.calcularComissoes(vendas));
      setErros([]);
    } catch (e) {
      if (e instanceof ErroApi && e.detalhes.length) {
        setErros(e.detalhes.map((d) => descreverCampo(d.campo) + d.mensagem));
      } else {
        setErros([(e as Error).message]);
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <dialog ref={ref} className="modal" aria-labelledby="titulo-importar" closedby="any">
      <header className="modal__cabecalho">
        <h2 id="titulo-importar">Importar vendas</h2>
        <form method="dialog">
          <button className="modal__fechar" aria-label="Fechar">
            ×
          </button>
        </form>
      </header>

      <div className="modal__corpo">
        <div className="campo">
          <label htmlFor="arquivo-json">Arquivo .json</label>
          <input id="arquivo-json" type="file" accept=".json,application/json" onChange={lerArquivo} />
        </div>

        <div className="campo">
          <label htmlFor="json-vendas">Ou cole o conteúdo</label>
          <textarea
            id="json-vendas"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            spellCheck={false}
            rows={11}
          />
          <small className="dica">
            Mesmo formato do enunciado: {'{ "vendas": [{ "vendedor": "...", "valor": 0 }] }'}
          </small>
        </div>

        {erros.length > 0 && (
          <ul className="alerta alerta--erro">
            {erros.slice(0, 5).map((erro) => (
              <li key={erro}>{erro}</li>
            ))}
          </ul>
        )}
      </div>

      <footer className="modal__rodape">
        <form method="dialog">
          <button className="botao botao--secundario">Cancelar</button>
        </form>
        <button className="botao" onClick={calcular} disabled={enviando}>
          {enviando ? "Calculando…" : "Calcular"}
        </button>
      </footer>
    </dialog>
  );
}

// "vendas.2.valor" -> "Venda 3, valor: "
function descreverCampo(campo: string) {
  const [, indice, propriedade] = campo.split(".");
  if (indice === undefined) return "";
  return `Venda ${formatarNumero(Number(indice) + 1)}, ${propriedade}: `;
}
