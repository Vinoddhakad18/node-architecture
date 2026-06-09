/**
 * Unit Tests for Menu Service
 * Covers update flows and undefined field sanitization.
 */

import menuRepository from '../../repositories/menu.repository';
import menuService from '../menu.service';

jest.mock('../../repositories/menu.repository');
jest.mock('../../config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('MenuService', () => {
  const mockedMenuRepository = menuRepository as jest.Mocked<typeof menuRepository>;

  const mockMenu = {
    id: 1,
    name: 'Menu Management',
    route: '/admin/menus',
    parent_id: null,
    sort_order: 0,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    update: jest.fn().mockResolvedValue(undefined),
  } as any;

  const mockParentMenu = {
    id: 6,
    name: 'Admin',
    route: '/admin',
    parent_id: null,
    sort_order: 0,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should remove undefined fields before updating a menu', async () => {
    mockedMenuRepository.findById
      .mockResolvedValueOnce(mockMenu)
      .mockResolvedValueOnce(mockParentMenu)
      .mockResolvedValueOnce(mockMenu);
    mockedMenuRepository.findChildren.mockResolvedValue([] as any);

    const updateData = {
      name: 'Menu Management',
      route: undefined,
      parent_id: 6,
      sort_order: 1,
      is_active: true,
    } as any;

    await menuService.update(1, updateData);

    expect(mockedMenuRepository.findById).toHaveBeenNthCalledWith(1, 1);
    expect(mockedMenuRepository.findById).toHaveBeenNthCalledWith(2, 6);
    expect(mockedMenuRepository.findChildren).toHaveBeenCalledWith(1);
    expect(mockMenu.update).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Menu Management',
        parent_id: 6,
        sort_order: 1,
        is_active: true,
      })
    );
    expect((mockMenu.update as jest.Mock).mock.calls[0][0]).not.toHaveProperty('route');
  });
});
