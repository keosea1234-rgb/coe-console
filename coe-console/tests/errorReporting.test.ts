import assert from 'node:assert/strict';
import test from 'node:test';
import { reportClientError } from '../src/lib/errorReporting';

test('reportClientError normalizes Error instances', () => {
  const originalConsoleError = console.error;
  console.error = () => undefined;
  try {
    const report = reportClientError(new Error('Render failed'), { source: 'error-boundary' });
    assert.equal(report.source, 'error-boundary');
    assert.equal(report.message, 'Render failed');
    assert.match(report.createdAt, /^\d{4}-\d{2}-\d{2}T/);
  } finally {
    console.error = originalConsoleError;
  }
});

test('reportClientError normalizes non-Error values', () => {
  const originalConsoleError = console.error;
  console.error = () => undefined;
  try {
    const report = reportClientError({ code: 'E_CLIENT' }, { source: 'unhandled-rejection' });
    assert.equal(report.source, 'unhandled-rejection');
    assert.equal(report.message, '{"code":"E_CLIENT"}');
  } finally {
    console.error = originalConsoleError;
  }
});
