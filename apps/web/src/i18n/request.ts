import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { defaultLocale, locales, type Locale } from './config';
import fr from '../../messages/fr.json';
import ar from '../../messages/ar.json';
import en from '../../messages/en.json';

const messages: Record<Locale, typeof fr> = { fr, ar, en };

export default getRequestConfig(async () => {
  const cookieStore = cookies();
  const headerStore = headers();

  // Priority: cookie > Accept-Language > default
  let locale: Locale = defaultLocale;

  const cookieLocale = (cookieStore as any).get?.('locale')?.value as Locale | undefined;
  if (cookieLocale && locales.includes(cookieLocale)) {
    locale = cookieLocale;
  } else {
    const acceptLang = (headerStore as any).get?.('accept-language') || '';
    for (const l of locales) {
      if (acceptLang.includes(l)) {
        locale = l;
        break;
      }
    }
  }

  return {
    locale,
    messages: messages[locale],
  };
});
