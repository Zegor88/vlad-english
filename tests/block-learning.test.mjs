import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('..', import.meta.url);
const bank = JSON.parse(fs.readFileSync(new URL('quiz-bank.json', root), 'utf8'));
const page = fs.readFileSync(new URL('index.html', root), 'utf8');

test('current block has an optional quiz after each prepared activity', () => {
  const tasks = ['past-simple-questions', 'at-the-museum', 'jack-and-the-beanstalk'];
  assert.equal(bank.block.id, '2026-09-past-questions-museum-adventure');
  assert.deepEqual(bank.block.activities.map(activity => activity.taskId), tasks);
  for (const activity of bank.block.activities) {
    const quiz = bank.quizzes.find(item => item.id === activity.quizId);
    assert.ok(quiz, 'quiz exists for ' + activity.taskId);
    assert.equal(quiz.taskId, activity.taskId);
    assert.ok(quiz.items.length >= 3 && quiz.items.length <= 5);
  }
});

test('block check-in is structured, optional, and contains no free-text collection', () => {
  assert.equal(bank.block.checkIn.id, 'block-checkin-2026-09-24');
  assert.ok(bank.block.checkIn.items.every(item => Array.isArray(item.options) && item.options.length >= 2));
  assert.ok(!page.includes('<textarea'));
  assert.ok(!page.includes('type="text"'));
  assert.match(page, /renderActivityQuiz/);
  assert.match(page, /renderCheckIn/);
});

test('quiz cards are closed until Vlad chooses to open their linked questions', () => {
  assert.match(page, /document\.createElement\('details'\)/);
  assert.match(page, /box\.open=false/);
  assert.match(page, /Открыть короткие вопросы/);
  assert.match(page, /Выбери, как тебе было/);
});

test('routes support a calm return flow and a non-competitive stopping point', () => {
  assert.match(page, /Я вернулся/);
  assert.match(page, /На сегодня достаточно/);
  assert.match(page, /route-state/);
  assert.match(page, /vlad-english-route-state-v1/);
});

test('quiz feedback is learning-first and recovery is actionable', () => {
  assert.doesNotMatch(page, /Точных ответов:/);
  assert.match(page, /feedback/);
  assert.match(page, /Стереть ответы/);
  assert.match(page, /Подтвердить/);
  assert.match(page, /Попробовать ещё раз/);
  assert.match(page, /Видео-история/);
});

test('a saved quiz is not sent again after repeated taps', () => {
  assert.match(page, /sentToFamily/);
  assert.match(page, /Уже сохранено/);
  assert.match(page, /button\.disabled=true/);
});

test('page describes a current child-readable block and the voluntary pace', () => {
  assert.match(page, /Выбери одно задание/);
  assert.match(page, /в другой день/);
  assert.match(page, /Ничего догонять не нужно/);
});
