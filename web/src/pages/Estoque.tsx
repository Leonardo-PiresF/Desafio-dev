import { useEffect, useState, type FormEvent } from "react";
import { api, ErroApi } from "../api";
import { CabecalhoPagina } from "../components/CabecalhoPagina";
import type { Movimentacao, Produto, TipoMovimentacao } from "../types";
import { formatarDataHora, formatarNumero } from "../utils/formatar";

const SUGESTOES: Record<TipoMovimentacao, string[]> = {
  entrada: ["Compra de fornecedor", "Devolução de cliente", "Transferência recebida", "Ajuste de inventário"],
  saida: ["Venda", "Transferência para filial", "Avaria / perda", "Uso interno", "Ajuste de inventário"],
};

export default function Estoque() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const [atualizado, setAtualizado] = useState<number | null>(null);
  // muda quando o estoque é restaurado, pra limpar o formulário
  const [versao, setVersao] = useState(0);
  const [erro, setErro] = useState("");

  function carregar() {
    return Promise.all([api.produtos(), api.movimentacoes()])
      .then(([listaProdutos, listaMovimentacoes]) => {
        setProdutos(listaProdutos);
        setMovimentacoes(listaMovimentacoes);
        setSelecionado((atual) => atual ?? listaProdutos[0]?.codigoProduto ?? null);
        setErro("");
      })
      .catch((e: Error) => setErro(e.message));
  }

  useEffect(() => {
    carregar();
  }, []);

  function aoMovimentar(movimentacao: Movimentacao, produto: Produto) {
    setProdutos((lista) => lista.map((p) => (p.codigoProduto === produto.codigoProduto ? produto : p)));
    setMovimentacoes((lista) => [movimentacao, ...lista]);
    setAtualizado(produto.codigoProduto);
  }

  const produtoSelecionado = produtos.find((p) => p.codigoProduto === selecionado);

  return (
    <>
      <CabecalhoPagina numero="02" titulo="Estoque" acoes={
          <BotaoRestaurar
            onRestaurado={() => {
              setVersao((v) => v + 1);
              setAtualizado(null);
              carregar();
            }}
          />
        }>
        <p>
          Lança entradas e saídas no depósito. Cada movimentação recebe um número único, uma descrição e devolve a
          quantidade final do produto.
        </p>
      </CabecalhoPagina>

      {erro && <p className="aviso aviso--erro">{erro}</p>}

      <div className="estoque">
        <section aria-labelledby="titulo-produtos">
          <h2 id="titulo-produtos" className="subtitulo">
            Produtos
          </h2>
          <ul className="produtos">
            {produtos.map((produto) => (
              <li key={produto.codigoProduto}>
                <button
                  className="produto"
                  aria-pressed={produto.codigoProduto === selecionado}
                  onClick={() => setSelecionado(produto.codigoProduto)}
                >
                  <span className="produto__codigo">#{produto.codigoProduto}</span>
                  <span className="produto__nome">{produto.descricaoProduto}</span>
                  <span
                    // a key muda a cada movimentação pra animação rodar de novo
                    key={produto.codigoProduto === atualizado ? movimentacoes[0]?.id : undefined}
                    className={`produto__qtd ${produto.codigoProduto === atualizado ? "produto__qtd--mudou" : ""}`}
                  >
                    {formatarNumero(produto.estoque)}
                    <small>un.</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {produtoSelecionado && (
          <FormMovimentacao
            key={versao}
            produtos={produtos}
            produto={produtoSelecionado}
            onTrocarProduto={setSelecionado}
            onMovimentado={aoMovimentar}
          />
        )}
      </div>

      <Historico movimentacoes={movimentacoes} produtos={produtos} />
    </>
  );
}

interface FormProps {
  produtos: Produto[];
  produto: Produto;
  onTrocarProduto: (codigo: number) => void;
  onMovimentado: (movimentacao: Movimentacao, produto: Produto) => void;
}

function FormMovimentacao({ produtos, produto, onTrocarProduto, onMovimentado }: FormProps) {
  const [tipo, setTipo] = useState<TipoMovimentacao>("entrada");
  const [quantidade, setQuantidade] = useState("");
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [ultima, setUltima] = useState<{ movimentacao: Movimentacao; produto: Produto } | null>(null);
  // recria os campos depois de cada envio, senão o navegador marca
  // quantidade e descrição como inválidas assim que elas são limpas
  const [envios, setEnvios] = useState(0);

  const qtd = Number(quantidade);
  const qtdValida = Number.isInteger(qtd) && qtd > 0;
  const semSaldo = tipo === "saida" && qtd > produto.estoque;
  const previsao = tipo === "entrada" ? produto.estoque + qtd : produto.estoque - qtd;

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (semSaldo) return;

    setEnviando(true);
    setErro("");

    try {
      const resposta = await api.movimentar({
        codigoProduto: produto.codigoProduto,
        tipo,
        quantidade: qtd,
        descricao,
      });
      onMovimentado(resposta.movimentacao, resposta.produto);
      setUltima(resposta);
      setQuantidade("");
      setDescricao("");
      setEnvios((n) => n + 1);
    } catch (e) {
      const mensagem = e instanceof ErroApi && e.detalhes.length ? e.detalhes[0].mensagem : (e as Error).message;
      setErro(mensagem);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="cartao form-movimentacao" onSubmit={enviar} aria-labelledby="titulo-form">
      <h2 id="titulo-form" className="subtitulo">
        Nova movimentação
      </h2>

      <div className="campo">
        <label htmlFor="produto">Produto</label>
        <select
          id="produto"
          value={produto.codigoProduto}
          onChange={(e) => {
            onTrocarProduto(Number(e.target.value));
            setUltima(null);
          }}
        >
          {produtos.map((p) => (
            <option key={p.codigoProduto} value={p.codigoProduto}>
              {p.codigoProduto} · {p.descricaoProduto}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="campo">
        <legend>Tipo</legend>
        <div className="alternador">
          {(["entrada", "saida"] as const).map((opcao) => (
            <label key={opcao} className={`alternador__opcao alternador__opcao--${opcao}`}>
              <input
                type="radio"
                name="tipo"
                value={opcao}
                checked={tipo === opcao}
                onChange={() => setTipo(opcao)}
              />
              {opcao === "entrada" ? "Entrada" : "Saída"}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="campo">
        <label htmlFor="quantidade">Quantidade</label>
        <input
          key={`quantidade-${envios}`}
          id="quantidade"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          max={tipo === "saida" ? produto.estoque : undefined}
          required
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          aria-describedby="previsao"
        />
        <p id="previsao" className={`previsao ${semSaldo ? "previsao--erro" : ""}`} aria-live="polite">
          {semSaldo
            ? `Só há ${formatarNumero(produto.estoque)} un. em estoque`
            : qtdValida && (
                <>
                  {formatarNumero(produto.estoque)} → <strong>{formatarNumero(previsao)}</strong> un. após a{" "}
                  {tipo === "entrada" ? "entrada" : "saída"}
                </>
              )}
        </p>
      </div>

      <div className="campo">
        <label htmlFor="descricao">Descrição</label>
        <input
          key={`descricao-${envios}`}
          id="descricao"
          list="sugestoes-descricao"
          required
          minLength={3}
          maxLength={80}
          placeholder={SUGESTOES[tipo][0]}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <datalist id="sugestoes-descricao">
          {SUGESTOES[tipo].map((sugestao) => (
            <option key={sugestao} value={sugestao} />
          ))}
        </datalist>
      </div>

      {erro && <p className="aviso aviso--erro">{erro}</p>}

      <button className="botao" disabled={enviando || semSaldo}>
        {enviando ? "Registrando…" : `Registrar ${tipo === "entrada" ? "entrada" : "saída"}`}
      </button>

      {ultima && (
        <p className="recibo" role="status">
          Movimentação <strong>#{ultima.movimentacao.id}</strong> registrada. Estoque final de{" "}
          {ultima.produto.descricaoProduto}: <strong>{formatarNumero(ultima.movimentacao.estoqueFinal)} un.</strong>
        </p>
      )}
    </form>
  );
}

function Historico({ movimentacoes, produtos }: { movimentacoes: Movimentacao[]; produtos: Produto[] }) {
  const [filtro, setFiltro] = useState("");

  const nomeDoProduto = (codigo: number) => produtos.find((p) => p.codigoProduto === codigo)?.descricaoProduto ?? codigo;
  const lista = filtro ? movimentacoes.filter((m) => m.codigoProduto === Number(filtro)) : movimentacoes;

  return (
    <section className="cartao historico" aria-labelledby="titulo-historico">
      <div className="historico__topo">
        <h2 id="titulo-historico" className="subtitulo">
          Histórico
        </h2>
        <select aria-label="Filtrar por produto" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="">Todos os produtos</option>
          {produtos.map((p) => (
            <option key={p.codigoProduto} value={p.codigoProduto}>
              {p.descricaoProduto}
            </option>
          ))}
        </select>
      </div>

      {lista.length === 0 ? (
        <p className="vazio">Nenhuma movimentação {filtro ? "para esse produto" : "registrada ainda"}.</p>
      ) : (
        <div className="rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th scope="col">Nº</th>
                <th scope="col">Data</th>
                <th scope="col">Produto</th>
                <th scope="col">Descrição</th>
                <th scope="col" className="numero">
                  Qtd.
                </th>
                <th scope="col" className="numero">
                  Estoque
                </th>
              </tr>
            </thead>
            <tbody>
              {lista.map((mov) => (
                <tr key={mov.id}>
                  <td className="mono">#{mov.id}</td>
                  <td className="suave">{formatarDataHora(mov.data)}</td>
                  <td>{nomeDoProduto(mov.codigoProduto)}</td>
                  <td>{mov.descricao}</td>
                  <td className={`numero quantidade--${mov.tipo}`}>
                    {mov.tipo === "entrada" ? "+" : "−"}
                    {formatarNumero(mov.quantidade)}
                  </td>
                  <td className="numero">
                    <span className="suave">{formatarNumero(mov.estoqueAnterior)} → </span>
                    {formatarNumero(mov.estoqueFinal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function BotaoRestaurar({ onRestaurado }: { onRestaurado: () => void }) {
  const [confirmando, setConfirmando] = useState(false);

  // se a pessoa não confirmar em alguns segundos, o botão volta ao normal
  useEffect(() => {
    if (!confirmando) return;
    const timer = setTimeout(() => setConfirmando(false), 4000);
    return () => clearTimeout(timer);
  }, [confirmando]);

  async function clicar() {
    if (!confirmando) {
      setConfirmando(true);
      return;
    }
    await api.restaurarEstoque();
    setConfirmando(false);
    onRestaurado();
  }

  return (
    <button className={`botao botao--secundario ${confirmando ? "botao--perigo" : ""}`} onClick={clicar}>
      {confirmando ? "Clique de novo para confirmar" : "Restaurar estoque inicial"}
    </button>
  );
}
