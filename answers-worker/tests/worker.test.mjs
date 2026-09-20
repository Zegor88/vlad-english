import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

const ORIGIN = 'https://zegor88.github.io';
const DEVICE = 'f'.repeat(64);

class FakeDB {
  constructor() { this.rows = []; }
  prepare(sql) {
    const db = this;
    return {
      bind(...args) {
        return {
          async run() {
            if (sql.includes('INSERT INTO answers')) {
              db.rows.push({
                deviceId: args[0], quizId: args[1], questionId: args[2],
                choice: args[3], correct: args[4], submittedAt: args[5]
              });
            }
            return { success: true };
          },
          async all() {
            return { results: db.rows.filter(row => row.deviceId === args[0]) };
          }
        };
      }
    };
  }
}

function env(db = new FakeDB()) { return { DB: db, ALLOWED_ORIGIN: ORIGIN }; }
function request(path, init = {}) {
  return new Request('https://answers.example' + path, {
    ...init,
    headers: { Origin: ORIGIN, ...(init.headers || {}) }
  });
}

test('rejects a submission without a 64-hex device token', async () => {
  const response = await worker.fetch(request('/v1/answers', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quizId: 'jobs-animals-001', answers: [] })
  }), env());
  assert.equal(response.status, 401);
});

test('stores only structured answers and returns a compact history', async () => {
  const db = new FakeDB();
  const payload = {
    quizId: 'jobs-animals-001',
    answers: [
      { questionId: 'job-vet', choice: 0, correct: true },
      { questionId: 'because', choice: 1, correct: false }
    ]
  };
  const saved = await worker.fetch(request('/v1/answers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Device-Token': DEVICE },
    body: JSON.stringify(payload)
  }), env(db));
  assert.equal(saved.status, 201);
  assert.deepEqual(await saved.json(), { saved: 2 });
  assert.equal(db.rows.length, 2);
  assert.deepEqual(Object.keys(db.rows[0]).sort(), ['choice', 'correct', 'deviceId', 'questionId', 'quizId', 'submittedAt']);

  const history = await worker.fetch(request('/v1/answers', {
    headers: { 'X-Device-Token': DEVICE }
  }), env(db));
  assert.equal(history.status, 200);
  const body = await history.json();
  assert.equal(body.answers.length, 2);
  assert.equal(body.answers[0].quizId, 'jobs-animals-001');
});


test('stores a multi-select answer without losing the selected options', async () => {
  const db = new FakeDB();
  const response = await worker.fetch(request('/v1/answers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Device-Token': DEVICE },
    body: JSON.stringify({
      quizId: 'jobs-animals-001',
      answers: [{ questionId: 'animal-jobs', choice: [0, 1], correct: true }]
    })
  }), env(db));
  assert.equal(response.status, 201);
  assert.equal(db.rows[0].choice, '[0,1]');
});

test('does not allow cross-origin browser requests', async () => {
  const response = await worker.fetch(new Request('https://answers.example/v1/answers', {
    method: 'OPTIONS', headers: { Origin: 'https://example.invalid' }
  }), env());
  assert.equal(response.status, 403);
});
