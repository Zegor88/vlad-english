import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('..', import.meta.url);
const bank = JSON.parse(fs.readFileSync(new URL('quiz-bank.json', root), 'utf8'));
const page = fs.readFileSync(new URL('index.html', root), 'utf8');

test('current block has an optional quiz after each prepared activity', () => {
  const tasks = ['what-will-i-be', 'places-and-free-time', 'our-best-things'];
  assert.equal(bank.block.id, '2026-09-jobs-places-best-things');
  assert.deepEqual(bank.block.activities.map(activity => activity.taskId), tasks);
  for (const activity of bank.block.activities) {
    const quiz = bank.quizzes.find(item => item.id === activity.quizId);
    assert.ok(quiz, 'quiz exists for ' + activity.taskId);
    assert.equal(quiz.taskId, activity.taskId);
    assert.ok(quiz.items.length >= 3 && quiz.items.length <= 5);
  }
});

test('block check-in is structured, optional, and contains no free-text collection', () => {
  assert.equal(bank.block.checkIn.id, 'block-checkin-2026-09');
  assert.ok(bank.block.checkIn.items.every(item => Array.isArray(item.options) && item.options.length >= 2));
  assert.ok(!page.includes('<textarea'));
  assert.ok(!page.includes('type="text"'));
  assert.match(page, /renderActivityQuiz/);
  assert.match(page, /renderBlockCheckIn/);
});

test('page describes a current block, its lifecycle, and the voluntary pace', () => {
  assert.match(page, /Один блок заданий/);
  assert.match(page, /[Мм]ожно сделать одно задание/);
  assert.match(page, /Этот блок создан/);
});
