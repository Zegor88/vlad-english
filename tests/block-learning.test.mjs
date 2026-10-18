import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root = new URL('..', import.meta.url);
const page = fs.readFileSync(new URL('index.html', root), 'utf8');

test('British Council and Cambridge links are static and always visible', () => {
  const links = [...page.matchAll(/<a class="res" href="(https:[^"]+)"/g)].map(m => m[1]);
  assert.ok(links.length >= 10, 'expected at least 10 static resource links, got ' + links.length);
  assert.ok(links.every(h => /^https:\/\/(learnenglishkids\.britishcouncil\.org|www\.cambridgeenglish\.org|assets\.cambridgeenglish\.org|cambridgeenglish\.org)/.test(h)));
  assert.match(page, /class="panel all-links" id="resources"/);
  assert.doesNotMatch(page, /id="resources"[^>]*class="[^"]*hidden/);
  assert.ok((page.match(/target="_blank"/g) || []).length >= 10);
});

test('each course step carries its own verified links', () => {
  assert.equal((page.match(/links:\[\[/g) || []).length, 7);
  assert.match(page, /past-simple-sentences/);
  assert.match(page, /grammar-past-progressive/);
});

test('guided flow uses one stage at a time with real controls', () => {
  assert.match(page, /vlad-english-tense-path-v2/);
  assert.match(page, /data-act="practice"/);
  assert.match(page, /data-act="check"/);
  assert.match(page, /data-act="next"/);
  assert.match(page, /data-act="stop"/);
  assert.match(page, /Проверить ответ/);
  assert.match(page, /Дальше/);
  assert.doesNotMatch(page, /<details/);
});

test('page keeps calm child copy and no data collection fields', () => {
  assert.match(page, /Если сегодня не хочется/);
  assert.match(page, /остановился на шаге/);
  assert.ok(!page.includes('<textarea'));
  assert.ok(!page.includes('type="text"'));
});
