/* Tender Pickle Scoreboard - UI. Rules live in engine.js. */
(function () {
  'use strict';

  var E = PickleEngine;
  var KEY = 'tps.v1';

  var I18N = {
    'zh-TW': {
      left: '左邊隊伍', right: '右邊隊伍', leftSide: '左邊', rightSide: '右邊',
      point: '+1 得分', receiving: '接發方', fault: '發球方失誤', undo: '復原', flip: '換邊',
      settings: '設定', newGame: '長按新局', newGameShort: '新局', callout: '報分',
      serverN: '第{n}發', sideRight: '右區發球', sideLeft: '左區發球', courtL: '左', courtR: '右',
      winner: '{name} 獲勝', holdHint: '請長按 0.7 秒開始新局',
      confirmNew: '要開始新局嗎？目前的比分會清除。',
      confirmRestart: '更改規則會重新開始新局，確定嗎？',
      sTitle: '設定', sMode: '賽制', singles: '單打', doubles: '雙打', sTarget: '目標分數',
      sWinBy2: '需領先 2 分才獲勝', sFirst: '先發球', sLang: '語言', sWake: '保持螢幕恆亮',
      sNote: '賽制、分數、先發球的變更會重新開始新局。', save: '儲存', cancel: '取消',
      nameLabel: '隊名（可留空）',
      voiceOn: '語音報分：開', voiceOff: '語音報分：關', voiceTest: '語音報分已開啟',
      sVoice: '語音報分', sVoiceTeam: '報分前先講發球隊名稱', sRate: '語速', sVolume: '音量',
      spSideOut: '換發', spServing: '{name}發球', spWins: '{name}獲勝，{a}比{b}', spServer: '{n}',
      sVoiceName: '語音', voiceAuto: '自動（優先台灣國語）', voiceTry: '試聽', voiceSample: '換發，4，2，1',
      noTwVoice: '找不到台灣國語聲音，可能會用其他中文口音。請在裝置的語音設定下載「中文（台灣）」。'
    },
    en: {
      left: 'Left Team', right: 'Right Team', leftSide: 'Left', rightSide: 'Right',
      point: '+1 Point', receiving: 'Receiving', fault: 'Server Fault', undo: 'Undo', flip: 'Swap Sides',
      settings: 'Settings', newGame: 'Hold: New Game', newGameShort: 'New Game', callout: 'Score',
      serverN: 'Server {n}', sideRight: 'Serve from right', sideLeft: 'Serve from left', courtL: 'L', courtR: 'R',
      winner: '{name} wins', holdHint: 'Hold for 0.7 s to start a new game',
      confirmNew: 'Start a new game? The current score will be cleared.',
      confirmRestart: 'Changing the rules starts a new game. Continue?',
      sTitle: 'Settings', sMode: 'Format', singles: 'Singles', doubles: 'Doubles', sTarget: 'Play to',
      sWinBy2: 'Win by 2', sFirst: 'First serve', sLang: 'Language', sWake: 'Keep screen on',
      sNote: 'Changing format, target or first serve starts a new game.', save: 'Save', cancel: 'Cancel',
      nameLabel: 'Team name (optional)',
      voiceOn: 'Voice score: on', voiceOff: 'Voice score: off', voiceTest: 'Voice score is on',
      sVoice: 'Announce score by voice', sVoiceTeam: 'Say the serving team name first', sRate: 'Speed', sVolume: 'Volume',
      spSideOut: 'Side out', spServing: '{name} serving', spWins: '{name} wins, {a} to {b}', spServer: '{n}',
      sVoiceName: 'Voice', voiceAuto: 'Auto', voiceTry: 'Test voice', voiceSample: 'Side out, 4, 2, 1',
      noTwVoice: 'No Taiwan Mandarin voice found; another Chinese voice may be used. Download "Chinese (Taiwan)" in your device voice settings.'
    }
  };

  var DEFAULTS = {
    mode: 'doubles', target: 11, winByTwo: true, firstSlot: 0, wake: true,
    voice: false, voiceTeam: false, voiceName: '', rate: 1, volume: 1,
    lang: /^zh/i.test(navigator.language || '') ? 'zh-TW' : 'en'
  };

  var state = load();

  /* ---------- state ---------- */
  function newGameFor(settings, flip) {
    return E.createGame({
      mode: settings.mode,
      target: settings.target,
      winByTwo: settings.winByTwo,
      firstServer: flip ? 1 - settings.firstSlot : settings.firstSlot
    });
  }
  function fresh() {
    var settings = Object.assign({}, DEFAULTS);
    return { settings: settings, names: [null, null], flip: false, game: newGameFor(settings, false), history: [] };
  }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.game && s.settings && s.names) {
        s.settings = Object.assign({}, DEFAULTS, s.settings);
        s.history = s.history || [];
        return s;
      }
    } catch (e) { /* ignore */ }
    return fresh();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function t(key, vars) {
    var dict = I18N[state.settings.lang] || I18N.en;
    var s = dict[key] != null ? dict[key] : key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
    return s;
  }
  function teamAt(slot) { return state.flip ? 1 - slot : slot; }
  function slotOf(team) { return state.flip ? 1 - team : team; }
  function teamName(team) {
    return state.names[team] || (slotOf(team) === 0 ? t('left') : t('right'));
  }

  /* ---------- elements ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var slots = [0, 1].map(function (i) {
    var el = $('slot' + i);
    return {
      el: el,
      name: el.querySelector('.name'),
      score: el.querySelector('.score'),
      lamps: el.querySelectorAll('.lamp'),
      info: el.querySelector('.serve-info'),
      court: el.querySelectorAll('.court i'),
      point: el.querySelector('.point')
    };
  });

  /* ---------- render ---------- */
  function render() {
    var g = state.game;
    document.documentElement.lang = state.settings.lang;
    document.querySelectorAll('[data-i18n]').forEach(function (n) { n.textContent = t(n.getAttribute('data-i18n')); });

    slots.forEach(function (sl, slot) {
      var team = teamAt(slot);
      var serving = !g.over && g.server === team;
      sl.el.dataset.team = team;
      sl.el.classList.toggle('serving', serving);
      sl.el.classList.toggle('single', g.mode === 'singles');
      sl.el.classList.toggle('winner', g.over && g.winner === team);

      if (document.activeElement !== sl.name) sl.name.value = state.names[team] || '';
      sl.name.placeholder = slot === 0 ? t('left') : t('right');
      sl.name.setAttribute('aria-label', t('nameLabel'));

      sl.score.textContent = g.scores[team];

      sl.lamps.forEach(function (lamp) {
        lamp.classList.toggle('on', serving && Number(lamp.dataset.n) === g.serverNum);
      });

      var side = E.serveSide(g);
      sl.info.textContent = serving
        ? (g.mode === 'doubles' ? t('serverN', { n: g.serverNum }) + ' · ' : '') + (side === 'right' ? t('sideRight') : t('sideLeft'))
        : '';
      sl.court.forEach(function (c) {
        c.textContent = c.dataset.side === 'left' ? t('courtL') : t('courtR');
        c.classList.toggle('on', serving && c.dataset.side === side);
      });

      sl.point.disabled = !serving;
      sl.point.textContent = serving ? t('point') : (g.over ? '—' : t('receiving'));
    });

    $('callout').textContent = E.callout(g);
    $('undo').disabled = state.history.length === 0;
    $('fault').disabled = g.over;
    var vb = $('voice'), vOn = state.settings.voice;
    vb.textContent = vOn ? '🔊' : '🔇';
    vb.setAttribute('aria-pressed', String(vOn));
    vb.setAttribute('aria-label', t(vOn ? 'voiceOn' : 'voiceOff'));
    vb.title = t(vOn ? 'voiceOn' : 'voiceOff');

    var over = $('over');
    over.hidden = !g.over;
    if (g.over) {
      var w = g.winner;
      $('over-title').textContent = t('winner', { name: teamName(w) });
      $('over-score').textContent = g.scores[w] + ' – ' + g.scores[1 - w];
    }
  }

  /* ---------- actions ---------- */
  function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 15); } catch (e) { /* ignore */ } }

  function apply(next) {
    var prev = state.game;
    state.history.push(prev);
    if (state.history.length > 300) state.history.shift();
    state.game = next;
    save();
    render();
    buzz();
    announce(prev);
  }
  function shake(slot) {
    var b = slots[slot].point;
    b.classList.remove('shake');
    void b.offsetWidth;
    b.classList.add('shake');
  }
  function point(slot) {
    var g = state.game, team = teamAt(slot);
    if (g.over || g.server !== team) { shake(slot); return; }
    apply(E.scorePoint(g));
  }
  function fault() { if (!state.game.over) apply(E.serverFault(state.game)); }
  function undo() {
    if (!state.history.length) return;
    state.game = state.history.pop();
    save();
    render();
  }
  function flip() { state.flip = !state.flip; save(); render(); }
  function newGame() {
    state.game = newGameFor(state.settings, state.flip);
    state.history = [];
    save();
    render();
  }

  var toastTimer;
  function toast(msg) {
    var el = $('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 1800);
  }

  /* ---------- wiring ---------- */
  slots.forEach(function (sl, slot) {
    sl.point.addEventListener('click', function () { point(slot); });
    sl.name.addEventListener('input', function () {
      state.names[teamAt(slot)] = sl.name.value.trim() ? sl.name.value : null;
      save();
      if (state.game.over) render();
    });
    sl.name.addEventListener('keydown', function (e) { if (e.key === 'Enter') sl.name.blur(); });
    sl.name.addEventListener('blur', function () { render(); });
  });
  $('fault').addEventListener('click', fault);
  $('undo').addEventListener('click', undo);
  $('flip').addEventListener('click', flip);
  $('voice').addEventListener('click', function () {
    state.settings.voice = !state.settings.voice;
    save();
    render();
    // This tap is also the user gesture that unlocks speech on iOS.
    if (state.settings.voice) speak(t('voiceTest')); else if (canSpeak) speechSynthesis.cancel();
  });
  $('over-undo').addEventListener('click', undo);
  $('over-new').addEventListener('click', newGame);

  // New game: hold 0.7 s (touch/mouse); keyboard activation asks for confirmation.
  var ng = $('newgame'), holdTimer = null;
  function cancelHold() {
    ng.classList.remove('holding');
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; return true; }
    return false;
  }
  ng.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    ng.classList.add('holding');
    holdTimer = setTimeout(function () {
      holdTimer = null;
      ng.classList.remove('holding');
      newGame();
      buzz(40);
    }, 700);
  });
  ng.addEventListener('pointerup', function () { if (cancelHold()) toast(t('holdHint')); });
  ng.addEventListener('pointerleave', cancelHold);
  ng.addEventListener('pointercancel', cancelHold);
  ng.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  ng.addEventListener('click', function (e) {
    if (e.detail === 0 && window.confirm(t('confirmNew'))) newGame();
  });

  /* ---------- settings dialog ---------- */
  var dlg = $('dlg'), form = $('form');
  function openSettings() {
    var s = state.settings;
    form.mode.value = s.mode;
    form.target.value = String(s.target);
    form.winByTwo.checked = s.winByTwo;
    form.firstSlot.value = String(s.firstSlot);
    form.lang.value = s.lang;
    form.wake.checked = s.wake;
    form.voice.checked = s.voice;
    form.voiceTeam.checked = s.voiceTeam;
    form.rate.value = String(s.rate);
    form.volume.value = String(s.volume);
    if (canSpeak) populateVoices(s.lang, s.voiceName);
    dlg.showModal();
  }
  $('settings').addEventListener('click', openSettings);
  $('dlg-cancel').addEventListener('click', function () { dlg.close(); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var s = state.settings;
    var next = {
      mode: form.mode.value,
      target: Number(form.target.value),
      winByTwo: form.winByTwo.checked,
      firstSlot: Number(form.firstSlot.value),
      lang: form.lang.value,
      wake: form.wake.checked,
      voice: form.voice.checked,
      voiceTeam: form.voiceTeam.checked,
      rate: Number(form.rate.value),
      volume: Number(form.volume.value),
      voiceName: form.voiceName.value
    };
    var rulesChanged = next.mode !== s.mode || next.target !== s.target ||
      next.winByTwo !== s.winByTwo || next.firstSlot !== s.firstSlot;
    var inProgress = state.history.length > 0 || state.game.scores[0] + state.game.scores[1] > 0;
    if (rulesChanged && inProgress && !window.confirm(I18N[next.lang].confirmRestart)) return;
    state.settings = next;
    if (rulesChanged) newGame(); else { save(); render(); }
    dlg.close();
    if (next.wake) requestWake(); else releaseWake();
  });

  /* ---------- keyboard (desktop) ---------- */
  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || dlg.open || e.metaKey || e.altKey) return;
    var k = e.key;
    if (k === 'ArrowLeft') { point(0); e.preventDefault(); }
    else if (k === 'ArrowRight') { point(1); e.preventDefault(); }
    else if (k === ' ' && tag !== 'BUTTON') { fault(); e.preventDefault(); }
    else if (k === 'z' || k === 'Z') { undo(); }
    else if (k === 'f' || k === 'F') { flip(); }
  });

  /* ---------- keep screen awake ---------- */
  var wakeLock = null;
  function requestWake() {
    if (!state.settings.wake || !navigator.wakeLock || wakeLock) return;
    navigator.wakeLock.request('screen').then(function (l) {
      wakeLock = l;
      l.addEventListener('release', function () { wakeLock = null; });
    }).catch(function () { /* not allowed (battery saver, etc.) */ });
  }
  function releaseWake() { if (wakeLock) { wakeLock.release(); wakeLock = null; } }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') requestWake(); });
  document.addEventListener('pointerdown', requestWake, { once: true });

  /* ---------- voice score (Web Speech API) ---------- */
  var canSpeak = 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

  function voiceLang(setting) { return setting === 'zh-TW' ? 'zh-TW' : 'en-US'; }
  function normLang(v) { return v.lang.replace('_', '-').toLowerCase(); }

  // Chosen voice by name, else an exact zh-TW / en-US match, else any voice of the same language.
  function pickVoice(lang, name) {
    var voices = speechSynthesis.getVoices();
    if (name) {
      var named = voices.filter(function (x) { return x.name === name; })[0];
      if (named) return named;
    }
    var want = lang.toLowerCase();
    return voices.filter(function (x) { return normLang(x) === want; })[0] ||
           voices.filter(function (x) { return normLang(x).indexOf(want.slice(0, 2)) === 0; })[0];
  }

  // o: optional overrides { lang, voiceName, rate, volume } (used by the settings test button)
  function speak(text, o) {
    if (!canSpeak || !text) return;
    o = o || {};
    var s = state.settings;
    var lang = voiceLang(o.lang || s.lang);
    var u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = o.rate != null ? o.rate : s.rate;
    u.volume = o.volume != null ? o.volume : s.volume;
    var v = pickVoice(lang, o.voiceName != null ? o.voiceName : s.voiceName);
    if (v) u.voice = v;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  // Fill the voice <select> with this device's voices for the chosen language.
  function populateVoices(langSetting, selected) {
    var sel = form.voiceName, lang = voiceLang(langSetting), want = lang.toLowerCase();
    var voices = speechSynthesis.getVoices().filter(function (x) { return normLang(x).indexOf(want.slice(0, 2)) === 0; });
    voices.sort(function (a, b) {
      return (normLang(a) === want ? 0 : 1) - (normLang(b) === want ? 0 : 1) || a.name.localeCompare(b.name);
    });
    sel.innerHTML = '';
    var auto = document.createElement('option');
    auto.value = '';
    auto.textContent = I18N[langSetting].voiceAuto;
    sel.appendChild(auto);
    voices.forEach(function (v) {
      var opt = document.createElement('option');
      opt.value = v.name;
      opt.textContent = v.name + ' (' + v.lang + ')';
      sel.appendChild(opt);
    });
    sel.value = voices.some(function (v) { return v.name === selected; }) ? selected : '';
    var hasTw = voices.some(function (v) { return normLang(v) === want; });
    $('voice-warn').hidden = !(lang === 'zh-TW' && voices.length > 0 && !hasTw);
  }
  if (canSpeak && speechSynthesis.addEventListener) {
    speechSynthesis.addEventListener('voiceschanged', function () {
      if (dlg.open) populateVoices(form.lang.value, form.voiceName.value);
    });
  }
  form.addEventListener('change', function (e) {
    if (canSpeak && e.target.name === 'lang') populateVoices(e.target.value, '');
  });
  $('voice-try').addEventListener('click', function () {
    speak(I18N[form.lang.value].voiceSample, {
      lang: form.lang.value,
      voiceName: form.voiceName.value,
      rate: Number(form.rate.value),
      volume: Number(form.volume.value)
    });
  });

  // Speak the new score after a point or fault. `prev` is the state before the action.
  function announce(prev) {
    if (!state.settings.voice) return;
    var g = state.game;
    if (g.over) {
      speak(t('spWins', { name: teamName(g.winner), a: g.scores[g.winner], b: g.scores[1 - g.winner] }));
      return;
    }
    var parts = [];
    if (g.server !== prev.server) parts.push(t('spSideOut'));
    if (state.settings.voiceTeam) parts.push(t('spServing', { name: teamName(g.server) }));
    parts.push(g.scores[g.server], g.scores[1 - g.server]);
    if (g.mode === 'doubles') parts.push(t('spServer', { n: g.serverNum }));
    speak(parts.join(state.settings.lang === 'zh-TW' ? '，' : ', '));
  }
  if (canSpeak && speechSynthesis.getVoices) speechSynthesis.getVoices(); // warm up the voice list

  /* ---------- go ---------- */
  if (!canSpeak) { $('voice').hidden = true; $('voice-rows').hidden = true; }
  render();
  requestWake();
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(function () { /* offline cache is optional */ });
  }
})();
