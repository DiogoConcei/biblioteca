import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import importX from 'eslint-plugin-import-x';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist', 'src-tauri', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      // O pacote "globals" traz todas as variáveis nativas (window, document, fetch, etc)
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'import-x': importX,
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: true,
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // --- REGRAS DO REACT ---
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // --- REGRAS DO TYPESCRIPT ---
      '@typescript-eslint/no-explicit-any': 'warn',
      // Permite variáveis não usadas SE elas começarem com underline (ex: _props)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // --- REGRAS DE IMPORTAÇÃO ---
      'import-x/no-named-as-default-member': 'off',
      'import-x/extensions': 'off',
      'import-x/order': [
        'error', // Transforma em erro para obrigar a correção automática na IDE
        {
          groups: [
            'builtin', // Bibliotecas nativas do Node (ex: fs, path)
            'external', // Pacotes do npm (ex: react, framer-motion)
            'internal', // Aliases do seu projeto (ex: @/components)
            ['parent', 'sibling', 'index'], // Imports relativos (ex: ../, ./)
            'object',
            'type', // Tipagens do TS (ex: import type { User })
          ],
          pathGroups: [
            {
              // Força o React a ser sempre a primeiríssima importação do arquivo
              pattern: 'react',
              group: 'builtin',
              position: 'before',
            },
          ],
          pathGroupsExcludedImportTypes: ['react'],
          'newlines-between': 'always',
          // Adiciona ordem alfabética dentro dos grupos
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },
  // O Prettier TEM que ser sempre a última configuração do array para sobrescrever conflitos
  eslintConfigPrettier,
);
