// eslint.config.mjs — ESLint 9 flat config (E0-S08-B2b', D69/D70)
// Migration Next 15 → 16 : eslint-config-next@16 est ESM avec exports map.
// FlatCompat est INCOMPATIBLE avec eslint-config-next@16 (structure circulaire
// dans les plugins — incident n°30). On importe donc la config native.
// FlatCompat est conservé UNIQUEMENT pour @typescript-eslint/recommended et
// prettier (configs legacy sans équivalent ESM natif direct).

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import next from 'eslint-config-next';
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

// D76 — le tableau est nommé avant l'export pour satisfaire
// import/no-anonymous-default-export (eslint-plugin-import).
const config = [
  // Ignores globaux — convertis depuis .eslintignore (9 entrées)
  // + e2e/** (D69 point 1 : fixtures Playwright, pas du code React — les
  // règles react-hooks ne s'appliquent pas à l'API base.extend de Playwright).
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
      'e2e/**',
    ],
  },

  // Config native eslint-config-next@16 (ESM) :
  //   - next[0] = 'next' (core-web-vitals : react, react-hooks, import,
  //     jsx-a11y, @next/next) sur **/*.{js,jsx,mjs,ts,tsx,mts,cts}
  //   - next[1] = 'next/typescript' sur **/*.ts, **/*.tsx
  //   - next[2] = ignores (.next/**, out/**, build/**, next-env.d.ts)
  ...next,

  // Configs legacy chargées via FlatCompat (pas d'équivalent ESM natif) :
  //   - plugin:@typescript-eslint/recommended (@typescript-eslint/eslint-plugin@8.71.1)
  //   - prettier (eslint-config-prettier@10.1.8)
  ...compat.extends('plugin:@typescript-eslint/recommended', 'prettier'),

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

  // D75 — désactivation ciblée de react-hooks/set-state-in-effect pour
  // theme-toggle.tsx UNIQUEMENT.
  // Justification : le pattern `const [mounted, setMounted] = useState(false)`
  // + `useEffect(() => { setMounted(true) }, [])` est l'idiome standard de
  // next-themes pour éviter le flash SSR (rendu placeholder jusqu'à l'hydratation
  // du thème). La règle v7 (react-hooks@7, embarquée par eslint-config-next@16)
  // flague ce pattern légitime. Le refactor (lazy initializer) n'est pas applicable
  // ici car `mounted` doit rester `false` lors du premier rendu SSR pour que le
  // placeholder s'affiche — un lazy initializer `useState(() => typeof window !== 'undefined')`
  // rendrait `true` au montage client et casserait la détection de flash.
  // Les deux autres set-state-in-effect (app-mode.ts, cad-viewer.tsx) sont
  // corrigés en D74 car ils ont une alternative SSR-safe.
  {
    files: ['src/components/layout/theme-toggle.tsx'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];

export default config;
