// smoke / load / stress / spike / soak / breakpoint の6テスト種別を
// 環境変数 TEST_TYPE で切り替えるための設定。
// 使い方: k6 run --env TEST_TYPE=smoke|load|stress|spike|soak|breakpoint <scenario file>

export function buildOptions(scenarioName) {
    const testType = __ENV.TEST_TYPE || 'load';
    const scenarios = {};

    if (testType === 'smoke') {
        // スモークテスト: 本格的なテストの前に「そもそも動くか」を最小構成で確認する予備チェック
        scenarios[scenarioName] = {
            executor: 'constant-vus',
            vus: 2,
            duration: '30s',
        };
    } else if (testType === 'load') {
        // 負荷テスト: 通常運用を想定した一定負荷を一定時間維持する
        scenarios[scenarioName] = {
            executor: 'constant-vus',
            vus: 10,
            duration: '5m',
        };
    } else if (testType === 'stress') {
        // ストレステスト: VUを段階的に増加させ、性能劣化ポイントを見つける
        scenarios[scenarioName] = {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 10 },
                { duration: '5m', target: 10 },
                { duration: '2m', target: 50 },
                { duration: '5m', target: 50 },
                { duration: '2m', target: 100 },
                { duration: '5m', target: 100 },
                { duration: '2m', target: 0 },
            ],
        };
    } else if (testType === 'spike') {
        // スパイクテスト: 急激なアクセス集中への耐性を確認する
        scenarios[scenarioName] = {
            executor: 'ramping-vus',
            startVUs: 10,
            stages: [
                { duration: '1m', target: 10 },
                { duration: '10s', target: 100 },
                { duration: '30s', target: 100 },
                { duration: '10s', target: 10 },
                { duration: '1m', target: 10 },
            ],
        };
    } else if (testType === 'soak') {
        // ソークテスト(耐久テスト): 中程度の負荷を長時間維持し、メモリリークや
        // コネクションリークなど時間経過で悪化する問題を検出する。
        // 本来は数時間〜行うが、学習用途のため1時間に短縮している。
        scenarios[scenarioName] = {
            executor: 'constant-vus',
            vus: 15,
            duration: '1h',
        };
    } else if (testType === 'breakpoint') {
        // ブレイクポイントテスト: stressのように上限を決め打ちせず、
        // 実際に破綻する(エラー率が跳ね上がる)地点まで段階的に負荷を上げ続ける。
        scenarios[scenarioName] = {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '3m', target: 100 },
                { duration: '3m', target: 100 },
                { duration: '3m', target: 200 },
                { duration: '3m', target: 200 },
                { duration: '3m', target: 300 },
                { duration: '3m', target: 300 },
                { duration: '2m', target: 0 },
            ],
        };
    } else {
        throw new Error(
            `Unknown TEST_TYPE: ${testType}. Use smoke, load, stress, spike, soak, or breakpoint.`,
        );
    }

    return {
        scenarios,
        thresholds: {
            http_req_duration: ['p(95)<1000'],
            http_req_failed: ['rate<0.01'],
        },
    };
}
