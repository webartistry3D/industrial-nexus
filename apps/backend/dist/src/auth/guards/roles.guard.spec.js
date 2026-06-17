"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const roles_guard_1 = require("./roles.guard");
const core_1 = require("@nestjs/core");
describe('RolesGuard', () => {
    let guard;
    let reflector;
    beforeEach(() => {
        reflector = new core_1.Reflector();
        guard = new roles_guard_1.RolesGuard(reflector);
    });
    const createMockContext = (userRole) => ({
        switchToHttp: () => ({
            getRequest: () => ({
                user: { role: userRole },
            }),
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
        getArgs: () => [],
        getArgByIndex: () => null,
        switchToRpc: () => jest.fn(),
        switchToWs: () => jest.fn(),
        getType: () => 'http',
    });
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
//# sourceMappingURL=roles.guard.spec.js.map