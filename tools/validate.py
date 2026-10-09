#!/usr/bin/env python3
"""Checks every content file. Run from the repo root: python3 tools/validate.py
Exits with an error and a list of problems if anything is wrong."""
import json, os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'content')
SUBJECTS = {'tamil', 'gs', 'apt'}
problems = []

def bad(where, msg):
    problems.append('%s: %s' % (where, msg))

def text(obj, where, need_en=False):
    if not isinstance(obj, dict) or not isinstance(obj.get('ta'), str) or not obj['ta'].strip():
        bad(where, 'needs a non-empty "ta" text'); return
    if 'en' in obj and (not isinstance(obj['en'], str) or not obj['en'].strip()):
        bad(where, '"en" is present but empty')
    if need_en and 'en' not in obj:
        bad(where, 'needs an "en" text (General Studies and aptitude are bilingual)')
    for k in obj:
        if k not in ('ta', 'en'): bad(where, 'unknown language key %r' % k)

index = json.load(open(os.path.join(ROOT, 'index.json'), encoding='utf-8'))
seen_ids = set()
numbers = [d['n'] for d in index['days']]
if numbers != list(range(1, len(numbers) + 1)):
    bad('index.json', 'days must be numbered 1, 2, 3… with no gaps: %r' % numbers)
for entry in index['days']:
    n, fn = entry['n'], entry['file']
    if fn != 'day-%03d.json' % n: bad('index.json', 'day %d should use file day-%03d.json' % (n, n))
    text(entry.get('title'), 'index day %d title' % n)
    try:
        day = json.load(open(os.path.join(ROOT, fn), encoding='utf-8'))
    except Exception as e:
        bad(fn, 'cannot be read: %s' % e); continue
    strict = n >= 3  # days 1–2 were converted from older documents and are Tamil-only
    if day.get('n') != n: bad(fn, '"n" must be %d' % n)
    text(day.get('title'), fn + ' title')
    if 'plan' in day: text(day['plan'], fn + ' plan')
    notes = day.get('notes') or []
    if not notes: bad(fn, 'no notes')
    for note in notes:
        w = '%s notes[%s]' % (fn, note.get('id'))
        if note.get('subject') not in SUBJECTS: bad(w, 'subject must be tamil, gs or apt')
        if not re.fullmatch(r'[a-z0-9-]+', str(note.get('id', ''))): bad(w, 'id must be lowercase letters, digits, hyphens')
        text(note.get('title'), w + ' title'); text(note.get('md'), w + ' md', strict and note.get('subject') != 'tamil')
    if len({x.get('id') for x in notes}) != len(notes): bad(fn, 'note ids must be unique within the day')
    tests = day.get('tests') or []
    if [t.get('id') for t in tests].count('daily') != 1: bad(fn, 'needs exactly one test with id "daily"')
    for t in tests:
        tid = t.get('id'); w = '%s tests[%s]' % (fn, tid)
        if not re.fullmatch(r'[a-z0-9]+', str(tid or '')): bad(w, 'id must be lowercase letters and digits only')
        if t.get('kind') != ('daily' if tid == 'daily' else 'extra'): bad(w, 'kind must be "daily" for the daily test and "extra" otherwise')
        text(t.get('title'), w + ' title')
        if not isinstance(t.get('minutes'), int) or t['minutes'] <= 0: bad(w, 'minutes must be a positive whole number')
        qs = t.get('questions') or []
        if not qs: bad(w, 'no questions')
        spread = [0, 0, 0, 0]
        for i, q in enumerate(qs, 1):
            qw = '%s q%d' % (w, i)
            want = 'd%03d-%s-%03d' % (n, tid, i)
            if q.get('id') != want: bad(qw, 'id must be %s' % want)
            if q.get('id') in seen_ids: bad(qw, 'duplicate id')
            seen_ids.add(q.get('id'))
            if q.get('subject') not in SUBJECTS: bad(qw, 'subject must be tamil, gs or apt'); continue
            en = strict and q['subject'] != 'tamil'
            text(q.get('q'), qw + ' question', en)
            opts = q.get('o')
            if not isinstance(opts, list) or len(opts) != 4: bad(qw, 'needs exactly four options'); continue
            for j, o in enumerate(opts): text(o, '%s option %d' % (qw, j + 1), False)
            if en and not all('en' in o for o in opts) and not all(re.fullmatch(r'[\d\s.,:/%₹+−×÷=()a-zA-Z²³½¼¾-]+', o.get('ta', '')) for o in opts):
                bad(qw, 'options need "en" text')
            if len({o.get('ta') for o in opts}) != 4: bad(qw, 'two options are identical')
            if q.get('a') not in (0, 1, 2, 3): bad(qw, '"a" must be 0, 1, 2 or 3'); continue
            spread[q['a']] += 1
            if strict and 'x' not in q: bad(qw, 'needs an explanation "x"')
            if 'x' in q: text(q['x'], qw + ' explanation', en)
        if strict and len(qs) >= 20 and max(spread) > 0.4 * len(qs):
            bad(w, 'correct answers are bunched on one option: %r' % spread)
    if strict and tests and len([t for t in tests if t.get('id') == 'daily'][0].get('questions', [])) < 30:
        bad(fn, 'the daily test needs at least 30 questions')
if problems:
    print('\n'.join(problems)); sys.exit('%d problem(s) found' % len(problems))
print('OK: %d days, %d questions' % (len(numbers), len(seen_ids)))
