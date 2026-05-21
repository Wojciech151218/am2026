import {defineConfig} from 'drizzle-kit';

export default defineConfig({
  schema: './src/entities/index.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
});
