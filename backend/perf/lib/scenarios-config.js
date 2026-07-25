// load / stress / spike の3テスト種別を環境変数 TEST_TYPE で切り替えるための設定。
// 使い方: k6 run --env TEST_TYPE=load|stress|spike <scenario file>

export function buildOptions(scenarioName) {
    const testType = __ENV.TEST_TYPE || 'load';
    const scenarios = {};

    if (testType === 'load') {
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
    } else {
        throw new Error(`Unknown TEST_TYPE: ${testType}. Use load, stress, or spike.`);
    }

    return {
        scenarios,
        thresholds: {
            http_req_duration: ['p(95)<1000'],
            http_req_failed: ['rate<0.01'],
        },
    };
}
