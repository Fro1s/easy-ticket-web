import { defineConfig } from 'orval';

export default defineConfig({
  easyTicket: {
    input: {
      target: 'http://localhost:3001/docs/json',
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
