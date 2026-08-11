import tseslint from 'typescript-eslint'

/**
 * ESLint は「型情報が必要なルール」だけを担当する。
 *
 * 構文だけで判断できるもの（未使用変数・フックの規則・no-console・no-explicit-any 等）は
 * すべて oxlint 側（.oxlintrc.json）に置いてある。oxlint のほうが桁違いに速いため、
 * 大半をそちらで弾き、oxlint が原理的に扱えない型情報のルールだけをここに置く。
 *
 * **同じルールを両方に書かないこと。** 二重に持つと、片方だけ変更したときに
 * どちらの設定が効いているのか分からなくなる。
 *
 * 対象は src/ に加えて e2e/ と perf-browser/ も含む。await 忘れはテストコードでこそ深刻で、
 * 「テストは通るが実際には何も検証していない」という形になるため。
 */
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'playwright-report/**', 'test-results/**', 'perf-browser/results/**'],
  },
  {
    files: ['src/**/*.{ts,tsx}', 'e2e/**/*.ts', 'perf-browser/**/*.ts'],
    extends: [tseslint.configs.base],
    languageOptions: {
      parserOptions: {
        // tsconfig.app.json（src）と tsconfig.e2e.json（e2e / perf-browser）の
        // 両方から型情報を取る。
        //
        // projectService は使わない。ルートの tsconfig.json は references だけを持つ
        // solution 形式で、projectService はそこから参照先を辿ってくれず、
        // e2e/ の各ファイルが「プロジェクトに見つからない」となる。対象を明示する。
        project: ['./tsconfig.app.json', './tsconfig.e2e.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // await 忘れ。「動くが結果を待たない」「例外が握り潰される」形で実行時にしか現れない
      '@typescript-eslint/no-floating-promises': 'error',
      // Promise でないものを await している（待っているつもりで待てていない）
      '@typescript-eslint/await-thenable': 'error',
      // Promise を返す関数を、Promise を扱わない場所（if の条件など）に渡している。
      //
      // ただし JSX の属性（onClick / onSubmit 等）は対象外にする。React のイベントハンドラは
      // async でよく、返り値の Promise は React が無視する仕様。ここを有効にすると
      // 全ハンドラを void でくるむ必要が生じ、指摘の大半がこの定型作業で埋まって
      // 本当に危険な箇所（if の条件に Promise を渡す等）が埋もれる。
      // ハンドラ内の失敗は、ハンドラ自身で catch して画面に出す方針で担保する。
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
)
