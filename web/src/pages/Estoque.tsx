import { useEffect, useState, type FormEvent } from "react";
import { api, ErroApi } from "../api";
import { Painel } from "../components/Painel";
import { TituloPagina } from "../components/TituloPagina";
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
  const [ultimaMovimentacao, setUltimaMovimentacao] = useState<Movimentacao | null>(null);
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
    setUltimaMovimentacao(movimentacao);
  }

  function aoRestaurar() {
    setVersao((v) => v + 1);
    setUltimaMovimentacao(null);
    carregar();
  }

  const produtoSelecionado = produtos.find((p) => p.codigoProduto === selecionado);

  return (
    <>
      <TituloPagina
        titulo="Estoque"
        descricao="Entradas e saídas de mercadoria no depósito."
        acoes={<BotaoRestaurar onRestaurado={aoRestaurar} />}
      />

      {erro && <div className="alerta alerta--erro">{erro}</div>}

      <div className="grade-estoque">
        {produtoSelecionado && (
          <FormMovimentacao
            key={versao}
            produtos={produtos}
            produto={produtoSelecionado}
            onTrocarProduto={setSelecionado}
            onMovimentado={aoMovimentar}
          />
        )}

        <Painel titulo="Posição de estoque">
          <table className="tabela tabela--selecionavel">
            <thead>
              <tr>
                <th>Código</th>
                <th>Produto</th>
                <th className="numero">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto) => {
                const mudou = ultimaMovimentacao?.codigoProduto === produto.codigoProduto;
                return (
                  <tr
                    key={produto.codigoProduto}
                    className={produto.codigoProduto === selecionado ? "selecionada" : undefined}
                    onClick={() => setSelecionado(produto.codigoProduto)}
                  >
                    <td>{produto.codigoProduto}</td>
                    <td>{produto.descricaoProduto}</td>
                    <td className="numero">
                      {/* a key troca a cada movimentação pra animação rodar de novo */}
                      <span key={mudou ? ultimaMovimentacao.id : 0} className={mudou ? "saldo-alterado" : undefined}>
                        {formatarNumero(produto.estoque)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Painel>
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
  const [sucesso, setSucesso] = useState("");
  // recria os campos depois de cada envio, senão o navegador marca
  // quantidade e descrição como inválidas assim que elas são limpas
  const [envios, setEnvios] = useState(0);

  const qtd = Number(quantidade);
  const qtdValida = Number.isInteger(qtd) && qtd > 0;
  const semSaldo = tipo === "saida" && qtd > produto.estoque;
  const saldoPrevisto = tipo === "entrada" ? produto.estoque + qtd : produto.estoque - qtd;

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (semSaldo) return;

    setEnviando(true);
    setErro("");
    setSucesso("");

    try {
      const resposta = await api.movimentar({ codigoProduto: produto.codigoProduto, tipo, quantidade: qtd, descricao });
      onMovimentado(resposta.movimentacao, resposta.produto);
      setSucesso(resposta.mensagem);
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
    <Painel titulo="Lançar movimentação">
      <form className="formulario" onSubmit={enviar}>
        {sucesso && (
          <div className="alerta alerta--sucesso" role="status">
            {sucesso}
          </div>
        )}
        {erro && <div className="alerta alerta--erro">{erro}</div>}

        <div className="campo">
          <label htmlFor="produto">Produto</label>
          <select id="produto" value={produto.codigoProduto} onChange={(e) => onTrocarProduto(Number(e.target.value))}>
            {produtos.map((p) => (
              <option key={p.codigoProduto} value={p.codigoProduto}>
                {p.codigoProduto} - {p.descricaoProduto}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="campo">
          <legend>Tipo</legend>
          <div className="opcoes">
            <label>
              <input type="radio" name="tipo" checked={tipo === "entrada"} onChange={() => setTipo("entrada")} />
              Entrada
            </label>
            <label>
              <input type="radio" name="tipo" checked={tipo === "saida"} onChange={() => setTipo("saida")} />
              Saída
            </label>
          </div>
        </fieldset>

        <div className="linha-campos">
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
            />
          </div>
          <div className="campo">
            <span className="rotulo">Saldo após</span>
            <output className={`saldo-previsto ${semSaldo ? "saldo-previsto--erro" : ""}`} htmlFor="quantidade">
              {semSaldo ? "Insuficiente" : formatarNumero(qtdValida ? saldoPrevisto : produto.estoque)}
            </output>
          </div>
        </div>
        {semSaldo && <small className="texto-erro">Saldo insuficiente: há {formatarNumero(produto.estoque)} un.</small>}

        <div className="campo">
          <label htmlFor="descricao">Descrição</label>
          <input
            key={`descricao-${envios}`}
            id="descricao"
            list="sugestoes-descricao"
            required
            minLength={3}
            maxLength={80}
            placeholder={`Ex.: ${SUGESTOES[tipo][0]}`}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
          <datalist id="sugestoes-descricao">
            {SUGESTOES[tipo].map((sugestao) => (
              <option key={sugestao} value={sugestao} />
            ))}
          </datalist>
        </div>

        <button className="botao" disabled={enviando || semSaldo}>
          {enviando ? "Salvando…" : "Salvar movimentação"}
        </button>
      </form>
    </Painel>
  );
}

function Historico({ movimentacoes, produtos }: { movimentacoes: Movimentacao[]; produtos: Produto[] }) {
  const [filtro, setFiltro] = useState("");

  const nomeDoProduto = (codigo: number) =>
    produtos.find((p) => p.codigoProduto === codigo)?.descricaoProduto ?? codigo;
  const lista = filtro ? movimentacoes.filter((m) => m.codigoProduto === Number(filtro)) : movimentacoes;

  return (
    <Painel
      titulo="Movimentações"
      acoes={
        <select
          className="select-pequeno"
          aria-label="Filtrar por produto"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        >
          <option value="">Todos os produtos</option>
          {produtos.map((p) => (
            <option key={p.codigoProduto} value={p.codigoProduto}>
              {p.descricaoProduto}
            </option>
          ))}
        </select>
      }
    >
      {lista.length === 0 ? (
        <p className="vazio">Nenhuma movimentação {filtro ? "para esse produto" : "lançada"}.</p>
      ) : (
        <div className="rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Data</th>
                <th>Produto</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th className="numero">Qtd.</th>
                <th className="numero">Saldo anterior</th>
                <th className="numero">Saldo final</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((mov) => (
                <tr key={mov.id}>
                  <td>{mov.id}</td>
                  <td className="sem-quebra">{formatarDataHora(mov.data)}</td>
                  <td>{nomeDoProduto(mov.codigoProduto)}</td>
                  <td>
                    <span className={`selo selo--${mov.tipo}`}>{mov.tipo === "entrada" ? "Entrada" : "Saída"}</span>
                  </td>
                  <td>{mov.descricao}</td>
                  <td className="numero">{formatarNumero(mov.quantidade)}</td>
                  <td className="numero">{formatarNumero(mov.estoqueAnterior)}</td>
                  <td className="numero">
                    <strong>{formatarNumero(mov.estoqueFinal)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Painel>
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
    <button className={`botao ${confirmando ? "botao--perigo" : "botao--secundario"}`} onClick={clicar}>
      {confirmando ? "Confirmar restauração" : "Restaurar estoque inicial"}
    </button>
  );
}
