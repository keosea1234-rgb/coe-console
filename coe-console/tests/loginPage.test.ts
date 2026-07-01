import assert from 'node:assert/strict';
import test from 'node:test';
import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

process.env.VITE_SUPABASE_URL ??= 'http://127.0.0.1:54321';
process.env.VITE_SUPABASE_ANON_KEY ??= 'test-anon-key';

(globalThis as { React?: typeof React }).React = React;

const { LoginPage } = await import('../src/pages/LoginPage');

test('login page does not show Sign up by default', () => {
  const previousAllowSignup = process.env.VITE_ALLOW_SIGNUP;

  try {
    delete process.env.VITE_ALLOW_SIGNUP;
    const html = renderToStaticMarkup(createElement(LoginPage));

    assert.match(html, /Sign in to continue/);
    assert.doesNotMatch(html, /Sign up/);
    assert.doesNotMatch(html, /Create account/);
  } finally {
    if (previousAllowSignup === undefined) delete process.env.VITE_ALLOW_SIGNUP;
    else process.env.VITE_ALLOW_SIGNUP = previousAllowSignup;
  }
});

test('login page shows Sign up only when explicitly enabled', () => {
  const previousAllowSignup = process.env.VITE_ALLOW_SIGNUP;

  try {
    process.env.VITE_ALLOW_SIGNUP = 'true';
    const html = renderToStaticMarkup(createElement(LoginPage));

    assert.match(html, /Sign up/);
    assert.match(html, /Sign in/);
  } finally {
    if (previousAllowSignup === undefined) delete process.env.VITE_ALLOW_SIGNUP;
    else process.env.VITE_ALLOW_SIGNUP = previousAllowSignup;
  }
});
