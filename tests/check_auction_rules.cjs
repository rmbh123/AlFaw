// Regression tests for actual auction helper functions from script.js.
// Run: node tests/check_auction_rules.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const names = ['status', 'compareBids', 'rankedBids', 'auctionWinner', 'canViewAuction', 'canViewArtifact'];
const definitions = names.map(name => {
  const start = source.indexOf('const ' + name + '=');
  assert.notEqual(start, -1, 'Missing auction helper: ' + name);
  const end = source.indexOf(';\n', start);
  assert.notEqual(end, -1, 'Unterminated helper: ' + name);
  return source.slice(start, end + 1);
});
const fixtureArtifacts=[{id:'public',archived:false},{id:'archived',archived:true}];
const fixtureAuctions=[];
const {status, rankedBids, auctionWinner, canViewAuction, canViewArtifact} = new Function('artifacts','auctions',
  'const artifact=id=>artifacts.find(x=>x.id===id);\n'+definitions.join('\n') + '\nreturn {status,rankedBids,auctionWinner,canViewAuction,canViewArtifact};'
)(fixtureArtifacts,fixtureAuctions);
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
  ['No winner without bids', () => assert.equal(auctionWinner({...ended,bids:[]}), null)],
  ['Archived completed auction remains readable', () => assert.equal(canViewAuction({...ended,artifactId:'archived'}),true)],
  ['Archived active auction is not exposed', () => assert.equal(canViewAuction({...ended,artifactId:'archived',end:hours(2)}),false)],
  ['Unknown auction or artifact is rejected', () => {assert.equal(canViewAuction(null),false);assert.equal(canViewAuction({...ended,artifactId:'missing'}),false);assert.equal(canViewArtifact(null),false)}],
  ['Artifact without completed history stays archived', () => assert.equal(canViewArtifact(fixtureArtifacts[1]),false)],
  ['Archived artifact with completed history is readable', () => {fixtureAuctions.push({...ended,artifactId:'archived'});assert.equal(canViewArtifact(fixtureArtifacts[1]),true)}]
];
for (const [label, test] of tests) {test(); console.log('PASS', label)}
console.log('PASS:', tests.length, 'auction-rule regression tests');
