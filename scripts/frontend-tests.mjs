import { build } from 'esbuild';
import test from 'node:test';
import assert from 'node:assert/strict';
const moduleFor = async file => {
  const built = await build({entryPoints:[file],bundle:true,write:false,platform:'node',format:'esm'});
  return import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
};
const {RequestLane} = await moduleFor('frontend/lib/requests.ts');
const {ledgerSchema,toLedger,sampleValues} = await moduleFor('frontend/lib/form.ts');
test('a reset invalidates a delayed upload', () => {
  const lane=new RequestLane(), request=lane.start(); lane.cancel();
  assert.equal(request.signal.aborted,true); assert.equal(lane.current(request),false);
});
test('an old response cannot finish or replace a newer request', () => {
  const lane=new RequestLane(), old=lane.start(), next=lane.start(); lane.finish(old);
  assert.equal(lane.current(old),false); assert.equal(lane.current(next),true);
});
test('editing comparison inputs need not cancel a pending upload', () => {
  const uploads=new RequestLane(), comparisons=new RequestLane();
  const upload=uploads.start(); comparisons.start(); comparisons.cancel();
  assert.equal(uploads.current(upload),true);
});
test('missing measurements remain null, explicit zero remains zero', () => {
  const values=sampleValues('missing');
  assert.equal(toLedger(ledgerSchema.parse(values)).receipts[0].items[0].received_kg,null);
  values.receipts[0].items[0].received_kg='0';
  assert.equal(toLedger(ledgerSchema.parse(values)).receipts[0].items[0].received_kg,'0');
});
test('invalid dates, signed quantities, excessive precision cannot be submitted', () => {
  for (const amount of ['-1','NaN','Infinity','10001','0.0005']) {
    const values=sampleValues('difference'); values.rice=amount;
    assert.equal(ledgerSchema.safeParse(values).success,false);
  }
  const values=sampleValues('difference'); values.receipts[0].date='2026-02-31';
  assert.equal(ledgerSchema.safeParse(values).success,false);
});
test('comparison sends only API fields, never preview URLs or parser warnings', () => {
  const values=sampleValues('difference'); values.receipts[0].preview='blob:test';
  const payload=toLedger(values);
  assert.equal('preview' in payload.receipts[0],false);
  assert.equal('warnings' in payload.receipts[0],false);
  assert.equal(payload.demo,true);
});
test('every demo is schema-valid, synthetic, and has distinct receipt identifiers', () => {
  for (const kind of ['cancellation','difference','partial','missing']) {
    const values=ledgerSchema.parse(sampleValues(kind));
    assert.equal(values.demo,true);
    assert.equal(new Set(values.receipts.map(receipt=>receipt.document_id)).size,values.receipts.length);
    assert.ok(values.receipts.every(receipt=>receipt.source_text.includes('SYNTHETIC DEMO')));
  }
});
