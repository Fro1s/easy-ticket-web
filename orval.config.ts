import { defineConfig } from 'orval';

export default defineConfig({
  easyTicket: {
    input: {
      // Porta 3001 por padrão; sobrescreva com API_DOCS_URL quando o backend
      // local estiver em outra porta.
      target:
        process.env.API_DOCS_URL ?? 'http://localhost:3001/docs/json',
    },
    output: {
      target: './src/generated/api.ts',
      client: 'react-query',
      mode: 'single',
      override: {
        mutator: {
          path: './src/lib/api.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useMutation: true,
        },
      },
    },
  },
});
