import type { ReactNode } from "react";

interface Props {
  titulo: string;
  descricao: string;
  acoes?: ReactNode;
}

export function TituloPagina({ titulo, descricao, acoes }: Props) {
  return (
    <div className="titulo-pagina">
      <div>
        <h1>{titulo}</h1>
        <p>{descricao}</p>
      </div>
      {acoes && <div className="titulo-pagina__acoes">{acoes}</div>}
    </div>
  );
}
