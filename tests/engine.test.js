/* Tiny dependency-free tests for engine.js (runs in a browser, no build step). */
var E = typeof PickleEngine !== 'undefined' ? PickleEngine : require('../engine.js');
var tests = [];
function test(name, fn) { tests.push([name, fn]); }
function eq(a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((msg || 'eq') + ': got ' + JSON.stringify(a) + ' expected ' + JSON.stringify(b));
}

function pts(s, n) { for (var i = 0; i < n; i++) s = E.scorePoint(s); return s; }

test('doubles starts at 0-0-2 for the first server', function () {
  var s = E.createGame({ mode: 'doubles', firstServer: 0 });
  eq(E.callout(s), '0-0-2');
  eq(s.server, 0);
});

test('doubles: first fault of the game is an immediate side out', function () {
  var s = E.serverFault(E.createGame({ mode: 'doubles', firstServer: 0 }));
  eq(s.server, 1);
  eq(s.serverNum, 1);
  eq(E.callout(s), '0-0-1');
});

test('doubles: server 1 fault -> server 2 of the same team', function () {
  var s = E.serverFault(E.createGame({ firstServer: 0 })); // side out to team 1 (server 1)
  s = pts(s, 3);
  eq(E.callout(s), '3-0-1');
  s = E.serverFault(s);
  eq(s.server, 1);
  eq(s.serverNum, 2);
  eq(E.callout(s), '3-0-2');
});

test('doubles: server 2 fault -> side out, other team starts at server 1', function () {
  var s = E.serverFault(E.createGame({ firstServer: 0 })); // team 1, server 1
  s = E.serverFault(s); // team 1, server 2
  s = pts(s, 2);
  s = E.serverFault(s); // side out to team 0
  eq(s.server, 0);
  eq(s.serverNum, 1);
  eq(E.callout(s), '0-2-1');
});

test('only the serving team scores', function () {
  var s = E.createGame({ firstServer: 1 });
  s = E.scorePoint(s);
  eq(s.scores, [0, 1]);
});

test('serve side follows the serving team score parity', function () {
  var s = E.createGame({ firstServer: 0 });
  eq(E.serveSide(s), 'right');
  s = E.scorePoint(s);
  eq(E.serveSide(s), 'left');
  s = E.scorePoint(s);
  eq(E.serveSide(s), 'right');
});

test('win at target with a 2 point lead', function () {
  var s = pts(E.createGame({ firstServer: 0 }), 11);
  eq(s.over, true);
  eq(s.winner, 0);
});

test('11-10 is not a win when win-by-two is on', function () {
  var s = E.createGame({ firstServer: 0, winByTwo: true });
  s.scores = [10, 10];
  s = E.scorePoint(s);
  eq(s.over, false);
  eq(s.scores, [11, 10]);
  s = E.scorePoint(s);
  eq(s.over, true);
  eq(s.winner, 0);
});

test('11-10 wins when win-by-two is off', function () {
  var s = E.createGame({ firstServer: 0, winByTwo: false });
  s.scores = [10, 10];
  s = E.scorePoint(s);
  eq(s.over, true);
});

test('custom target (15)', function () {
  var s = E.createGame({ firstServer: 0, target: 15 });
  s.scores = [14, 3];
  eq(E.scorePoint(s).over, true);
  s.scores = [13, 3];
  eq(E.scorePoint(s).over, false);
});

test('team 1 (second index) can win as the serving team', function () {
  var s = E.createGame({ firstServer: 1 });
  s.scores = [10, 10];
  s = E.scorePoint(s);
  eq(s.over, false);
  s = E.scorePoint(s);
  eq(s.winner, 1);
});

test('no changes after the game is over', function () {
  var s = pts(E.createGame({ firstServer: 0 }), 11);
  eq(E.scorePoint(s).scores, [11, 0]);
  eq(E.serverFault(s).server, s.server);
});

test('singles: callout has two numbers, fault is a side out', function () {
  var s = E.createGame({ mode: 'singles', firstServer: 0 });
  eq(E.callout(s), '0-0');
  s = E.scorePoint(s);
  eq(E.callout(s), '1-0');
  s = E.serverFault(s);
  eq(s.server, 1);
  eq(E.callout(s), '0-1');
});

test('singles: serve side by own score parity', function () {
  var s = E.createGame({ mode: 'singles', firstServer: 0 });
  eq(E.serveSide(s), 'right');
  s = E.scorePoint(s);
  eq(E.serveSide(s), 'left');
});

test('functions do not mutate the previous state', function () {
  var s = E.createGame({ firstServer: 0 });
  var snapshot = JSON.stringify(s);
  E.scorePoint(s);
  E.serverFault(s);
  eq(JSON.stringify(s), snapshot);
});

function runAll() {
  var passed = 0, failed = 0, log = [];
  tests.forEach(function (t) {
    try { t[1](); passed++; log.push('ok   ' + t[0]); }
    catch (e) { failed++; log.push('FAIL ' + t[0] + ' -> ' + e.message); }
  });
  return { passed: passed, failed: failed, log: log };
}
if (typeof module === 'object' && module.exports) module.exports = { runAll: runAll };
