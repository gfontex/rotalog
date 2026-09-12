import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ROTALOG • Gestão de Frotas & Ponto CLT',
  description: 'Painel Executivo de Gestão de Frotas, Tropas Operacionais, Checklist de Veículos e Ponto Eletrônico CLT',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-[#0B1120] text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
