import assert from 'node:assert/strict';
import test from 'node:test';
import type { SessionUser } from '../src/domain/session';
import {
  hasAnyPermission,
  hasPermission,
  permissionsForRole,
  type Permission,
} from '../src/domain/authz';

const admin: SessionUser = { id: 'admin-1', email: 'admin@amcor.com', role: 'admin' };
const user: SessionUser = { id: 'user-1', email: 'user@amcor.com', role: 'user' };

test('role permissions preserve existing admin and user behavior', () => {
  assert.deepEqual(permissionsForRole('user'), [
    'request:create',
    'request:view_own',
    'event:view',
    'analytics:view',
  ] satisfies Permission[]);

  assert.ok(hasPermission(admin, 'request:view_all'));
  assert.ok(hasPermission(admin, 'event:update_status'));
  assert.ok(hasPermission(admin, 'event:admin'));
  assert.ok(hasPermission(admin, 'feedback:request'));
  assert.ok(hasPermission(admin, 'admin:audit'));
  assert.ok(hasPermission(admin, 'admin:users'));

  assert.ok(!hasPermission(admin, 'request:create'));
  assert.ok(!hasPermission(user, 'request:view_all'));
  assert.ok(!hasPermission(user, 'event:update_status'));
  assert.ok(!hasPermission(user, 'admin:users'));
});

test('permission helpers handle any-of checks and anonymous users', () => {
  assert.equal(hasPermission(null, 'analytics:view'), false);
  assert.equal(hasAnyPermission(undefined, ['request:view_own', 'request:view_all']), false);
  assert.equal(hasAnyPermission(user, ['request:view_all', 'request:view_own']), true);
  assert.equal(hasAnyPermission(admin, ['request:view_own', 'request:view_all']), true);
  assert.equal(hasAnyPermission(user, ['event:update_status', 'admin:audit']), false);
});
