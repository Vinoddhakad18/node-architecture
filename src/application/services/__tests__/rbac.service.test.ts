import { UserRole } from '@constants/user.constants';
import menuRepository from '@repositories/menu.repository';
import roleRepository from '@repositories/role.repository';
import roleMenuPermissionRepository from '@repositories/role-menu-permission.repository';
import redisService from '@helpers/redis.helper';

import rbacService from '../rbac.service';

jest.mock('@repositories/menu.repository');
jest.mock('@repositories/role.repository');
jest.mock('@repositories/role-menu-permission.repository');
jest.mock('@helpers/redis.helper');
jest.mock('@config/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

describe('rbacService.getEffectivePermissionMap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (redisService.get as jest.Mock).mockResolvedValue(null);
    (redisService.set as jest.Mock).mockResolvedValue(undefined);
  });

  it('returns all-true flags for every active menu for super_admin', async () => {
    (menuRepository.findAllActive as jest.Mock).mockResolvedValue([
      { route: '/admin/roles' },
      { route: '/admin/users' },
    ]);

    const map = await rbacService.getEffectivePermissionMap(UserRole.SUPER_ADMIN);

    expect(map['/admin/roles']).toEqual({
      view: true,
      add: true,
      edit: true,
      delete: true,
      export: true,
      status: true,
    });
    expect(map['/admin/users'].delete).toBe(true);
    expect(roleRepository.findByName).not.toHaveBeenCalled();
  });

  it('returns the DB-resolved flag map for a normal role', async () => {
    (roleRepository.findByName as jest.Mock).mockResolvedValue({ id: 7 });
    (roleMenuPermissionRepository.findByRoleId as jest.Mock).mockResolvedValue([
      {
        menu: { route: '/admin/roles' },
        can_view: 1,
        can_add: 1,
        can_edit: 0,
        can_delete: 0,
        can_export: 1,
        can_status: 0,
      },
    ]);

    const map = await rbacService.getEffectivePermissionMap('manager');

    expect(map['/admin/roles']).toEqual({
      view: true,
      add: true,
      edit: false,
      delete: false,
      export: true,
      status: false,
    });
  });
});
