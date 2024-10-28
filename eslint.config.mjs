import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];

// import globals from 'globals';
// import js from '@eslint/js';
// import tseslint from 'typescript-eslint';
// import eslintPluginPrettier from 'eslint-plugin-prettier';

// export default [
//   // Global settings
//   {
//     files: ['**/*.{js,mjs,cjs,ts}'],
//     languageOptions: {
//       globals: {
//         ...globals.node,
//         ...globals.jest,
//       },
//       parser: tseslint.parser,
//       parserOptions: {
//         project: './tsconfig.json',
//         tsconfigRootDir: '.',
//         sourceType: 'module',
//       },
//     },
//     plugins: {
//       '@typescript-eslint': tseslint.plugin,
//       prettier: eslintPluginPrettier,
//     },
//     rules: {
//       ...js.configs.recommended.rules,
//       ...tseslint.configs.recommended.rules,
//       ...eslintPluginPrettier.configs.recommended.rules,
//       '@typescript-eslint/interface-name-prefix': 'off',
//       '@typescript-eslint/explicit-function-return-type': 'off',
//       '@typescript-eslint/explicit-module-boundary-types': 'off',
//       '@typescript-eslint/no-explicit-any': 'off',
//     },
//   },
//   // Ignore patterns
//   {
//     ignores: ['.eslintrc.js'],
//   },
// ];
