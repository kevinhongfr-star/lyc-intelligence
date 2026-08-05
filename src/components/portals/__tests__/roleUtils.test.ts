/**
 * Tests for portal role / user-type helpers.
 */
import { describe, expect, it } from 'vitest';
import type { V1AuthUser } from '@/hooks/v1/types';
import {
  ROLE_HIERARCHY,
  hasAnyRole,
  hasAnyUserType,
  hasRole,
  hasUserType,
  isInternalUser,
  roleLevel,
} from '../roleUtils';

const superAdmin: V1AuthUser = {
  id: 'u-1',
  email: 'super@example.com',
  role: 'super_admin',
  user_type: 'internal',
};

const teamLead: V1AuthUser = {
  id: 'u-2',
  email: 'lead@example.com',
  role: 'team_lead',
  user_type: 'internal',
};

const candidate: V1AuthUser = {
  id: 'u-3',
  email: 'candidate@example.com',
  role: 'candidate',
  user_type: 'candidate',
};

const clientUser: V1AuthUser = {
  id: 'u-4',
  email: 'client@example.com',
  role: 'client_admin',
  user_type: 'client',
};

describe('ROLE_HIERARCHY', () => {
  it('is ordered lowest → highest starting with candidate', () => {
    expect(ROLE_HIERARCHY[0]).toBe('candidate');
    expect(ROLE_HIERARCHY[ROLE_HIERARCHY.length - 1]).toBe('super_admin');
    expect(ROLE_HIERARCHY).toEqual([
      'candidate',
      'member',
      'council',
      'client_viewer',
      'client_admin',
      'lyc_consultant',
      'team_lead',
      'admin',
      'lyc_admin',
      'super_admin',
    ]);
  });
});

describe('roleLevel', () => {
  it('returns the index of a role in the hierarchy', () => {
    expect(roleLevel('candidate')).toBe(0);
    expect(roleLevel('team_lead')).toBe(6);
    expect(roleLevel('super_admin')).toBe(9);
  });

  it('orders levels correctly (candidate < team_lead < super_admin)', () => {
    expect(roleLevel('candidate')).toBeLessThan(roleLevel('team_lead'));
    expect(roleLevel('team_lead')).toBeLessThan(roleLevel('super_admin'));
  });
});

describe('hasRole', () => {
  it('passes for a super_admin against a team_lead requirement', () => {
    expect(hasRole(superAdmin, 'team_lead')).toBe(true);
  });

  it('fails for a candidate against a team_lead requirement', () => {
    expect(hasRole(candidate, 'team_lead')).toBe(false);
  });

  it('passes for an exact-level match (team_lead vs team_lead)', () => {
    expect(hasRole(teamLead, 'team_lead')).toBe(true);
  });

  it('returns false for a null user', () => {
    expect(hasRole(null, 'team_lead')).toBe(false);
  });
});

describe('hasAnyRole', () => {
  it('returns true when the user role is in the list', () => {
    expect(hasAnyRole(superAdmin, ['admin', 'super_admin'])).toBe(true);
  });

  it('returns false when the user role is not in the list', () => {
    expect(hasAnyRole(candidate, ['admin', 'super_admin'])).toBe(false);
  });

  it('returns false for a null user', () => {
    expect(hasAnyRole(null, ['admin'])).toBe(false);
  });
});

describe('hasUserType', () => {
  it('returns true when the user_type matches', () => {
    expect(hasUserType(candidate, 'candidate')).toBe(true);
  });

  it('returns false when the user_type does not match', () => {
    expect(hasUserType(superAdmin, 'candidate')).toBe(false);
  });

  it('returns false for a null user', () => {
    expect(hasUserType(null, 'candidate')).toBe(false);
  });
});

describe('hasAnyUserType', () => {
  it('returns true when any user_type matches', () => {
    expect(hasAnyUserType(clientUser, ['internal', 'client'])).toBe(true);
  });

  it('returns false when none match', () => {
    expect(hasAnyUserType(clientUser, ['internal', 'candidate'])).toBe(false);
  });

  it('returns false for a null user', () => {
    expect(hasAnyUserType(null, ['client'])).toBe(false);
  });
});

describe('isInternalUser', () => {
  it('returns true for an internal user_type', () => {
    expect(isInternalUser(teamLead)).toBe(true);
  });

  it('returns true for an internal role even with a non-internal user_type', () => {
    const consultantRole: V1AuthUser = {
      id: 'u-5',
      email: 'cons@example.com',
      role: 'lyc_consultant',
      user_type: 'partner',
    };
    expect(isInternalUser(consultantRole)).toBe(true);
  });

  it('returns false for a candidate', () => {
    expect(isInternalUser(candidate)).toBe(false);
  });

  it('returns false for a null user', () => {
    expect(isInternalUser(null)).toBe(false);
  });
});
