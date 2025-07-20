import { ReactNode } from 'react';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import ClientLayout from '../../components/ClientLayout';

interface Props {
  children: ReactNode;
  params: {locale: string};
}

export default async function LocaleLayout({children, params}: Props) {
  const { locale } = await params;
  console.log('Layout locale param:', locale);
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ClientLayout>{children}</ClientLayout>
    </NextIntlClientProvider>
  );
}

// Pre-render locale routes so they are included in the build
export function generateStaticParams() {
  return ['en', 'uk'].map((locale) => ({ locale }));
}

