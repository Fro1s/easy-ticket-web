import type { CSSProperties } from 'react';

/**
 * Resolve o `posterUrl` de um evento para um estilo de background.
 * - URL de imagem (http(s):// ou caminho /...) → vira background-image cover/center.
 * - Qualquer outra coisa (gradiente CSS do seed) → usada como `background` cru.
 * - Vazio/nulo → fallback neutro (cor de card do tema).
 */
export function posterStyle(posterUrl: string | null | undefined): CSSProperties {
  const value = posterUrl?.trim();
  if (!value) {
    return { background: 'var(--card, #11111A)' };
  }
  const isImageUrl =
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('/');
  if (isImageUrl) {
    return {
      backgroundImage: `url("${value}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return { background: value };
}
