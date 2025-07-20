import { ReactNode } from 'react';
import Providers from '../components/Providers';

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
