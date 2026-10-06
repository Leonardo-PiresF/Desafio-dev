import type { ReactNode } from "react";

interface Props {
  numero: string;
  titulo: string;
  children: ReactNode;
  acoes?: ReactNode;
}

export function CabecalhoPagina({ numero, titulo, children, acoes }: Props) {
  return (
    <header className="cabecalho">
      <div>
        <p className="cabecalho__numero">Exercício {numero}</p>
        <h1>{titulo}</h1>
        <div className="cabecalho__texto">{children}</div>
      </div>
      {acoes && <div className="cabecalho__acoes">{acoes}</div>}
    </header>
  );
}
