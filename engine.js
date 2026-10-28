/*
 * Tender Pickle Scoreboard - rules engine
 * Pure functions, no DOM. Every function returns a new state object.
 *
 * Side-out (traditional) scoring:
 *  - only the serving team scores
 *  - doubles: each team has server 1 and server 2; the first serving team of a game
 *    starts with only one server (0-0-2), so its first fault is a side out
 *  - serve side: serving team's own score even -> right court, odd -> left court
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PickleEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function createGame(opts) {
    opts = opts || {};
    var mode = opts.mode === 'singles' ? 'singles' : 'doubles';
    return {
      mode: mode,
      target: opts.target || 11,
      winByTwo: opts.winByTwo !== false,
      scores: [0, 0],
      server: opts.firstServer === 1 ? 1 : 0, // team index that is serving
      serverNum: mode === 'doubles' ? 2 : 1,  // 0-0-2 start rule in doubles
      over: false,
      winner: null
    };
  }

  function clone(s) {
    return {
      mode: s.mode,
      target: s.target,
      winByTwo: s.winByTwo,
      scores: [s.scores[0], s.scores[1]],
      server: s.server,
      serverNum: s.serverNum,
      over: s.over,
      winner: s.winner
    };
  }

  function isWinner(s, team) {
    var mine = s.scores[team];
    var theirs = s.scores[1 - team];
    if (mine < s.target) return false;
    return s.winByTwo ? mine - theirs >= 2 : mine > theirs;
  }

  // The serving team won the rally.
  function scorePoint(s) {
    if (s.over) return s;
    var n = clone(s);
    n.scores[n.server] += 1;
    if (isWinner(n, n.server)) {
      n.over = true;
      n.winner = n.server;
    }
    return n;
  }

  // The serving team lost the rally (fault).
  function serverFault(s) {
    if (s.over) return s;
    var n = clone(s);
    if (n.mode === 'doubles' && n.serverNum === 1) {
      n.serverNum = 2;
    } else {
      n.server = 1 - n.server;
      n.serverNum = 1;
    }
    return n;
  }

  // 'right' or 'left' court for the current server.
  function serveSide(s) {
    return s.scores[s.server] % 2 === 0 ? 'right' : 'left';
  }

  // Score call: doubles "4-2-1" (server - receiver - server number), singles "4-2".
  function callout(s) {
    var a = s.scores[s.server];
    var b = s.scores[1 - s.server];
    return s.mode === 'doubles' ? a + '-' + b + '-' + s.serverNum : a + '-' + b;
  }

  return {
    createGame: createGame,
    scorePoint: scorePoint,
    serverFault: serverFault,
    serveSide: serveSide,
    callout: callout
  };
});
