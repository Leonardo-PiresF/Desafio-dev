import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { DadosEstoque } from "./estoque";

export interface Armazenamento {
  ler(): DadosEstoque | null;
  gravar(dados: DadosEstoque): void;
}

// Guarda tudo num arquivo .json. Pro tamanho do desafio resolve bem
// e evita depender de banco pra rodar o projeto.
export class ArquivoJson implements Armazenamento {
  constructor(private caminho: string) {}

  ler() {
    if (!existsSync(this.caminho)) return null;

    try {
      return JSON.parse(readFileSync(this.caminho, "utf-8")) as DadosEstoque;
    } catch {
      console.warn(`Não consegui ler ${this.caminho}, começando com o estoque inicial`);
      return null;
    }
  }

  gravar(dados: DadosEstoque) {
    writeFileSync(this.caminho, JSON.stringify(dados, null, 2));
  }
}

// usado nos testes
export class EmMemoria implements Armazenamento {
  private dados: DadosEstoque | null = null;

  ler() {
    return this.dados ? structuredClone(this.dados) : null;
  }

  gravar(dados: DadosEstoque) {
    this.dados = structuredClone(dados);
  }
}
