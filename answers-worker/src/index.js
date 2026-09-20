const MAX_ANSWERS = 12;
const TOKEN_RE = /^[a-f0-9]{64}$/;
const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

function cors(request, env) {
  const origin = request.headers.get('Origin');
  if (origin !== env.ALLOWED_ORIGIN) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Device-Token',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function json(body, status, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers }
  });
}

function token(request) {
  const value = request.headers.get('X-Device-Token') || '';
  return TOKEN_RE.test(value) ? value : null;
}

function validChoice(value) {
  const choices = Array.isArray(value) ? value : [value];
  return choices.length >= 1 && choices.length <= 4 &&
    choices.every(choice => Number.isInteger(choice) && choice >= 0 && choice <= 9) &&
    new Set(choices).size === choices.length;
}

function validPayload(body) {
  if (!body || !ID_RE.test(body.quizId || '') || !Array.isArray(body.answers)) return false;
  if (!body.answers.length || body.answers.length > MAX_ANSWERS) return false;
  const seen = new Set();
  return body.answers.every(answer => {
    const okay = answer && ID_RE.test(answer.questionId || '') && validChoice(answer.choice) &&
      typeof answer.correct === 'boolean' && !seen.has(answer.questionId);
    seen.add(answer && answer.questionId);
    return okay;
  });
}

async function saveAnswers(db, deviceToken, body) {
  const submittedAt = new Date().toISOString();
  for (const answer of body.answers) {
    await db.prepare(
      'INSERT INTO answers (device_token, quiz_id, question_id, choice, correct, submitted_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(deviceToken, body.quizId, answer.questionId, JSON.stringify(Array.isArray(answer.choice) ? answer.choice : [answer.choice]), answer.correct ? 1 : 0, submittedAt).run();
  }
  return body.answers.length;
}

async function history(db, deviceToken) {
  const result = await db.prepare(
    'SELECT quiz_id AS quizId, question_id AS questionId, choice, correct, submitted_at AS submittedAt FROM answers WHERE device_token = ? ORDER BY submitted_at DESC LIMIT 100'
  ).bind(deviceToken).all();
  return result.results || [];
}

export default {
  async fetch(request, env) {
    const headers = cors(request, env);
    if (!headers) return json({ error: 'origin_not_allowed' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

    const url = new URL(request.url);
    if (url.pathname === '/health' && request.method === 'GET') return json({ ok: true }, 200, headers);
    if (url.pathname !== '/v1/answers') return json({ error: 'not_found' }, 404, headers);

    const deviceToken = token(request);
    if (!deviceToken) return json({ error: 'device_token_required' }, 401, headers);

    if (request.method === 'GET') {
      return json({ answers: await history(env.DB, deviceToken) }, 200, headers);
    }
    if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, headers);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'invalid_json' }, 400, headers); }
    if (!validPayload(body)) return json({ error: 'invalid_payload' }, 400, headers);

    const saved = await saveAnswers(env.DB, deviceToken, body);
    return json({ saved }, 201, headers);
  }
};
