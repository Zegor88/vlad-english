import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root = new URL('..', import.meta.url);
const page = fs.readFileSync(new URL('index.html', root), 'utf8');
test('dashboard has one clear current-step route instead of lesson accordions', () => {
  assert.match(page, /Сегодня/);
  assert.match(page, /Продолжить/);
  assert.match(page, /из 7/);
  assert.match(page, /Все шаги/);
  assert.doesNotMatch(page, /<details class="card">/);
});
test('practice is one question at a time with calm next and stop states', () => {
  assert.match(page, /Следующий вопрос/);
  assert.match(page, /Сегодня хватит/);
  assert.match(page, /Ты остановился на шаге/);
  assert.match(page, /vlad-english-tense-path-v1/);
});
test('external resources are secondary and optional', () => {
  assert.match(page, /Хочешь ещё/);
  assert.match(page, /Дополнительная игра/);
  assert.match(page, /target="_blank"/);
});
