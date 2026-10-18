import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root = new URL('..', import.meta.url);
const bank = JSON.parse(fs.readFileSync(new URL('quiz-bank.json', root), 'utf8'));
const page = fs.readFileSync(new URL('index.html', root), 'utf8');
test('tense-map course explains meaning before formulas', () => {
  assert.equal(bank.block.id, '2026-10-tense-map-simple-continuous');
  assert.deepEqual(bank.block.activities.map(x => x.taskId), ['time-map','present-simple','present-continuous','past-simple','past-continuous','past-contrast','mixed-choice']);
  assert.match(page, /Сначала выбери смысл/);
  assert.match(page, /Три большие зоны времени/);
  assert.match(page, /Simple — факт, привычка или завершённое событие/);
  assert.match(page, /Continuous — действие в процессе/);
});
test('course teaches group topics, formation, and contrast', () => {
  assert.match(page, /did\/didn’t → обычный глагол/);
  assert.match(page, /am\/is\/are \+ глагол-ing/);
  assert.match(page, /was\/were \+ глагол-ing/);
  assert.match(page, /Past Simple или Past Continuous/);
  assert.ok(bank.quizzes.every(q => q.items.length >= 3));
});
test('page keeps a calm child flow and selected trusted resources', () => {
  assert.match(page, /British Council/);
  assert.match(page, /Cambridge/);
  assert.match(page, /Я вернулся — открыть вопросы/);
  assert.match(page, /На сегодня достаточно/);
  assert.match(page, /target="_blank"/);
  assert.ok(!page.includes('<textarea'));
  assert.ok(!page.includes('type="text"'));
});
