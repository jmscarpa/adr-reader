import test from 'node:test';
import assert from 'node:assert/strict';
import { dateFromBody, statusFromBody } from '../dist/parse.js';

const adrTools = (status) => `# 2. Use PostgreSQL\n\nDate: 2026-01-05\n\n## Status\n\n${status}\n\n## Context\n\nStatus: not this one\n`;

test('adr-tools: status from the Status section and date from the Date line', () => {
  assert.equal(statusFromBody(adrTools('Accepted')), 'Accepted');
  assert.equal(dateFromBody(adrTools('Accepted')), '2026-01-05');
});

test('adr-tools: a superseded record reads as Superseded', () => {
  assert.equal(statusFromBody(adrTools('Superseded by [3. Use MySQL](0003-use-mysql.md)')), 'Superseded');
});

test('MADR 2 and log4brains: status and date from bullets', () => {
  const body = '# Use X\n\n* Status: accepted\n* Deciders: Ana\n* Date: 2026-02-10\n\n## Context\n';
  assert.equal(statusFromBody(body), 'Accepted');
  assert.equal(dateFromBody(body), '2026-02-10');
  assert.equal(statusFromBody('# Use X\n\n- **Status**: proposed\n'), 'Proposed');
});

test('short custom statuses are kept, long sentences are not', () => {
  assert.equal(statusFromBody(adrTools('In review')), 'In review');
  assert.equal(statusFromBody(adrTools('We are still discussing this with the platform team')), undefined);
});

test('nothing found means no status and no date', () => {
  assert.equal(statusFromBody('# Plain\n\n## Context\n\nStatus: in the body only\n'), undefined);
  assert.equal(dateFromBody('# Plain\n'), undefined);
});
