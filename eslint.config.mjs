// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * 기본적으로 타입 안전성을 유지하기 위해 no-unsafe 룰은 활성화합니다.
 * 특정 파일이나 커스텀 상황에서만 개별 비활성화하도록 오버라이드합니다.
 */
export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'scripts/*', 'doc/*', 'ecosystem.config.js'],
  },

  // 기본 ESLint 권장 설정 및 타입 체킹 활성화
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,

  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // 타입 안전성 경고: 기본적으로 켜두어 안전한 코드 유지
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
    },
  },

  {
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      '@typescript-eslint/no-explicit-any': 'off',

      // Floating promises 경고 유지
      '@typescript-eslint/no-floating-promises': 'warn',

      // unsafe argument는 파일 레벨에서만 임시 허용
      '@typescript-eslint/no-unsafe-argument': 'warn',

      // 이 파일에서만 unsafe 관련 아래 룰 일시 비활성화
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
);
