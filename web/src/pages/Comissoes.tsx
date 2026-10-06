import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { api, ErroApi } from "../api";
import { CabecalhoPagina } from "../components/CabecalhoPagina";
import type { RelatorioComissoes, ResumoVendedor, Venda } from "../types";
import { formatarMoeda, formatarPorcentagem, plural } from "../utils/formatar";

const FAIXAS = [
  { percentual: 0, descricao: "Abaixo de R$ 100" },
  { percentual: 1, descricao: "De R$ 100 a R$ 499,99" },
  { percentual: 5, descricao: "A partir de R$ 500" },
];

export default function Comissoes() {
  const [relatorio, setRelatorio] = useState<RelatorioComissoes | null>(null);
  const [erro, setErro] = useState("");
  const [usandoJsonProprio, setUsandoJsonProprio] = useState(false);
  const [abrirEditor, setAbrirEditor] = useState(false);

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
      <CabecalhoPagina
        numero="01"
        titulo="Comissões"
        acoes={
          <button className="botao botao--secundario" onClick={() => setAbrirEditor((aberto) => !aberto)}>
            {abrirEditor ? "Fechar editor" : "Usar outro JSON"}
          </button>
        }
      >
        <p>Lê as vendas do time comercial e calcula a comissão de cada vendedor, venda a venda.</p>
        <ul className="faixas" aria-label="Regras de comissão">
          {FAIXAS.map((faixa) => (
            <li key={faixa.percentual}>
              <span className={`etiqueta faixa--${faixa.percentual}`}>{faixa.percentual}%</span>
              {faixa.descricao}
            </li>
          ))}
        </ul>
      </CabecalhoPagina>

      {abrirEditor && (
        <EditorJson
          onCalculado={(dados) => {
            setRelatorio(dados);
            setUsandoJsonProprio(true);
            setAbrirEditor(false);
          }}
        />
      )}

      {erro && <p className="aviso aviso--erro">{erro}</p>}

      {usandoJsonProprio && (
        <p className="aviso">
          Mostrando o cálculo do JSON que você enviou.{" "}
          <button className="link" onClick={carregarEnunciado}>
            Voltar para os dados do enunciado
          </button>
        </p>
      )}

      {relatorio ? <Relatorio relatorio={relatorio} /> : !erro && <p className="carregando">Calculando…</p>}
    </>
  );
}

function Relatorio({ relatorio }: { relatorio: RelatorioComissoes }) {
  const { resumo, vendedores } = relatorio;
  const [aberto, setAberto] = useState<string | null>(null);
  const taxaMedia = resumo.totalVendido ? resumo.totalComissao / resumo.totalVendido : 0;

  return (
    <>
      <dl className="indicadores">
        <div>
          <dt>Total vendido</dt>
          <dd>{formatarMoeda(resumo.totalVendido)}</dd>
        </div>
        <div className="indicadores__destaque">
          <dt>Comissões a pagar</dt>
          <dd>{formatarMoeda(resumo.totalComissao)}</dd>
        </div>
        <div>
          <dt>Vendas</dt>
          <dd>
            {resumo.quantidadeVendas}
            <small> de {plural(resumo.quantidadeVendedores, "vendedor", "vendedores")}</small>
          </dd>
        </div>
        <div>
          <dt>Taxa efetiva</dt>
          <dd>{formatarPorcentagem(taxaMedia)}</dd>
        </div>
      </dl>

      <section className="cartao">
        <table className="tabela tabela--vendedores">
          <thead>
            <tr>
              <th scope="col">Vendedor</th>
              <th scope="col" className="numero">
                Vendas
              </th>
              <th scope="col">Por faixa</th>
              <th scope="col" className="numero">
                Total vendido
              </th>
              <th scope="col" className="numero">
                Comissão
              </th>
            </tr>
          </thead>
          {vendedores.map((vendedor, posicao) => (
            <LinhaVendedor
              key={vendedor.vendedor}
              posicao={posicao + 1}
              vendedor={vendedor}
              aberto={aberto === vendedor.vendedor}
              onAlternar={() => setAberto((atual) => (atual === vendedor.vendedor ? null : vendedor.vendedor))}
            />
          ))}
        </table>
      </section>
    </>
  );
}

interface LinhaVendedorProps {
  posicao: number;
  vendedor: ResumoVendedor;
  aberto: boolean;
  onAlternar: () => void;
}

