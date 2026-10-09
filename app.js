'use strict';
(function () {
  var CFG = window.TNPSC_CONFIG;
  var INTERVALS = [1, 3, 7, 14, 30];
  var SUBJECTS = ['tamil', 'gs', 'apt'];

  /* ---------- small helpers ---------- */
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem('tnpsc.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('tnpsc.' + k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem('tnpsc.' + k); } catch (e) {} }
  };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; }
  function istDate(d) { return new Date((d ? new Date(d).getTime() : Date.now()) + 5.5 * 3600e3).toISOString().slice(0, 10); }
  function addDays(ymd, n) { var d = new Date(ymd + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function daysBetween(a, b) { return Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 864e5); }
  function b64(str) { var bytes = new TextEncoder().encode(str), bin = ''; for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]); return btoa(bin); }
  function nice(iso) { var d = istDate(iso).split('-'); return d[2] + '-' + d[1] + '-' + d[0]; }
  function pct(c, t) { return t ? Math.round(c * 100 / t) : 0; }
  function hhmm(iso) { return new Date(new Date(iso).getTime() + 5.5 * 3600e3).toISOString().slice(11, 16); }
  function bestOf(list) { return list.reduce(function (b, a) { return !b || a.correct > b.correct ? a : b; }, null); }
  function shuffleSections(qs) {
    var out = [], i = 0;
    while (i < qs.length) {
      var j = i; while (j < qs.length && qs[j].subject === qs[i].subject) j++;
      var seg = qs.slice(i, j);
      for (var k = seg.length - 1; k > 0; k--) { var r = Math.floor(Math.random() * (k + 1)), tmp = seg[k]; seg[k] = seg[r]; seg[r] = tmp; }
      out = out.concat(seg); i = j;
    }
    return out;
  }
  function clock(sec) { sec = Math.max(0, Math.round(sec)); return pad(Math.floor(sec / 60), 2) + ':' + pad(sec % 60, 2); }

  /* ---------- language ---------- */
  var lang = LS.get('lang', 'ta');
  var STR = {
    appTitle: ['TNPSC குரூப் 4 பயிற்சி', 'TNPSC Group 4 Prep'],
    other: ['English', 'தமிழ்'],
    back: ['← திரும்ப', '← Back'],
    home: ['முகப்பு', 'Home'],
    progress: ['என் முன்னேற்றம்', 'My progress'],
    daysLeft: ['தேர்வுக்கு இன்னும் {0} நாள்கள்', '{0} days to the exam'],
    today: ['இன்றைய பாடம்', "Today's lesson"],
    day: ['நாள் {0}', 'Day {0}'],
    tamil: ['தமிழ்', 'Tamil'], gs: ['பொது அறிவு', 'General Studies'], apt: ['திறனறிவு', 'Aptitude'],
    readX: ['{0} – படிக்க', 'Read: {0}'],
    readDone: ['படித்து முடித்தேன் ✓', 'I have finished reading ✓'],
    readSaved: ['குறித்துக்கொண்டேன் ✓', 'Marked as read ✓'],
    testToday: ['இன்றைய தேர்வு', "Today's test"],
    testMeta: ['{0} வினாக்கள் · {1} நிமிடம்', '{0} questions · {1} minutes'],
    scoreMeta: ['மதிப்பெண்: {0} / {1}', 'Score: {0} / {1}'],
    extra: ['கூடுதல் பயிற்சி (விருப்பம்)', 'Extra practice (optional)'],
    plan: ['இன்றைய நேரத் திட்டத்தைப் பார்க்க', "See today's time plan"],
    start: ['தேர்வைத் தொடங்கு', 'Start the test'],
    again: ['மீண்டும் எழுது', 'Take it again'],
    bestMeta: ['சிறந்த மதிப்பெண்: {0} / {1} · {2} முறை எழுதியது', 'Best score: {0} / {1} · taken {2} times'],
    retakeNote: ['மீண்டும் எழுதும்போது வினாக்களின் வரிசை மாறும். எல்லா முயற்சிகளும் சேமிக்கப்படும்; சிறந்த மதிப்பெண் கணக்கில் வரும்.', 'When you take it again the questions come in a different order. Every attempt is saved; your best score counts.'],
    best: ['சிறந்தது', 'Best'],
    rules1: ['ஒவ்வொரு வினாவுக்கும் நான்கு விடைகள்; சரியான ஒன்றைத் தொடவும்.', 'Each question has four answers; tap the correct one.'],
    rules2: ['தவறான விடைக்கு மதிப்பெண் குறையாது; எதையும் விடாமல் விடையளிக்கவும்.', 'No marks are lost for a wrong answer; answer every question.'],
    rules3: ['நேரம் முடிந்ததும் தேர்வு தானாகவே முடியும்.', 'The test ends by itself when time runs out.'],
    rules4: ['இடையில் வெளியேறினாலும் விடைகள் அப்படியே இருக்கும்; திரும்பி வந்து தொடரலாம்.', 'If you leave midway your answers stay; you can come back and continue.'],
    qOf: ['வினா {0} / {1}', 'Question {0} / {1}'],
    prev: ['◀ முந்தைய', '◀ Previous'], next: ['அடுத்து ▶', 'Next ▶'],
    all: ['பட்டியல்', 'List'],
    finish: ['தேர்வை முடி', 'Finish test'],
    allTitle: ['எல்லா வினாக்களும்', 'All questions'],
    allHelp: ['பச்சை நிறம்: விடையளித்தவை. ஒரு எண்ணைத் தொட்டால் அந்த வினாவுக்குச் செல்லும்.', 'Green: answered. Tap a number to go to that question.'],
    backToQ: ['வினாவுக்குத் திரும்ப', 'Back to the question'],
    confirmT: ['தேர்வை முடிக்கலாமா?', 'Finish the test?'],
    confirmAll: ['எல்லா வினாக்களுக்கும் விடையளித்துள்ளீர்கள்.', 'You have answered every question.'],
    confirmLeft: ['இன்னும் {0} வினாக்களுக்கு விடையளிக்கவில்லை.', '{0} questions are still unanswered.'],
    yesFinish: ['ஆம், முடி', 'Yes, finish'], noCont: ['இல்லை, தொடர்கிறேன்', 'No, continue'],
    timeUp: ['நேரம் முடிந்தது', 'Time is up'],
    resume: ['பாதியில் நிற்கும் தேர்வு உள்ளது', 'You have an unfinished test'],
    resumeBtn: ['தேர்வைத் தொடர', 'Continue the test'],
    result: ['தேர்வு முடிவு', 'Test result'],
    hit: ['இலக்கு எட்டப்பட்டது. மிக நன்று!', 'Target reached. Well done!'],
    near: ['நல்ல முயற்சி. தவறானவற்றை ஒருமுறை பார்த்துவிடுங்கள்.', 'Good effort. Go through the wrong ones once.'],
    low: ['பரவாயில்லை. குறிப்புகளை மீண்டும் படித்து, தவறானவற்றைப் பாருங்கள்.', 'That is all right. Read the notes again and look at the wrong ones.'],
    target: ['இலக்கு: {0}%', 'Target: {0}%'],
    seeWrong: ['தவறான விடைகளைப் பார் ({0})', 'See wrong answers ({0})'],
    seeAll: ['எல்லா விடைகளையும் பார்', 'See all answers'],
    goHome: ['முகப்புக்குச் செல்', 'Go to Home'],
    yours: ['உங்கள் விடை: {0}', 'Your answer: {0}'],
    notAns: ['விடையளிக்கவில்லை', 'Not answered'],
    right: ['சரியான விடை: {0}', 'Correct answer: {0}'],
    noWrong: ['தவறு ஏதும் இல்லை!', 'No wrong answers!'],
    saved: ['✓ முடிவு சேமிக்கப்பட்டது', '✓ Result saved'],
    saving: ['சேமிக்கிறது…', 'Saving…'],
    notSaved: ['⚠ இன்னும் சேமிக்கவில்லை. இணையம் உள்ளதா எனப் பார்த்து, கீழே தொடவும்.', '⚠ Not saved yet. Check your internet and tap below.'],
    retry: ['மீண்டும் சேமி', 'Save again'],
    localOnly: ['இந்தக் கைபேசியில் மட்டும் சேமிக்கப்பட்டது', 'Saved on this phone only'],
    revTitle: ['மறுபயிற்சி', 'Revision'],
    revCard: ['முன்பு தவறான {0} வினாக்கள் மீண்டும் வந்துள்ளன', '{0} questions you got wrong earlier are back'],
    revBtn: ['மறுபயிற்சி செய்', 'Do revision'],
    revRight: ['சரி ✓', 'Correct ✓'], revWrong: ['தவறு ✗', 'Wrong ✗'],
    revDone: ['மறுபயிற்சி முடிந்தது', 'Revision finished'],
    waitT: ['அடுத்த பாடம் தயாராகிறது', 'The next lesson is being prepared'],
    waitP: ['இதுவரை உள்ள எல்லாப் பாடங்களையும் முடித்துவிட்டீர்கள். புதிய பாடம் நாளை காலை இங்கே வரும்.', 'You have finished every lesson so far. The new lesson will appear here tomorrow morning.'],
    doneToday: ['நாள் {0} முடிந்தது ✓', 'Day {0} complete ✓'],
    older: ['முந்தைய நாள்கள்', 'Earlier days'],
    daysDone: ['முடித்த நாள்கள்', 'Days done'], avg: ['சராசரி', 'Average'], left: ['மீதி நாள்கள்', 'Days left'],
    bySubject: ['பாடவாரியாக', 'By subject'],
    history: ['எழுதிய தேர்வுகள்', 'Tests taken'],
    none: ['இன்னும் எந்தத் தேர்வும் எழுதவில்லை.', 'No tests taken yet.'],
    weak: ['கூடுதல் கவனம் தேவை: {0}', 'Needs more attention: {0}'],
    viewOnly: ['பார்வை மட்டும்: இங்கே எழுதும் தேர்வுகள் சேமிக்கப்படாது.', 'View only: tests taken here are not saved.'],
    demo: ['சோதனை முறை: முன்னேற்றம் இந்தக் கைபேசியில் மட்டும் இருக்கும். உங்களுக்கு அனுப்பப்பட்ட முழு இணைப்பைத் திறக்கவும்.', 'Trial mode: progress stays on this phone only. Open the full link that was sent to you.'],
    keyBad: ['சேமிப்பதில் சிக்கல் உள்ளது. இதை அதித்யனிடம் சொல்லவும். உங்கள் விடைகள் இந்தக் கைபேசியில் பத்திரமாக உள்ளன.', 'There is a problem saving. Please tell Adityan. Your answers are safe on this phone.'],
    offline: ['இணையம் இல்லை. முன்பு திறந்த பாடங்கள் மட்டும் தெரியும்.', 'No internet. Only lessons opened earlier are shown.'],
    loadFail: ['பாடத்தைத் திறக்க முடியவில்லை. இணையத்தைப் பார்த்து மீண்டும் முயலவும்.', 'Could not open the lesson. Check your internet and try again.'],
    tryAgain: ['மீண்டும் முயல்', 'Try again'],
    loading: ['சற்று பொறுங்கள்…', 'One moment…'],
    preview: ['முன்னோட்டம்', 'Preview'],
    rev: ['மறுபயிற்சி', 'Revision'],
    extraTest: ['கூடுதல் தேர்வு', 'Extra test']
  };
  function t(k) {
    var s = STR[k] ? STR[k][lang === 'en' ? 1 : 0] : k, a = arguments;
    return s.replace(/\{(\d)\}/g, function (_, i) { return a[+i + 1]; });
  }
  function tx(o) { return o ? (o[lang] || o.ta || '') : ''; }
  function letter(i) { return (lang === 'en' ? ['A', 'B', 'C', 'D'] : ['அ', 'ஆ', 'இ', 'ஈ'])[i]; }

  /* ---------- markdown (notes) ---------- */
  function inline(s) {
    s = s.replace(/\\([\[\]\\*_#|<>~`.()-])/g, '\u0001$1');
    s = esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    return s.replace(/\u0001/g, '');
  }
  function cells(line) { return line.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(function (c) { return inline(c.trim()); }); }
  function mdBlocks(src) {
    var L = src.split('\n'), out = '', i = 0, m;
    while (i < L.length) {
      var ln = L[i];
      if (!ln.trim()) { i++; continue; }
      if ((m = ln.match(/^#{3,4} (.+)$/))) { out += '<h3>' + inline(m[1]) + '</h3>'; i++; continue; }
      if (ln.trim().charAt(0) === '|') {
        var rows = [];
        while (i < L.length && L[i].trim().charAt(0) === '|') rows.push(L[i++]);
        out += '<div class="tw"><table><thead><tr>' + cells(rows[0]).map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>';
        rows.slice(2).forEach(function (r) { out += '<tr>' + cells(r).map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; });
        out += '</tbody></table></div>'; continue;
      }
      if (/^- /.test(ln)) { out += '<ul>'; while (i < L.length && /^- /.test(L[i])) out += '<li>' + inline(L[i++].slice(2)) + '</li>'; out += '</ul>'; continue; }
      if (/^\d+\. /.test(ln)) { out += '<ol>'; while (i < L.length && /^\d+\. /.test(L[i])) out += '<li>' + inline(L[i++].replace(/^\d+\. /, '')) + '</li>'; out += '</ol>'; continue; }
      out += '<p>' + inline(ln) + '</p>'; i++;
    }
    return out;
  }
  function mdCards(src) {
    return src.split(/\n(?=### )/).map(function (part) { return '<div class="card notes">' + mdBlocks(part) + '</div>'; }).join('');
  }

  /* ---------- link, key, storage ---------- */
  var params = new URLSearchParams(location.hash.replace(/^#/, ''));
  var PREVIEW = parseInt(params.get('p') || '0', 10) || 0;
  var VIEW = params.get('view') === '1' || PREVIEW > 0;
  var KEY = params.get('k') || '';
  if (KEY && !VIEW) LS.set('key', KEY);
  if (!KEY) KEY = LS.get('key', '');
  var attempts = LS.get('attempts', {});   // file name -> attempt
  var reads = LS.get('reads', {});         // "d001-tamil" -> true
  var pending = LS.get('pending', []);     // [{path, text}]
  var saveState = 'idle';                  // idle | saving | error | keybad
  var online = true;

  function api(method, path, body, raw) {
    return fetch('https://api.github.com/repos/' + CFG.owner + '/' + CFG.progressRepo + '/contents/' + path, {
      method: method, cache: 'no-store', body: body ? JSON.stringify(body) : undefined,
      headers: { 'Authorization': 'Bearer ' + KEY, 'Accept': raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
    });
  }
  var flushing = null;
  function flush() {
    if (!KEY || VIEW || !pending.length) return Promise.resolve();
    if (flushing) return flushing;
    saveState = 'saving'; paintSave();
    flushing = (async function () {
      try {
        while (pending.length) {
          var p = pending[0];
          var r = await api('PUT', p.path, { message: p.path.replace(/\.json$/, ''), content: b64(p.text) });
          if (r.status === 401 || r.status === 403 || r.status === 404) { saveState = 'keybad'; return; }
          if (!r.ok && r.status !== 422) { saveState = 'error'; return; }
          pending.shift(); LS.set('pending', pending);
        }
        saveState = 'idle';
      } catch (e) { saveState = 'error'; }
    })();
    return flushing.then(function () { flushing = null; paintSave(); });
  }
  async function listDir(dir) {
    var r = await api('GET', dir);
    if (r.status === 404) return [];
    if (r.status === 401 || r.status === 403) { saveState = 'keybad'; throw new Error('key'); }
    if (!r.ok) throw new Error('list');
    var j = await r.json();
    return Array.isArray(j) ? j.map(function (f) { return f.name; }) : [];
  }
  async function sync() {
    if (!KEY) return;
    try {
      await flush();
      var names = await listDir('attempts');
      Object.keys(attempts).forEach(function (n) { if (names.indexOf(n) < 0 && !isPending(n)) delete attempts[n]; });
      var missing = names.filter(function (n) { return /\.json$/.test(n) && !attempts[n]; });
      for (var i = 0; i < missing.length; i += 6) {
        await Promise.all(missing.slice(i, i + 6).map(async function (n) {
          var r = await api('GET', 'attempts/' + n, null, true);
          if (r.ok) { var a = await r.json(); a._name = n; attempts[n] = a; }
        }));
      }
      var readNames = (await listDir('reads')).map(function (n) { return n.replace(/\.json$/, ''); });
      Object.keys(reads).forEach(function (k) { if (readNames.indexOf(k) < 0 && !pending.some(function (p) { return p.path === 'reads/' + k + '.json'; })) delete reads[k]; });
      readNames.forEach(function (k) { reads[k] = true; });
      if (!VIEW) { LS.set('attempts', attempts); LS.set('reads', reads); }
    } catch (e) { if (e.message !== 'key') online = false; }
  }
  function queue(path, obj) {
    if (VIEW) return;
    pending.push({ path: path, text: JSON.stringify(obj, null, 1) + '\n' });
    LS.set('pending', pending);
    flush();
  }
  function isPending(name) { return pending.some(function (p) { return p.path === 'attempts/' + name; }); }

  /* ---------- content ---------- */
  var index = null, dayCache = {};
  async function getJSON(url) {
    try {
      var r = await fetch(url + '?t=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) throw new Error('http');
      var j = await r.json(); LS.set('c:' + url, j); return j;
    } catch (e) {
      var c = LS.get('c:' + url, null);
      if (c) { online = false; return c; }
      throw e;
    }
  }
  async function loadDay(n) {
    if (dayCache[n]) return dayCache[n];
    var e = index.days.filter(function (d) { return d.n === n; })[0];
    if (!e) return null;
    var d = await getJSON('content/' + e.file);
    d.qmap = {};
    d.tests.forEach(function (ts) { ts.questions.forEach(function (q) { d.qmap[q.id] = q; }); });
    return (dayCache[n] = d);
  }
  function dayOfQ(id) { return parseInt(id.slice(1, 4), 10); }
  async function questionsFor(ids) {
    var out = [];
    for (var i = 0; i < ids.length; i++) { var d = await loadDay(dayOfQ(ids[i])); if (d && d.qmap[ids[i]]) out.push(d.qmap[ids[i]]); }
    return out;
  }

  /* ---------- derived state ---------- */
  function allAttempts() { return Object.keys(attempts).map(function (k) { return attempts[k]; }).sort(function (a, b) { return a.submittedAt < b.submittedAt ? -1 : 1; }); }
  function dailyOf(n) { return allAttempts().filter(function (a) { return a.day === n && a.test === 'daily'; }); }
  function attemptsOf(n, tid) { return allAttempts().filter(function (a) { return a.day === n && a.test === tid; }); }
  function currentDay() { var n = 1; while (dailyOf(n).length) n++; return n; }
  function maxDay() { return index.days.reduce(function (m, d) { return Math.max(m, d.n); }, 0); }
  function revisionDue() {
    var box = {};
    allAttempts().forEach(function (a) {
      var d = istDate(a.submittedAt);
      (a.answers || []).forEach(function (x) {
        if (!x.ok) box[x.id] = { i: 0, due: addDays(d, INTERVALS[0]) };
        else if (box[x.id]) { var b = box[x.id]; b.i++; if (b.i >= INTERVALS.length) delete box[x.id]; else b.due = addDays(d, INTERVALS[b.i]); }
      });
    });
    var today = istDate();
    return Object.keys(box).filter(function (id) { return box[id].due <= today; })
      .sort(function (a, b) { return box[a].due < box[b].due ? -1 : box[a].due > box[b].due ? 1 : (a < b ? -1 : 1); });
  }

  /* ---------- UI plumbing ---------- */
  var app = document.getElementById('app');
  var route = { r: 'home' };
  var ticker = null;
  function go(r, replace) {
    route = r;
    if (replace) history.replaceState(r, ''); else history.pushState(r, '');
    render();
  }
  window.addEventListener('popstate', function (e) { route = e.state || { r: 'home' }; closeModal(); render(); });
  function toast(msg) {
    var el = document.getElementById('toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(toast.h); toast.h = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }
  var modalActions = {};
  function modal(title, text, buttons) {
    var m = document.getElementById('modal'); modalActions = {};
    m.innerHTML = '<div class="box"><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p>' + buttons.map(function (b, i) {
      modalActions[i] = b.fn; return '<button class="btn ' + (b.primary ? 'primary' : '') + '" data-m="' + i + '">' + esc(b.label) + '</button>';
    }).join('') + '</div>';
    m.hidden = false;
  }
  function closeModal() { document.getElementById('modal').hidden = true; }
  document.getElementById('modal').addEventListener('click', function (e) {
    var b = e.target.closest('[data-m]'); if (!b) return;
    var fn = modalActions[b.getAttribute('data-m')]; closeModal(); if (fn) fn();
  });
  function top(title, back) {
    return '<div class="top">' + (back ? '<button class="btn-back" data-act="back">' + t('back') + '</button>' : '') +
      '<h1>' + esc(title) + '</h1><div class="lang" role="group" aria-label="மொழி / Language">' +
      '<button data-act="setlang" data-l="ta" class="' + (lang === 'ta' ? 'on' : '') + '" aria-pressed="' + (lang === 'ta') + '">தமிழ்</button>' +
      '<button data-act="setlang" data-l="en" class="' + (lang === 'en' ? 'on' : '') + '" aria-pressed="' + (lang === 'en') + '">English</button></div></div>' + banners();
  }
  function banners() {
    var h = '';
    if (VIEW) h += '<div class="banner">' + t('viewOnly') + '</div>';
    else if (!KEY) h += '<div class="banner">' + t('demo') + '</div>';
    if (!online) h += '<div class="banner">' + t('offline') + '</div>';
    h += '<div id="savebar">' + saveBar() + '</div>';
    return h;
  }
  function saveBar() {
    if (saveState === 'keybad') return '<div class="banner bad">' + t('keyBad') + '</div>';
    if (saveState === 'error' && pending.length) return '<div class="banner bad">' + t('notSaved') + '<button data-act="retry">' + t('retry') + '</button></div>';
    return '';
  }
  function paintSave() {
    var el = document.getElementById('savebar'); if (el) el.innerHTML = saveBar();
    var s = document.getElementById('savestate'); if (s && route.r === 'result') { var a = attempts[route.name]; if (a) s.outerHTML = saveLine(a); }
  }
  function nav(on) {
    return '<div class="nav"><button data-act="home" class="' + (on === 'home' ? 'on' : '') + '"><i>🏠</i>' + t('home') + '</button>' +
      '<button data-act="progress" class="' + (on === 'progress' ? 'on' : '') + '"><i>📈</i>' + t('progress') + '</button></div>';
  }
  function scoreText(list) { var b = bestOf(list); return list.length > 1 ? t('bestMeta', b.correct, b.total, list.length) : t('scoreMeta', b.correct, b.total); }
  function subjTitle(d, s) { var n = d.notes.filter(function (x) { return x.subject === s; })[0]; return n ? tx(n.title) : ''; }

  /* ---------- screens ---------- */
  function stepsHtml(d) {
    var h = '', k = 1, done = dailyOf(d.n);
    d.notes.forEach(function (n) {
      var r = reads['d' + pad(d.n, 3) + '-' + n.id];
      h += '<button class="step ' + (r ? 'done' : '') + '" data-act="notes" data-day="' + d.n + '" data-id="' + n.id + '"><span class="n">' + (r ? '✓' : k) + '</span>' +
        '<span class="t"><b>' + esc(t('readX', t(n.subject))) + '</b><span>' + esc(tx(n.title)) + '</span></span><span class="go">›</span></button>';
      k++;
    });
    d.tests.forEach(function (ts) {
      if (ts.kind !== 'daily') return;
      var meta = done.length ? scoreText(done) : t('testMeta', ts.questions.length, ts.minutes);
      h += '<button class="step main ' + (done.length ? 'done' : '') + '" data-act="intro" data-day="' + d.n + '" data-id="' + ts.id + '"><span class="n">' + (done.length ? '✓' : k) + '</span>' +
        '<span class="t"><b>' + esc(t('testToday')) + '</b><span>' + esc(meta) + '</span></span><span class="go">›</span></button>';
    });
    if (d.plan) h += '<details><summary>' + t('plan') + '</summary><div class="card notes">' + mdBlocks(tx(d.plan)) + '</div></details>';
    var ex = d.tests.filter(function (ts) { return ts.kind !== 'daily'; });
    if (ex.length) {
      h += '<p class="sub">' + t('extra') + '</p>';
      ex.forEach(function (ts) {
        var at = attemptsOf(d.n, ts.id);
        h += '<button class="step extra ' + (at.length ? 'done' : '') + '" data-act="intro" data-day="' + d.n + '" data-id="' + ts.id + '"><span class="n">' + (at.length ? '✓' : '+') + '</span>' +
          '<span class="t"><b>' + esc(tx(ts.title)) + '</b><span>' + esc(at.length ? scoreText(at) : t('testMeta', ts.questions.length, ts.minutes)) + '</span></span><span class="go">›</span></button>';
      });
    }
    return h;
  }
  async function homeScreen() {
    var cur = currentDay(), h = top(t('appTitle'), false);
    var left = daysBetween(istDate(), CFG.examDate);
    if (left >= 0) h += '<p class="count">' + t('daysLeft', left) + '</p>';
    var ip = LS.get('inprog', null);
    if (ip && !VIEW) h += '<div class="banner">' + t('resume') + '<button data-act="resume">' + t('resumeBtn') + '</button></div>';
    var prevDone = dailyOf(cur - 1);
    if (cur > 1 && prevDone.length && istDate(prevDone[0].submittedAt) === istDate()) h += '<div class="banner ok">' + t('doneToday', cur - 1) + '</div>';
    var due = revisionDue();
    if (cur <= maxDay()) {
      var d = await loadDay(cur);
      h += '<div class="card"><p class="sub">' + t('today') + '</p><h2>' + t('day', cur) + '</h2><p class="sub">' + esc(tx(d.title)) + '</p></div>' + stepsHtml(d);
    } else {
      h += '<div class="card"><h2>' + t('waitT') + '</h2><p>' + t('waitP') + '</p></div>';
    }
    if (due.length) h += '<div class="card"><h3>' + t('revTitle') + '</h3><p class="sub">' + t('revCard', due.length) + '</p><button class="btn primary" data-act="revision">' + t('revBtn') + '</button></div>';
    var older = index.days.filter(function (x) { return x.n < cur; }).sort(function (a, b) { return b.n - a.n; });
    if (older.length) {
      h += '<div class="card"><h3>' + t('older') + '</h3>';
      older.forEach(function (x) { var a = bestOf(dailyOf(x.n)); h += '<button class="item" data-act="day" data-day="' + x.n + '"><span class="t"><b>' + t('day', x.n) + '</b><span>' + esc(tx(x.title)) + '</span></span><span class="s">' + (a ? a.correct + ' / ' + a.total : '') + ' ›</span></button>'; });
      h += '</div>';
    }
    return h + nav('home');
  }
  async function dayScreen() {
    var d = await loadDay(route.day);
    return top(t('day', d.n), true) + '<div class="card"><h2>' + t('day', d.n) + '</h2><p class="sub">' + esc(tx(d.title)) + '</p></div>' + stepsHtml(d) + nav('');
  }
  async function notesScreen() {
    var d = await loadDay(route.day), n = d.notes.filter(function (x) { return x.id === route.id; })[0];
    return top(t(n.subject), true) + '<div class="card"><p class="sub">' + t('day', d.n) + '</p><h2>' + esc(tx(n.title)) + '</h2></div>' + mdCards(tx(n.md)) +
      '<div class="sticky"><button class="btn primary" data-act="read">' + t('readDone') + '</button></div>' + nav('');
  }
  async function introScreen() {
    var d = await loadDay(route.day), ts = d.tests.filter(function (x) { return x.id === route.id; })[0], at = attemptsOf(d.n, ts.id);
    var title = ts.kind === 'daily' ? t('testToday') : tx(ts.title);
    var h = top(t('day', d.n), true) + '<div class="card"><h2>' + esc(title) + '</h2><p class="sub">' + t('testMeta', ts.questions.length, ts.minutes) + '</p>' +
      '<ul><li>' + t('rules1') + '</li><li>' + t('rules2') + '</li><li>' + t('rules3') + '</li><li>' + t('rules4') + '</li>' + (at.length ? '<li>' + t('retakeNote') + '</li>' : '') + '</ul></div>';
    if (at.length) {
      h += '<div class="card"><h3>' + t('history') + '</h3>';
      at.forEach(function (a) { h += '<button class="item" data-act="result" data-name="' + esc(a._name) + '"><span class="t"><b>' + nice(a.submittedAt) + ' · ' + hhmm(a.submittedAt) + '</b>' + (at.length > 1 && a === bestOf(at) ? '<span>' + t('best') + '</span>' : '') + '</span><span class="s">' + a.correct + ' / ' + a.total + ' ›</span></button>'; });
      h += '</div>';
    }
    h += '<button class="btn primary" data-act="start">' + (at.length ? t('again') : t('start')) + '</button>';
    return h + nav('');
  }

  /* ---------- running a test ---------- */
  var run = null; // {day, tid, kind, minutes, questions, ans, active, startedAt, idx, list}
  function persistRun() { if (!run || VIEW) return; LS.set('inprog', { day: run.day, tid: run.tid, order: run.questions.map(function (q) { return q.id; }), ans: run.ans, active: run.active, startedAt: run.startedAt, idx: run.idx }); }
  async function beginRun(dayN, tid, saved) {
    var d = await loadDay(dayN), ts = d.tests.filter(function (x) { return x.id === tid; })[0];
    var prior = attemptsOf(dayN, tid).length, qs = null;
    if (saved) {
      qs = (saved.order || ts.questions.map(function (q) { return q.id; })).map(function (id) { return d.qmap[id]; });
      if (qs.length !== ts.questions.length || qs.some(function (q) { return !q; }) || saved.ans.length !== qs.length) { saved = null; qs = null; }
    }
    if (!qs) qs = prior ? shuffleSections(ts.questions) : ts.questions;
    run = { day: dayN, tid: tid, kind: ts.kind, minutes: ts.minutes, questions: qs, list: false, attemptNo: prior + 1,
      ans: saved ? saved.ans : qs.map(function () { return null; }), active: saved ? saved.active : 0,
      startedAt: saved ? saved.startedAt : new Date().toISOString(), idx: saved ? saved.idx : 0 };
    persistRun();
  }
  function runScreen() {
    if (!run) { route = { r: 'home' }; return homeScreen(); }
    var n = run.questions.length, left = run.minutes * 60 - run.active;
    var h = '<div class="tbar"><span class="qn">' + (run.list ? t('allTitle') : t('qOf', run.idx + 1, n)) + '</span><span id="timer" class="timer' + (left < 300 ? ' low' : '') + '">⏱ ' + clock(left) + '</span></div>';
    var answered = run.ans.filter(function (a) { return a != null; }).length;
    h += '<div class="bar"><i style="width:' + pct(answered, n) + '%"></i></div>';
    if (run.list) {
      h += '<p class="sub">' + t('allHelp') + '</p><div class="grid">' + run.ans.map(function (a, i) { return '<button data-act="jump" data-i="' + i + '" class="' + (a != null ? 'a ' : '') + (i === run.idx ? 'cur' : '') + '">' + (i + 1) + '</button>'; }).join('') + '</div>' +
        '<div class="foot"><div class="in"><button class="btn" data-act="list">' + t('backToQ') + '</button><button class="btn primary" data-act="finish">' + t('finish') + '</button></div></div>';
      return h;
    }
    var q = run.questions[run.idx];
    h += '<span class="tag">' + t(q.subject) + '</span><p class="q">' + esc(tx(q.q)) + '</p>';
    q.o.forEach(function (o, i) { h += '<button class="opt ' + (run.ans[run.idx] === i ? 'sel' : '') + '" data-act="pick" data-i="' + i + '"><span class="l">' + letter(i) + '</span><span class="x">' + esc(tx(o)) + '</span></button>'; });
    var last = run.idx === n - 1;
    h += '<div class="foot"><div class="in"><button class="btn sm" data-act="prev" ' + (run.idx ? '' : 'disabled') + '>' + t('prev') + '</button><button class="btn sm" data-act="list">' + t('all') + '</button>' +
      (last ? '<button class="btn primary" data-act="finish">' + t('finish') + '</button>' : '<button class="btn primary" data-act="next">' + t('next') + '</button>') + '</div></div>';
    return h;
  }
  function tick() {
    if (route.r !== 'run' || !run || document.hidden) return;
    run.active++;
    var left = run.minutes * 60 - run.active, el = document.getElementById('timer');
    if (el) { el.textContent = '⏱ ' + clock(left); el.classList.toggle('low', left < 300); }
    if (run.active % 5 === 0) persistRun();
    if (left <= 0) { closeModal(); toast(t('timeUp')); submitRun(); }
  }
  function grade(questions, ans) {
    var by = {}, correct = 0, answers = questions.map(function (q, i) {
      var ok = ans[i] === q.a; if (ok) correct++;
      by[q.subject] = by[q.subject] || { c: 0, t: 0 }; by[q.subject].t++; if (ok) by[q.subject].c++;
      return { id: q.id, p: ans[i], ok: ok };
    });
    return { correct: correct, total: questions.length, bySubject: by, answers: answers };
  }
  function store(a, label) {
    var stamp = a.submittedAt.replace(/\.\d+Z$/, 'Z').replace(/:/g, '-');
    a._name = stamp + '_' + label + '_s' + a.correct + 'of' + a.total + '.json';
    attempts[a._name] = a;
    if (!VIEW) { LS.set('attempts', attempts); var copy = Object.assign({}, a); delete copy._name; queue('attempts/' + a._name, copy); }
    return a._name;
  }
  function submitRun() {
    var g = grade(run.questions, run.ans);
    var a = Object.assign({ schema: 1, day: run.day, test: run.tid, kind: run.kind, attemptNo: run.attemptNo, date: istDate(), startedAt: run.startedAt, submittedAt: new Date().toISOString(), activeSeconds: run.active, allowedSeconds: run.minutes * 60 }, g);
    var name = store(a, 'd' + pad(run.day, 3) + '_' + run.tid);
    run = null; LS.del('inprog');
    go({ r: 'result', name: name, filter: 'wrong' }, true);
  }
  function askFinish() {
    var left = run.ans.filter(function (a) { return a == null; }).length;
    modal(t('confirmT'), left ? t('confirmLeft', left) : t('confirmAll'), [{ label: t('noCont') }, { label: t('yesFinish'), primary: true, fn: submitRun }]);
  }

  /* ---------- results ---------- */
  function saveLine(a) {
    if (VIEW && !/^\d{4}-.*Z_/.test(a._name || '')) return '<p id="savestate" class="save"></p>';
    if (VIEW) return '<p id="savestate" class="save"></p>';
    if (!KEY) return '<p id="savestate" class="save">' + t('localOnly') + '</p>';
    if (!isPending(a._name)) return '<p id="savestate" class="save ok">' + t('saved') + '</p>';
    if (saveState === 'saving') return '<p id="savestate" class="save">' + t('saving') + '</p>';
    return '<p id="savestate" class="save bad">' + t('localOnly') + '</p>';
  }
  function meters(by) {
    return SUBJECTS.filter(function (s) { return by[s] && by[s].t; }).map(function (s) {
      var p = pct(by[s].c, by[s].t);
      return '<div class="meter ' + (p < CFG.targetPercent ? 'low' : '') + '"><div class="lab"><span>' + t(s) + '</span><b>' + by[s].c + ' / ' + by[s].t + '</b></div><div class="track"><i style="width:' + p + '%"></i></div></div>';
    }).join('');
  }
  async function resultScreen() {
    var a = attempts[route.name];
    if (!a) { route = { r: 'home' }; return homeScreen(); }
    var p = pct(a.correct, a.total), qs = await questionsFor(a.answers.map(function (x) { return x.id; }));
    var qm = {}; qs.forEach(function (q) { qm[q.id] = q; });
    var title = a.test === 'rev' ? t('revDone') : t('result');
    var h = top(title, true) + '<div class="card score"><div class="big">' + a.correct + ' <small>/ ' + a.total + '</small></div><p>' + (p >= CFG.targetPercent ? t('hit') : p >= 60 ? t('near') : t('low')) + '</p>' +
      '<p class="sub">' + t('target', CFG.targetPercent) + (a.activeSeconds ? ' · ⏱ ' + clock(a.activeSeconds) : '') + '</p></div>' + saveLine(a) +
      '<div class="card">' + meters(a.bySubject) + '</div>';
    var wrong = a.answers.filter(function (x) { return !x.ok; });
    h += '<div class="row"><button class="btn ' + (route.filter === 'wrong' ? 'primary' : '') + '" data-act="filter" data-f="wrong">' + t('seeWrong', wrong.length) + '</button><button class="btn ' + (route.filter === 'all' ? 'primary' : '') + '" data-act="filter" data-f="all">' + t('seeAll') + '</button></div>';
    var list = route.filter === 'all' ? a.answers : wrong;
    h += '<div class="card">';
    if (!list.length) h += '<p>' + t('noWrong') + '</p>';
    list.forEach(function (x) {
      var q = qm[x.id]; if (!q) return;
      var num = a.answers.indexOf(x) + 1;
      h += '<div class="rev"><p class="q">' + num + '. ' + esc(tx(q.q)) + '</p>';
      if (!x.ok) h += '<p class="a no">' + esc(t('yours', x.p == null ? t('notAns') : letter(x.p) + ') ' + tx(q.o[x.p]))) + '</p>';
      h += '<p class="a ok">' + esc(t('right', letter(q.a) + ') ' + tx(q.o[q.a]))) + '</p>';
      if (q.x) h += '<p class="e">' + esc(tx(q.x)) + '</p>';
      h += '</div>';
    });
    h += '</div><button class="btn primary" data-act="home">' + t('goHome') + '</button>';
    return h + nav('');
  }

  /* ---------- revision ---------- */
  var rev = null; // {questions, ans, idx, shown}
  async function beginRevision() {
    var ids = revisionDue().slice(0, 20);
    rev = { questions: await questionsFor(ids), ans: [], idx: 0, shown: false, startedAt: new Date().toISOString() };
  }
  function revisionScreen() {
    if (!rev || !rev.questions.length) { route = { r: 'home' }; return homeScreen(); }
    var q = rev.questions[rev.idx], n = rev.questions.length, picked = rev.ans[rev.idx];
    var h = top(t('revTitle'), true) + '<div class="bar"><i style="width:' + pct(rev.idx + (rev.shown ? 1 : 0), n) + '%"></i></div><p class="sub">' + t('qOf', rev.idx + 1, n) + '</p>' +
      '<span class="tag">' + t(q.subject) + '</span><p class="q">' + esc(tx(q.q)) + '</p>';
    q.o.forEach(function (o, i) {
      var cls = rev.shown ? (i === q.a ? 'right' : i === picked ? 'wrong' : '') : '';
      h += '<button class="opt ' + cls + '" data-act="revpick" data-i="' + i + '" ' + (rev.shown ? 'disabled' : '') + '><span class="l">' + letter(i) + '</span><span class="x">' + esc(tx(o)) + '</span></button>';
    });
    if (rev.shown) {
      h += '<div class="exp"><b>' + (picked === q.a ? t('revRight') : t('revWrong')) + '</b>' + (q.x ? '<br>' + esc(tx(q.x)) : '') + '</div>';
      h += '<div class="foot"><div class="in"><button class="btn primary" data-act="revnext">' + (rev.idx === n - 1 ? t('finish') : t('next')) + '</button></div></div>';
    }
    return h;
  }
  function finishRevision() {
    var g = grade(rev.questions, rev.ans);
    var a = Object.assign({ schema: 1, day: 0, test: 'rev', kind: 'revision', date: istDate(), startedAt: rev.startedAt, submittedAt: new Date().toISOString() }, g);
    var name = store(a, 'rev'); rev = null;
    go({ r: 'result', name: name, filter: 'wrong' }, true);
  }

  /* ---------- progress ---------- */
  function progressScreen() {
    var all = allAttempts(), tests = all.filter(function (a) { return a.test !== 'rev'; });
    var firsts = []; for (var n = 1; n < currentDay(); n++) firsts.push(bestOf(dailyOf(n)));
    var c = 0, tt = 0, by = {};
    firsts.forEach(function (a) { c += a.correct; tt += a.total; });
    tests.forEach(function (a) { SUBJECTS.forEach(function (s) { if (a.bySubject[s]) { by[s] = by[s] || { c: 0, t: 0 }; by[s].c += a.bySubject[s].c; by[s].t += a.bySubject[s].t; } }); });
    var left = Math.max(0, daysBetween(istDate(), CFG.examDate));
    var h = top(t('progress'), false) + '<div class="tiles"><div class="tile"><b>' + firsts.length + '</b><span>' + t('daysDone') + '</span></div><div class="tile"><b>' + (tt ? pct(c, tt) + '%' : '–') + '</b><span>' + t('avg') + '</span></div><div class="tile"><b>' + left + '</b><span>' + t('left') + '</span></div></div>';
    if (!all.length) return h + '<div class="card"><p>' + t('none') + '</p></div>' + nav('progress');
    var weak = SUBJECTS.filter(function (s) { return by[s] && pct(by[s].c, by[s].t) < CFG.targetPercent; }).sort(function (a, b) { return by[a].c / by[a].t - by[b].c / by[b].t; });
    h += '<div class="card"><h3>' + t('bySubject') + '</h3>' + meters(by) + (weak.length ? '<p class="sub">' + t('weak', t(weak[0])) + '</p>' : '') + '</div>';
    h += '<div class="card"><h3>' + t('history') + '</h3>';
    all.slice().reverse().forEach(function (a) {
      var label = a.test === 'rev' ? t('rev') : t('day', a.day) + ' · ' + (a.test === 'daily' ? t('testToday') : t('extraTest'));
      h += '<button class="item" data-act="result" data-name="' + esc(a._name) + '"><span class="t"><b>' + esc(label) + '</b><span>' + nice(a.submittedAt) + ' · ' + hhmm(a.submittedAt) + '</span></span><span class="s">' + a.correct + ' / ' + a.total + ' ›</span></button>';
    });
    return h + '</div>' + nav('progress');
  }

  /* ---------- render + events ---------- */
  var SCREENS = { home: homeScreen, day: dayScreen, notes: notesScreen, intro: introScreen, run: runScreen, result: resultScreen, revision: revisionScreen, progress: progressScreen };
  var renderSeq = 0;
  async function render(keepScroll) {
    var seq = ++renderSeq;
    document.documentElement.lang = lang;
    document.title = t('appTitle');
    try {
      var html = await (SCREENS[route.r] || homeScreen)();
      if (seq !== renderSeq) return;
      app.innerHTML = html;
    } catch (e) {
      if (seq !== renderSeq) return;
      app.innerHTML = top(t('appTitle'), route.r !== 'home') + '<div class="card"><p>' + t('loadFail') + '</p><button class="btn primary" data-act="reload">' + t('tryAgain') + '</button></div>';
    }
    if (!keepScroll) window.scrollTo(0, 0);
  }
  app.addEventListener('click', async function (e) {
    var b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    var act = b.getAttribute('data-act'), day = +b.getAttribute('data-day'), id = b.getAttribute('data-id'), i = +b.getAttribute('data-i');
    switch (act) {
      case 'back': history.length > 1 && history.state ? history.back() : go({ r: 'home' }, true); break;
      case 'setlang': lang = b.getAttribute('data-l') === 'en' ? 'en' : 'ta'; LS.set('lang', lang); render(true); break;
      case 'home': go({ r: 'home' }); break;
      case 'progress': go({ r: 'progress' }); break;
      case 'day': go({ r: 'day', day: day }); break;
      case 'notes': go({ r: 'notes', day: day, id: id }); break;
      case 'intro': go({ r: 'intro', day: day, id: id }); break;
      case 'read':
        var key = 'd' + pad(route.day, 3) + '-' + route.id;
        if (!reads[key]) { reads[key] = true; if (!VIEW) LS.set('reads', reads); queue('reads/' + key + '.json', { day: route.day, subject: route.id, readAt: new Date().toISOString() }); }
        toast(t('readSaved')); history.back(); break;
      case 'start': await beginRun(route.day, route.id, null); go({ r: 'run' }, true); break;
      case 'resume': var ip = LS.get('inprog', null); if (ip) { await beginRun(ip.day, ip.tid, ip); go({ r: 'run' }); } break;
      case 'pick': run.ans[run.idx] = run.ans[run.idx] === i ? null : i; persistRun(); render(true); break;
      case 'prev': if (run.idx) { run.idx--; persistRun(); render(); } break;
      case 'next': run.idx++; persistRun(); render(); break;
      case 'list': run.list = !run.list; render(); break;
      case 'jump': run.idx = i; run.list = false; persistRun(); render(); break;
      case 'finish': askFinish(); break;
      case 'result': go({ r: 'result', name: b.getAttribute('data-name'), filter: 'wrong' }); break;
      case 'filter': route.filter = b.getAttribute('data-f'); history.replaceState(route, ''); render(true); break;
      case 'revision': await beginRevision(); go({ r: 'revision' }); break;
      case 'revpick': rev.ans[rev.idx] = i; rev.shown = true; render(true); break;
      case 'revnext': if (rev.idx === rev.questions.length - 1) finishRevision(); else { rev.idx++; rev.shown = false; render(); } break;
      case 'retry': saveState = 'idle'; flush(); break;
      case 'reload': location.reload(); break;
    }
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden) persistRun(); else flush(); });
  window.addEventListener('online', function () { flush(); });

  (async function boot() {
    history.replaceState({ r: 'home' }, '');
    if (PREVIEW) { history.pushState({ r: 'day', day: PREVIEW }, ''); route = { r: 'day', day: PREVIEW }; }
    try { index = await getJSON('content/index.json'); } catch (e) {
      app.innerHTML = '<div class="card" style="margin-top:24px"><p>' + t('loadFail') + '</p><button class="btn primary" data-act="reload">' + t('tryAgain') + '</button></div>'; return;
    }
    if (VIEW) { attempts = {}; reads = {}; pending = []; }
    if (Object.keys(attempts).length || !KEY || PREVIEW) render();
    await sync();
    if (route.r === 'home' || route.r === 'progress') render(true);
    ticker = setInterval(tick, 1000);
  })();
})();
