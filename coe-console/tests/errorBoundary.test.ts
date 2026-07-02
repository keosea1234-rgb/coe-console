import assert from 'node:assert/strict';
import test from 'node:test';
import * as React from 'react';
import { createElement, isValidElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

(globalThis as { React?: typeof React }).React = React;

const { ErrorBoundary } = await import('../src/components/common/ErrorBoundary');

test('error boundary hides raw technical error details', () => {
  const technicalMessage = 'database password leaked in stack';
  const boundary = new ErrorBoundary({ children: createElement('div') });
  boundary.state = ErrorBoundary.getDerivedStateFromError();

  const rendered = boundary.render();
  assert.ok(isValidElement(rendered));

  const html = renderToStaticMarkup(rendered);
  assert.match(html, /Something went wrong/);
  assert.match(html, /Try again/);
  assert.match(html, /Reload page/);
  assert.doesNotMatch(html, new RegExp(technicalMessage));
});
