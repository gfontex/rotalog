import { describe, it, expect, beforeEach } from 'vitest';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard.js';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(userRole?: Role): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user: userRole ? { id: 'u1', role: userRole } : null,
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('deve permitir acesso quando nenhuma role for exigida', () => {
    reflector.getAllAndOverride = () => null;
    const context = createMockContext(Role.DRIVER);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('deve permitir acesso quando o usuário possui a role permitida', () => {
    reflector.getAllAndOverride = () => [Role.ADMIN, Role.FLEET_MANAGER];
    const context = createMockContext(Role.ADMIN);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('deve bloquear e lançar ForbiddenException quando o usuário não possui a role necessária', () => {
    reflector.getAllAndOverride = () => [Role.ADMIN];
    const context = createMockContext(Role.DRIVER);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('deve bloquear quando não há usuário autenticado na requisição', () => {
    reflector.getAllAndOverride = () => [Role.ADMIN];
    const context = createMockContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
