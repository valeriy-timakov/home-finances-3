import { ReactNode } from 'react';
import Providers from '../components/Providers';
import '../styles/globals.css';

interface Props {
  children: ReactNode;
}

// Root layout – wraps the whole app once.
export default function RootLayout({ children }: Props) {
  return (
    <html lang="uk">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
