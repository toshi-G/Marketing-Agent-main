import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { startWorkflowSchema, createTemplateSchema } from '../app/lib/utils/validation';

test('startWorkflowSchema success', () => {
  const data = startWorkflowSchema.parse({ name: 'Test', initialInput: { targetGenre: 'tech', keywords: ['ai'] } });
  assert.equal(data.name, 'Test');
});

test('startWorkflowSchema failure', () => {
  assert.throws(() => startWorkflowSchema.parse({ name: '', initialInput: { keywords: 'oops' } }));
});

test('createTemplateSchema success', () => {
  const data = createTemplateSchema.parse({ name: 'Temp', category: 'email', type: 'sales', content: {} });
  assert.equal(data.category, 'email');
});

test('createTemplateSchema failure', () => {
  assert.throws(() => createTemplateSchema.parse({ name: '', category: 'email', type: 'sales', content: {} }));
});
