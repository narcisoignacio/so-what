import { defineConfig, globalIgnores } from 'eslint/config';
import nextPlugin from '@next/eslint-plugin-next';
import eslintReact from '@eslint-react/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import { importX } from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
import tseslint from 'typescript-eslint';

// Hand-rolled replacement for eslint-config-next, whose bundled plugins
// (eslint-plugin-react, eslint-plugin-import, eslint-plugin-jsx-a11y) don't
// support ESLint 10. Rule choices mirror eslint-config-next/core-web-vitals
// and eslint-config-next/typescript.
const eslintConfig = defineConfig([
  tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
    },
  },

  nextPlugin.configs.recommended,
  nextPlugin.configs['core-web-vitals'],

  reactHooks.configs.flat.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    extends: [eslintReact.configs['recommended-typescript']],
    rules: {
      // Covered by eslint-plugin-react-hooks, which also carries the
      // React Compiler diagnostics.
      '@eslint-react/rules-of-hooks': 'off',
      '@eslint-react/exhaustive-deps': 'off',
      '@eslint-react/error-boundaries': 'off',
      '@eslint-react/purity': 'off',
      '@eslint-react/set-state-in-effect': 'off',
      '@eslint-react/set-state-in-render': 'off',
      '@eslint-react/static-components': 'off',
      '@eslint-react/use-memo': 'off',
    },
  },

  {
    plugins: {
      'import-x': importX,
      'jsx-a11y-x': jsxA11y,
    },
    rules: {
      'import-x/no-anonymous-default-export': 'warn',
      'jsx-a11y-x/alt-text': ['warn', { elements: ['img'], img: ['Image'] }],
      'jsx-a11y-x/aria-props': 'warn',
      'jsx-a11y-x/aria-proptypes': 'warn',
      'jsx-a11y-x/aria-unsupported-elements': 'warn',
      'jsx-a11y-x/role-has-required-aria-props': 'warn',
      'jsx-a11y-x/role-supports-aria-props': 'warn',
    },
  },

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'src/lib/db/generated/**',
  ]),
]);

export default eslintConfig;
