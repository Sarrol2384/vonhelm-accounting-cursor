import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  APPROVAL_CHOICE_NO,
  APPROVAL_CHOICE_YES,
  buildApprovalQuestion,
  getActivityStatus,
  isValidApprovalChoice,
  plainCategory,
} from './owner.constants';

describe('owner.constants', () => {
  it('plainCategory strips GL codes', () => {
    assert.equal(plainCategory('Rent Expense (6100)'), 'Rent Expense');
    assert.equal(plainCategory(undefined), 'Not categorized yet');
  });

  it('buildApprovalQuestion includes date and uncertainty framing', () => {
    const q = buildApprovalQuestion({
      spent: 1500,
      received: null,
      payee: 'Shop Rent',
      description: null,
      date: new Date('2026-06-15'),
    });
    assert.ok(q.includes("We're not sure"));
    assert.ok(q.includes('Shop Rent'));
    assert.ok(q.includes('15'));
  });

  it('getActivityStatus distinguishes sorted vs confirmed', () => {
    assert.equal(getActivityStatus({ selectionId: 'acc1', status: 'REVIEWED' }), 'sorted');
    assert.equal(getActivityStatus({ selectionId: null, status: 'REVIEWED' }), 'confirmed');
    assert.equal(getActivityStatus({ selectionId: null, status: 'NEW' }), null);
  });

  it('isValidApprovalChoice accepts known choices', () => {
    assert.equal(
      isValidApprovalChoice([APPROVAL_CHOICE_YES, APPROVAL_CHOICE_NO], APPROVAL_CHOICE_YES),
      true,
    );
    assert.equal(isValidApprovalChoice([APPROVAL_CHOICE_YES], 'Maybe'), false);
  });
});
