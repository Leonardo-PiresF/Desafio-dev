import type { ReactNode } from "react";

interface Props {
  titulo: string;
  acoes?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Painel({ titulo, acoes, children, className = "" }: Props) {
  return (
    <section className={`painel ${className}`}>
      <header className="painel__cabecalho">
        <h2>{titulo}</h2>
        {acoes}
      </header>
      {children}
    </section>
  );
}
