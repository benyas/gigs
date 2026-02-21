'use client';

import { useRouter } from 'next/navigation';
import { locales, localeNames, type Locale } from '@/i18n/config';

export function LanguageSwitcher({ current }: { current: string }) {
  const router = useRouter();

  function switchLocale(locale: Locale) {
    document.cookie = `locale=${locale};path=/;max-age=31536000`;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    router.refresh();
  }

  return (
    <select
      value={current}
      onChange={(e) => switchLocale(e.target.value as Locale)}
      className="form-input"
      style={{
        width: 'auto',
        padding: '0.25rem 0.5rem',
        fontSize: '0.8rem',
        border: '1px solid var(--gray-200)',
        borderRadius: 'var(--radius-sm)',
        background: 'transparent',
        cursor: 'pointer',
      }}
      aria-label="Language"
    >
      {locales.map((l) => (
        <option key={l} value={l}>
          {localeNames[l]}
        </option>
      ))}
    </select>
  );
}
