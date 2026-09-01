import {
  isActivePathname,
  findActiveSectionKey,
  getStoredUserRoles,
  isAdminUser,
  filterSectionsForRoles,
  navSections,
  type NavSection,
} from './navigation';

describe('navigation utilities', () => {
  describe('isActivePathname', () => {
    it('should match exact root path', () => {
      expect(isActivePathname('/', '/')).toBe(true);
    });

    it('should not match non-root on root href', () => {
      expect(isActivePathname('/applications', '/')).toBe(false);
    });

    it('should match exact path', () => {
      expect(isActivePathname('/applications', '/applications')).toBe(true);
    });

    it('should match nested path', () => {
      expect(isActivePathname('/applications/123', '/applications')).toBe(true);
    });

    it('should not match partial path name', () => {
      expect(isActivePathname('/applications-new', '/applications')).toBe(false);
    });

    it('should match deep nested paths', () => {
      expect(isActivePathname('/saas/requests/123', '/saas/requests')).toBe(true);
    });
  });

  describe('findActiveSectionKey', () => {
    it('should find the section containing the active item', () => {
      expect(findActiveSectionKey(navSections, '/applications')).toBe('section_portfolio');
    });

    it('should find section for root path', () => {
      expect(findActiveSectionKey(navSections, '/')).toBe('section_home');
    });

    it('should return null for unmatched path', () => {
      expect(findActiveSectionKey(navSections, '/nonexistent')).toBeNull();
    });

    it('should find admin section', () => {
      expect(findActiveSectionKey(navSections, '/users')).toBe('section_admin');
    });

    it('should find settings in admin section', () => {
      expect(findActiveSectionKey(navSections, '/settings')).toBe('section_admin');
    });
  });

  describe('getStoredUserRoles', () => {
    beforeEach(() => {
      window.localStorage.clear();
    });

    it('should return empty array when no user stored', () => {
      expect(getStoredUserRoles()).toEqual([]);
    });

    it('should return roles from stored user', () => {
      window.localStorage.setItem('user', JSON.stringify({ roles: ['admin', 'editor'] }));
      expect(getStoredUserRoles()).toEqual(['admin', 'editor']);
    });

    it('should return empty array when roles is not an array', () => {
      window.localStorage.setItem('user', JSON.stringify({ roles: 'admin' }));
      expect(getStoredUserRoles()).toEqual([]);
    });

    it('should return empty array on corrupted JSON', () => {
      window.localStorage.setItem('user', 'not-json');
      expect(getStoredUserRoles()).toEqual([]);
    });

    it('should return empty array when user has no roles field', () => {
      window.localStorage.setItem('user', JSON.stringify({ email: 'test@example.com' }));
      expect(getStoredUserRoles()).toEqual([]);
    });
  });

  describe('isAdminUser', () => {
    it('should return true for empty roles (graceful default)', () => {
      expect(isAdminUser([])).toBe(true);
    });

    it('should return true when admin role present', () => {
      expect(isAdminUser(['admin'])).toBe(true);
    });

    it('should return true for case-insensitive admin match', () => {
      expect(isAdminUser(['Admin'])).toBe(true);
      expect(isAdminUser(['ADMIN'])).toBe(true);
    });

    it('should return false when no admin role', () => {
      expect(isAdminUser(['editor', 'viewer'])).toBe(false);
    });

    it('should return true when admin is one of many roles', () => {
      expect(isAdminUser(['viewer', 'editor', 'admin'])).toBe(true);
    });
  });

  describe('filterSectionsForRoles', () => {
    it('should return all sections for admin', () => {
      const result = filterSectionsForRoles(navSections, true);
      expect(result).toEqual(navSections);
    });

    it('should remove admin-only items for non-admin', () => {
      const result = filterSectionsForRoles(navSections, false);
      const adminSection = result.find((s) => s.key === 'section_admin');
      expect(adminSection).toBeUndefined();
    });

    it('should keep non-admin items intact', () => {
      const result = filterSectionsForRoles(navSections, false);
      const portfolio = result.find((s) => s.key === 'section_portfolio');
      expect(portfolio?.items.length).toBe(6);
    });

    it('should remove entire section if all items are adminOnly', () => {
      const sections: NavSection[] = [
        { key: 'admin-only', items: [{ icon: null as any, key: 'test', href: '/test', adminOnly: true }] },
      ];
      const result = filterSectionsForRoles(sections, false);
      expect(result).toHaveLength(0);
    });
  });

  describe('navSections', () => {
    it('should have 8 sections', () => {
      expect(navSections).toHaveLength(8);
    });

    it('should have unique keys for all items', () => {
      const keys = navSections.flatMap((s) => s.items.map((i) => i.key));
      expect(new Set(keys).size).toBe(keys.length);
    });

    it('should have unique section keys', () => {
      const sectionKeys = navSections.map((s) => s.key);
      expect(new Set(sectionKeys).size).toBe(sectionKeys.length);
    });

    it('all items should have href starting with /', () => {
      navSections.forEach((s) =>
        s.items.forEach((i) => expect(i.href).toMatch(/^\//)),
      );
    });

    it('admin section should have adminOnly items', () => {
      const admin = navSections.find((s) => s.key === 'section_admin');
      expect(admin?.items.every((i) => i.adminOnly)).toBe(true);
    });
  });
});
