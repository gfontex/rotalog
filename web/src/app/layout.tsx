import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RotaLog • Controle de Frotas, Check List & Ponto CLT',
  description: 'Painel Executivo RotaLog — Controle de Frotas, Check List Veicular, Gestão de Motoristas e Ponto Eletrônico CLT',
  icons: {
    icon: '/logo-rotalog.jpg',
    apple: '/logo-rotalog.jpg',
  },
};

const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('@rotalog:theme');
    var allowed = ['rotalog-navy', 'titanium-light'];
    var theme = saved && allowed.indexOf(saved) !== -1 ? saved : 'rotalog-navy';
    document.documentElement.setAttribute('data-theme', theme);
    var isLight = theme === 'titanium-light';
    if (isLight) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    var meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.setAttribute('content', isLight ? 'light' : 'dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" data-theme="rotalog-navy" className="dark" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark light" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
