'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { gigs } from '@/lib/api';

interface Suggestion {
  title: string;
  slug: string;
  category?: string;
  city?: string;
}

interface Props {
  defaultValue?: string;
  placeholder?: string;
  name?: string;
  style?: React.CSSProperties;
  className?: string;
}

export function SearchAutocomplete({ defaultValue = '', placeholder, name = 'q', style, className }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const data = await gigs.suggestions(value);
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        setResults([]);
        setOpen(false);
      }
    }, 250);
  }

  function handleSelect(suggestion: Suggestion) {
    setOpen(false);
    setQuery(suggestion.title);
    router.push(`/gig/${suggestion.slug}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', ...style }}>
      <input
        type="text"
        name={name}
        className={className || 'form-input'}
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          zIndex: 100,
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          maxHeight: 320,
          overflowY: 'auto',
          animation: 'dropdownIn 0.15s ease-out',
        }}>
          {results.map((item, i) => (
            <div
              key={item.slug}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setActiveIndex(i)}
              style={{
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                background: i === activeIndex ? 'var(--primary-50)' : 'transparent',
                borderBottom: i < results.length - 1 ? '1px solid var(--border-light)' : 'none',
                transition: 'background 100ms ease',
              }}
            >
              <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--gray-900)' }}>{item.title}</div>
              <div style={{ fontSize: '0.775rem', color: 'var(--gray-400)', marginTop: '0.125rem' }}>
                {item.category}{item.city ? ` · ${item.city}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
