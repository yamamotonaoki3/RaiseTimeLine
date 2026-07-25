import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';

// handleSummary() を各シナリオから呼び出すための共通ヘルパー。
// backend/perf/results/<scenarioName>-<TEST_TYPE>-report.html にHTMLレポートを出力し、
// あわせてターミナルにも通常通りのサマリーを表示する。
// 出力パスはリポジトリルートから k6 run を実行する運用（README参照）を前提に、
// カレントディレクトリからの相対パスで指定する。
export function buildSummary(scenarioName, data) {
    const testType = __ENV.TEST_TYPE || 'load';
    const reportPath = `backend/perf/results/${scenarioName}-${testType}-report.html`;

    return {
        [reportPath]: htmlReport(data),
        stdout: textSummary(data, { indent: ' ', enableColors: true }),
    };
}
