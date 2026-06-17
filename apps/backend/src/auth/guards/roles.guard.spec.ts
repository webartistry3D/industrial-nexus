import { RolesGuard } from './roles.guard';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (userRole: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role: userRole },
        }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      getArgs: () => [],
      getArgByIndex: () => null,
      switchToRpc: () => jest.fn() as any,
      switchToWs: () => jest.fn() as any,
      getType: () => 'http',
    }) as unknown as ExecutionContext;

  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockContext('CLIENT');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['SUPER_ADMIN', 'OPERATIONS']);

    const context = createMockContext('SUPER_ADMIN');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user does not have required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['SUPER_ADMIN']);

    const context = createMockContext('CLIENT');
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should allow access when user has one of multiple required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['SUPER_ADMIN', 'OPERATIONS', 'CLIENT']);

    const context = createMockContext('CLIENT');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user is DRIVER but only ADMIN/OPERATIONS allowed', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['SUPER_ADMIN', 'OPERATIONS']);

    const context = createMockContext('DRIVER');
    expect(guard.canActivate(context)).toBe(false);
  });
});
