#!/usr/bin/env python3
import json
import urllib.request

ORIGIN = 'https://zegor88.github.io'
TOKEN = 'a' * 64
BASE = 'http://127.0.0.1:8791'

def call(path, method='GET', data=None, headers=None):
    merged = {'Origin': ORIGIN, **(headers or {})}
    raw = None if data is None else json.dumps(data).encode()
    if raw is not None:
        merged['Content-Type'] = 'application/json'
    request = urllib.request.Request(BASE + path, data=raw, method=method, headers=merged)
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.status, response.headers, json.loads(response.read().decode())

status, _, body = call('/health')
assert status == 200 and body == {'ok': True}, (status, body)
print('health:', body)
payload = {
    'quizId': 'jobs-animals-001',
    'answers': [
        {'questionId': 'meaning-vet', 'choice': [0], 'correct': True},
        {'questionId': 'animal-jobs', 'choice': [0, 1], 'correct': True}
    ]
}
status, headers, body = call('/v1/answers', 'POST', payload, {'X-Device-Token': TOKEN})
assert status == 201 and body == {'saved': 2}, (status, body)
assert headers['Access-Control-Allow-Origin'] == ORIGIN
print('post:', body)
status, _, body = call('/v1/answers', headers={'X-Device-Token': TOKEN})
assert status == 200 and len(body['answers']) >= 2, (status, body)
assert any(row['questionId'] == 'animal-jobs' for row in body['answers']), body
print('history rows:', len(body['answers']))
