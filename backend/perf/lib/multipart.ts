// k6はテキストフィールドのみのオブジェクトbodyを既定で application/x-www-form-urlencoded に
// エンコードする（http.file() を含む場合のみ自動で multipart/form-data になる）。
// RaiseTimeLine の投稿系APIは consumes = multipart/form-data のため、
// ファイルを含まないテキストのみのリクエストでも multipart で送る必要があり、
// boundary を含めて手動でエンコードする。
export interface MultipartResult {
    body: string;
    contentTypeHeader: string;
}

export function multipartTextBody(fields: Record<string, string>): MultipartResult {
    const boundary = '----k6FormBoundary' + Math.random().toString(16).slice(2);
    let body = '';
    for (const [key, value] of Object.entries(fields)) {
        body += `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`;
    }
    body += `--${boundary}--\r\n`;

    return {
        body,
        contentTypeHeader: `multipart/form-data; boundary=${boundary}`,
    };
}
