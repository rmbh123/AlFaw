// Regression tests for actual auction helper functions from script.js.
// Run: node tests/check_auction_rules.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const names = ['status', 'rankedBids', 'auctionWinner'];
const definitions = names.map(name => {
  const start = source.indexOf('const ' + name + '=');
  assert.notEqual(start, -1, 'Missing auction helper: ' + name);
  const end = source.indexOf(';\n', start);
  assert.notEqual(end, -1, 'Unterminated helper: ' + name);
  return source.slice(start, end + 1);
});
const {status, rankedBids, auctionWinner} = new Function(
  definitions.join('\n') + '\nreturn {status,rankedBids,auctionWinner};'
)();
const now = Date.now();
const hours = n => new Date(now + n * 3600000).toISOString();
const ended = {start: hours(-3), end: hours(-1), reservePrice:120,
  bids:[{uid:'u1',amount:110},{uid:'u2',amount:100},{uid:'u2',amount:105}]};
const tests = [
  ['Ended auction status', () => assert.equal(status(ended), 'ended')],
  ['Reject below reserve', () => assert.equal(auctionWinner(ended), null)],
  ['Rank each bidder only once, highest first', () => assert.deepEqual(rankedBids(ended).map(b=>b.uid), ['u1','u2'])],
  ['Award winner at reserve', () => assert.equal(auctionWinner({...ended,reservePrice:110}).uid, 'u1')],
  ['No winner before start', () => assert.equal(auctionWinner({...ended,start:hours(1),end:hours(2)}), null)],
  ['No winner while active', () => assert.equal(auctionWinner({...ended,end:hours(2)}), null)],
  ['No winner without bids', () => assert.equal(auctionWinner({...ended,bids:[]}), null)]
];
for (const [label, test] of tests) {test(); console.log('PASS', label)}
console.log('PASS:', tests.length, 'auction-rule regression tests');
