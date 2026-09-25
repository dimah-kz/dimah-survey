export function requestFromHeaders(headers?: HeadersInit): Request {
  return new Request("http://dimah-survey.local", { headers });
}
