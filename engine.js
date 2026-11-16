/*
 * Tender Pickle Scoreboard - rules engine
 * Pure functions, no DOM. Every function returns a new state object.
 *
 * Side-out (traditional) scoring:
 *  - only the serving team scores
 *  - doubles: each team has server 1 and server 2; the first serving team of a game
 *    starts with only one server (0-0-2), so its first fault is a side out
 *  - serve side, doubles (USA Pickleball 4.B.4 / 4.B.6): every side out starts in the
 *    right/even court; the server switches court after each point won; the second
 *    server serves from the partner's court (opposite the first server)
 *  - serve side, singles: server's own score even -> right court, odd -> left court
 *
 * Rally scoring (USA Pickleball provisional rule, 2025):
 *  - every rally scores a point for the side that wins it, except the winning point,
 *    which can only be scored by the serving side (receiver at game point: side out only)
 *  - one server per side out (no server 2, no 0-0-2), score call has two numbers
 *  - serve side follows the same court rules as side-out scoring
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PickleEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function createGame(opts) {
    opts = opts || {};
    var mode = opts.mode === 'singles' ? 'singles' : 'doubles';
    var scoring = opts.scoring === 'rally' ? 'rally' : 'sideout';
    return {
      mode: mode,
      scoring: scoring,
      target: opts.target || 11,
      winByTwo: opts.winByTwo !== false,
      scores: [0, 0],
      server: opts.firstServer === 1 ? 1 : 0, // team index that is serving
      serverNum: mode === 'doubles' && scoring === 'sideout' ? 2 : 1, // 0-0-2 start rule
      side: 'right',                          // doubles serve court
      over: false,
      winner: null
    };
  }

  function clone(s) {
    return {
      mode: s.mode,
      scoring: s.scoring,
      target: s.target,
      winByTwo: s.winByTwo,
      scores: [s.scores[0], s.scores[1]],
      server: s.server,
      serverNum: s.serverNum,
      side: s.side,
      over: s.over,
      winner: s.winner
    };
  }

  // Doubles side-out scoring is the only format with server 1 / server 2.
  function usesServerNum(s) {
    return s.mode === 'doubles' && s.scoring !== 'rally';
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
    n.side = other(serveSide(s)); // server switches court after a point
    n.scores[n.server] += 1;
    if (isWinner(n, n.server)) {
      n.over = true;
      n.winner = n.server;
    }
    return n;
  }

  // Rally scoring: would one more point win the game for the receiving side?
  function receiverAtGamePoint(s) {
    var n = clone(s);
    n.scores[1 - n.server] += 1;
    return isWinner(n, 1 - n.server);
  }

  // The serving team lost the rally (fault).
  function serverFault(s) {
    if (s.over) return s;
    var n = clone(s);
    if (n.scoring === 'rally') {
      if (!receiverAtGamePoint(s)) n.scores[1 - n.server] += 1;
      n.server = 1 - n.server;
      n.serverNum = 1;
      n.side = 'right';
      return n;
    }
    if (n.mode === 'doubles' && n.serverNum === 1) {
      n.serverNum = 2;
      n.side = other(serveSide(s)); // partner stands in the other court
    } else {
      n.server = 1 - n.server;
      n.serverNum = 1;
      n.side = 'right'; // every side out starts in the right/even court
    }
    return n;
  }

  function other(side) { return side === 'right' ? 'left' : 'right'; }

  // `team` won the rally (works for both scoring systems).
  function rallyWon(s, team) {
    return team === s.server ? scorePoint(s) : serverFault(s);
  }

  // 'right' or 'left' court for the current server.
  function serveSide(s) {
    if (s.mode === 'doubles' && s.side) return s.side;
    // singles, or a doubles game saved before `side` existed
    return s.scores[s.server] % 2 === 0 ? 'right' : 'left';
  }

  // Score call: doubles side-out "4-2-1" (server - receiver - server number), otherwise "4-2".
  function callout(s) {
    var a = s.scores[s.server];
    var b = s.scores[1 - s.server];
    return usesServerNum(s) ? a + '-' + b + '-' + s.serverNum : a + '-' + b;
  }

  return {
    createGame: createGame,
    scorePoint: scorePoint,
    serverFault: serverFault,
    rallyWon: rallyWon,
    receiverAtGamePoint: receiverAtGamePoint,
    usesServerNum: usesServerNum,
    serveSide: serveSide,
    callout: callout
  };
});
