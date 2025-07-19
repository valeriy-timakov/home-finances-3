import Providers from '../components/Providers';
import { ReactNode } from 'react';
import ClientLayout from "../components/ClientLayout";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uk">
      <body>
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