function LinhaVendedor({ posicao, vendedor, aberto, onAlternar }: LinhaVendedorProps) {
  const idDetalhes = `vendas-${posicao}`;
  // maior venda primeiro no detalhamento
  const vendas = [...vendedor.vendas].sort((a, b) => b.valor - a.valor);

  return (
    // um tbody por vendedor deixa a linha de detalhes junto da linha principal
    <tbody className={aberto ? "aberto" : undefined}>
      <tr className="linha-vendedor">
        <th scope="row">
          <button className="linha-vendedor__botao" onClick={onAlternar} aria-expanded={aberto} aria-controls={idDetalhes}>
            <span className="linha-vendedor__posicao">{posicao}º</span>
            {vendedor.vendedor}
            <span className="seta" aria-hidden="true" />
          </button>
        </th>
        <td className="numero">{vendedor.quantidadeVendas}</td>
        <td>
          <BarraFaixas vendedor={vendedor} />
        </td>
        <td className="numero">{formatarMoeda(vendedor.totalVendido)}</td>
        <td className="numero forte">{formatarMoeda(vendedor.totalComissao)}</td>
      </tr>

      <tr className="detalhes" id={idDetalhes} hidden={!aberto}>
        <td colSpan={5}>
          <ol className="lista-vendas">
            {vendas.map((venda, i) => (
              <li key={i}>
                <span className="lista-vendas__valor">{formatarMoeda(venda.valor)}</span>
                <span className={`etiqueta faixa--${venda.percentual}`}>{venda.percentual}%</span>
                <span className="lista-vendas__comissao">
                  {venda.comissao ? `+ ${formatarMoeda(venda.comissao)}` : "sem comissão"}
                </span>
              </li>
            ))}
          </ol>
        </td>
      </tr>
    </tbody>
  );
}

function BarraFaixas({ vendedor }: { vendedor: ResumoVendedor }) {
  const contagem = FAIXAS.map((faixa) => ({
    ...faixa,
    quantidade: vendedor.vendas.filter((v) => v.percentual === faixa.percentual).length,
  }));

  const legenda = contagem.map((f) => `${f.quantidade} com ${f.percentual}%`).join(", ");

  return (
    <div className="barra-faixas" role="img" aria-label={legenda} title={legenda}>
      {contagem.map(
        (f) =>
          f.quantidade > 0 && (
            <span key={f.percentual} className={`faixa--${f.percentual}`} style={{ flexGrow: f.quantidade }}>
              {f.quantidade}
            </span>
          ),
      )}
    </div>
  );
}

const EXEMPLO = `{
  "vendas": [
    { "vendedor": "Fulano", "valor": 99.90 },
    { "vendedor": "Fulano", "valor": 350.00 },
    { "vendedor": "Ciclana", "valor": 1200.00 }
  ]
}`;

function EditorJson({ onCalculado }: { onCalculado: (dados: RelatorioComissoes) => void }) {
  const [texto, setTexto] = useState(EXEMPLO);
  const [erros, setErros] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const arquivoRef = useRef<HTMLInputElement>(null);

  async function lerArquivo(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setTexto(await arquivo.text());
    setErros([]);
    e.target.value = "";
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
    <section className="cartao editor-json">
      <div className="editor-json__topo">
        <label htmlFor="json-vendas">Cole as vendas no mesmo formato do enunciado</label>
        <button className="link" onClick={() => arquivoRef.current?.click()}>
          ou carregue um arquivo .json
        </button>
        <input ref={arquivoRef} type="file" accept=".json,application/json" hidden onChange={lerArquivo} />
      </div>

      <textarea
        id="json-vendas"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        spellCheck={false}
        rows={10}
        aria-describedby={erros.length ? "erros-json" : undefined}
      />

      {erros.length > 0 && (
        <ul id="erros-json" className="aviso aviso--erro">
          {erros.slice(0, 5).map((erro) => (
            <li key={erro}>{erro}</li>
          ))}
        </ul>
      )}

      <button className="botao" onClick={calcular} disabled={enviando}>
        {enviando ? "Calculando…" : "Calcular comissões"}
      </button>
    </section>
  );
}

// "vendas.2.valor" -> "Venda 3, valor: "
function descreverCampo(campo: string) {
  const [, indice, propriedade] = campo.split(".");
  if (indice === undefined) return "";
  return `Venda ${Number(indice) + 1}, ${propriedade}: `;
}
