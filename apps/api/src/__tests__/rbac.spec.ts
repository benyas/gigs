import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard, ROLES_KEY } from '../common/guards/roles.guard';

/**
 * Tests for the RBAC system — ensure RolesGuard enforces @Roles('admin')
 */
describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(userRole: string, requiredRoles?: string[]): ExecutionContext {
    const mockRequest = { user: { id: 'user-1', role: userRole } };
    const mockHandler = jest.fn();
    const mockClass = jest.fn();

    // Mock the reflector to return the required roles
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles || null);

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: jest.fn(),
        getNext: jest.fn(),
      }),
      getHandler: () => mockHandler,
      getClass: () => mockClass,
      getType: () => 'http',
      getArgs: () => [],
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    } as unknown as ExecutionContext;
  }

  it('should allow access when no @Roles decorator is present (backward compat)', () => {
    const context = createMockContext('client', undefined);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow admin access to @Roles("admin") endpoints', () => {
    const context = createMockContext('admin', ['admin']);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny client access to @Roles("admin") endpoints', () => {
    const context = createMockContext('client', ['admin']);
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should deny provider access to @Roles("admin") endpoints', () => {
    const context = createMockContext('provider', ['admin']);
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should allow provider access to @Roles("provider") endpoints', () => {
    const context = createMockContext('provider', ['provider']);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has any of the required roles', () => {
    const context = createMockContext('provider', ['admin', 'provider']);
    expect(guard.canActivate(context)).toBe(true);
  });
});
