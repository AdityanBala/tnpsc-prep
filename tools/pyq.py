#!/usr/bin/env python3
"""Past-paper bank helper. Run from the repo root.

  python3 tools/pyq.py list [--subject gs|apt] [--unit N] [--grep TEXT] [--years 2016,2019] [--all]
      One line per question: year:n  unit  topic  (use/status).
      By default only questions that may be served: use ok, status not doubtful,
      and not from a paper reserved as a full test (2025, 2024). --all shows everything.

  python3 tools/pyq.py get 2019:152 2016:182 ... [--day 12 --test daily --start 21 | --pool-start 4]
      Prints the questions as day-file JSON. The explanation is prefixed with the year.
      With --day they get ids dNNN-<test>-0SS from --start (or dNNN-<test>-pSS from --pool-start).

  python3 tools/pyq.py check
      Structural check of every year file and the index.
"""
import argparse, json, os, re, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'content', 'pyq')
RESERVED = {2025, 2024}
YEARS = (2025, 2024, 2022, 2019, 2018, 2016)

def load(y): return json.load(open(os.path.join(ROOT, '%d-gs.json' % y), encoding='utf-8'))
def servable(q): return q.get('use') == 'ok' and q.get('status') != 'doubtful'

def cmd_list(a):
    rows = json.load(open(os.path.join(ROOT, 'index.json'), encoding='utf-8'))['rows']
    years = {int(x) for x in a.years.split(',')} if a.years else None
    n = 0
    for y, num, subj, unit, topic, use, status in rows:
        if years and y not in years: continue
        if a.subject and subj != a.subject: continue
        if a.unit and unit != a.unit: continue
        if a.grep and a.grep.lower() not in topic.lower(): continue
        if not a.all and (use != 'ok' or status == 'doubtful' or y in RESERVED): continue
        print('%d:%d\t%s %d\t%s\t(%s/%s)' % (y, num, subj, unit, topic, use, status)); n += 1
    print('%d questions' % n, file=sys.stderr)

def cmd_get(a):
    out, cache = [], {}
    for i, ref in enumerate(a.refs):
        y, num = (int(x) for x in ref.split(':'))
        if y not in cache: cache[y] = {q['n']: q for q in load(y)['questions']}
        q = cache[y][num]
        if not servable(q): print('warning: %s is %s/%s' % (ref, q.get('use'), q.get('status')), file=sys.stderr)
        d = {}
        if a.day:
            d['id'] = ('d%03d-%s-p%03d' % (a.day, a.test, a.pool_start + i)) if a.pool_start else ('d%03d-%s-%03d' % (a.day, a.test, a.start + i))
        d['subject'] = q['subject']; d['q'] = q['q']; d['o'] = q['o']; d['a'] = q['a']
        d['x'] = {'ta': 'TNPSC குரூப் 4, %d. %s' % (y, q['x']['ta']), 'en': 'TNPSC Group 4, %d. %s' % (y, q['x']['en'])}
        out.append(d)
    print(json.dumps(out, ensure_ascii=False, indent=1))

def cmd_check(a):
    bad = []; total = 0; tam = re.compile('[஀-௿]')
    for y in YEARS:
        d = load(y); qs = d['questions']
        if [q['n'] for q in qs] != list(range(101, 201)): bad.append('%d: numbering' % y)
        for q in qs:
            w = '%d:%d' % (y, q['n']); total += 1
            if q.get('subject') not in ('gs', 'apt'): bad.append(w + ' subject')
            if len(q['o']) != 4 or q['a'] not in (0, 1, 2, 3): bad.append(w + ' options/answer')
            if not tam.search(q['q']['ta']) or tam.search(q['q'].get('en', '')): bad.append(w + ' language of question')
            for o in q['o']:
                if tam.search(o['ta']) and 'en' not in o: bad.append(w + ' option needs en')
            if q.get('use') not in ('ok', 'stale', 'off', 'void', 'figure'): bad.append(w + ' use')
            if q.get('status') not in ('ok', 'doubtful', 'unverified'): bad.append(w + ' status')
    rows = json.load(open(os.path.join(ROOT, 'index.json'), encoding='utf-8'))['rows']
    if len(rows) != total: bad.append('index has %d rows for %d questions' % (len(rows), total))
    print('\n'.join(bad) if bad else 'OK: %d past questions in %d papers' % (total, len(YEARS)))
    sys.exit(1 if bad else 0)

p = argparse.ArgumentParser(); s = p.add_subparsers(dest='cmd', required=True)
l = s.add_parser('list'); l.add_argument('--subject'); l.add_argument('--unit', type=int); l.add_argument('--grep'); l.add_argument('--years'); l.add_argument('--all', action='store_true')
g = s.add_parser('get'); g.add_argument('refs', nargs='+'); g.add_argument('--day', type=int); g.add_argument('--test', default='daily'); g.add_argument('--start', type=int, default=1); g.add_argument('--pool-start', type=int)
s.add_parser('check')
a = p.parse_args(); {'list': cmd_list, 'get': cmd_get, 'check': cmd_check}[a.cmd](a)
