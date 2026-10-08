// eslint.config.mjs — ESLint 9 flat config (E0-S08-B2a, D65)
// Migration legacy .eslintrc.json → flat config.
// eslint-config-next@15.5.27 conservé temporairement (migré en B2b).
// Contenu fourni par le Superviseur — R21, remplacement/création à l'identique.

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  // Ignores globaux — convertis depuis .eslintignore (9 entrées)
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',
      'src-tauri/target/**',
      '**/*.config.js',
      '**/*.config.ts',
      'coverage/**',
      'next-env.d.ts',
    ],
  },

  // Configs legacy chargées via FlatCompat :
  //   - next/core-web-vitals (eslint-config-next@15.5.27)
  //   - plugin:@typescript-eslint/recommended (@typescript-eslint/eslint-plugin@8.71.1)
  //   - prettier (eslint-config-prettier@10.1.8)
  ...compat.extends(
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ),

  // Parser TypeScript pour les fichiers TS/TSX
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
  },
];
