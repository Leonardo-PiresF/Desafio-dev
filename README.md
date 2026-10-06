# Desafio Dev

Resolução do desafio técnico com os três exercícios: comissão de vendedores, movimentação de estoque e cálculo de juros por atraso.

As regras ficam numa API em **Node + Express + TypeScript** e tem um front em **React + Vite** pra usar tudo pelo navegador.

**Online:** [front](https://SEU-FRONT.vercel.app) · [API](https://SUA-API.vercel.app/api/saude)

## Como rodar

Precisa do Node 20 ou mais novo.

```bash
npm run setup   # instala as dependências da raiz, da API e do front
npm run dev     # sobe a API em :3333 e o front em :5173
```

Depois é só abrir http://localhost:5173.

Outros comandos:

```bash
npm test                         # testes da API (Vitest + Supertest)
npm run comissoes --prefix server                     # exercício 1 direto no terminal
npm run comissoes --prefix server -- outro-arquivo.json
```

## Estrutura

```
server/
  src/
    comissoes/   regra de comissão, rotas e versão de terminal
    estoque/     classe Estoque, armazenamento em arquivo e rotas
    juros/       cálculo de juros e rota
    shared/      helpers de dinheiro e tratamento de erros
    data/        JSONs do enunciado
web/
  src/
    pages/       uma página por exercício
    api.ts       chamadas pra API
```

Cada exercício tem a regra separada da rota. A função que calcula não sabe nada de Express, o que deixa os testes simples e permitiu reaproveitar a regra de comissão no script de terminal.

## Exercício 1: Comissões

`GET /api/comissoes` calcula em cima do JSON do enunciado.
`POST /api/comissoes` recebe outro JSON no mesmo formato (`{ "vendas": [...] }`). No front dá pra colar ou carregar um arquivo.

| Valor da venda           | Comissão |
| ------------------------ | -------- |
| abaixo de R$ 100,00      | 0%       |
| de R$ 100,00 a R$ 499,99 | 1%       |
| a partir de R$ 500,00    | 5%       |

Resultado com os dados do enunciado:

| Vendedor        | Vendas | Total vendido | Comissão  |
| --------------- | -----: | ------------: | --------: |
| João Silva      |     10 |  R$ 10.754,70 | R$ 495,69 |
| Maria Souza     |      9 |   R$ 9.874,30 | R$ 465,96 |
| Ana Lima        |      9 |   R$ 8.763,95 | R$ 404,99 |
| Carlos Oliveira |      8 |   R$ 7.928,35 | R$ 379,38 |

## Exercício 2: Estoque

| Método | Rota                                   | O que faz                               |
| ------ | -------------------------------------- | --------------------------------------- |
| GET    | `/api/estoque/produtos`                | lista os produtos com o estoque atual   |
| GET    | `/api/estoque/movimentacoes?produto=101` | histórico (o filtro é opcional)       |
| POST   | `/api/estoque/movimentacoes`           | lança uma entrada ou saída              |
| POST   | `/api/estoque/restaurar`               | volta pro estoque do enunciado          |

Exemplo de movimentação:

```json
{ "codigoProduto": 101, "tipo": "saida", "quantidade": 20, "descricao": "Venda no balcão" }
```

A resposta traz a movimentação com o número dela e o estoque final:

```json
{
  "movimentacao": { "id": 1, "tipo": "saida", "quantidade": 20, "estoqueAnterior": 150, "estoqueFinal": 130, ... },
  "produto": { "codigoProduto": 101, "descricaoProduto": "Caneta Azul", "estoque": 130 },
  "mensagem": "Movimentação #1 registrada. Estoque final de Caneta Azul: 130"
}
```

## Exercício 3: Juros

`GET /api/juros?valor=1500&vencimento=2026-09-20`

```json
{ "valorOriginal": 1500, "diasEmAtraso": 15, "taxaDiaria": 2.5, "juros": 562.5, "valorAtualizado": 2062.5, ... }
```

Também aceita `dataCalculo` pra simular outro dia no lugar de hoje.

## Decisões que tomei

Algumas coisas o enunciado deixa em aberto, então explico o que escolhi:

- **Dinheiro em centavos.** Todas as contas são feitas com inteiros pra não ter erro de ponto flutuante (o clássico `0.1 + 0.2`).
- **Limites das faixas.** "Abaixo de R$ 100" não inclui o 100, então uma venda de R$ 100,00 já ganha 1%. Do mesmo jeito, R$ 500,00 já ganha 5% (o Carlos tem uma venda exatamente nesse valor).
- **Arredondamento da comissão.** Arredondo venda por venda, que é como apareceria num extrato pro vendedor, e o total é a soma disso.
- **Juros simples.** O enunciado fala em "multa de 2,5% ao dia" e pede o valor dos juros, então tratei como juros simples de 2,5% ao dia sobre o valor original. Se pagar no dia do vencimento ou antes, não tem juros.
- **"Hoje" no fuso de Brasília.** O servidor normalmente roda em UTC, e depois das 21h ele já estaria no dia seguinte. A data é calculada com `America/Sao_Paulo`.
- **Saída maior que o estoque** é recusada com `409` e o estoque não muda. O front já avisa antes de enviar.
- **Número da movimentação** é sequencial e continua de onde parou mesmo depois de reiniciar a API.
- **Persistência em arquivo JSON.** Pro tamanho do desafio não achei que valia subir um banco. O estoque e o histórico ficam em `server/estoque.db.json`, e a classe `Estoque` recebe o armazenamento por parâmetro, então trocar por um banco depois seria criar outra implementação de `Armazenamento`.
- **Validação com Zod** nas rotas, com mensagens em português. Erro de validação volta `400` com o campo e o motivo.

## Deploy

API e front são dois projetos na Vercel apontando pro mesmo repositório:

1. **API:** Root Directory `server`. A Vercel reconhece o Express sozinha pelo `src/index.ts`. Variável `CORS_ORIGIN` com a URL do front.
2. **Front:** Root Directory `web`, preset Vite. Variável `VITE_API_URL` com a URL da API.

Na Vercel o arquivo do estoque fica em `/tmp`, que é temporário. Então online as movimentações podem sumir depois de um tempo sem uso. Localmente ficam salvas.
