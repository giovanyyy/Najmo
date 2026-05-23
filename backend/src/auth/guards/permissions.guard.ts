import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasPermission } from '../../common/permissions';
import { PermissionDeniedException } from '../../lib/errors';

import { SetMetadata } from '@nestjs/common';
export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.roles || user.roles.length === 0) {
      throw new PermissionDeniedException('Non authentifié ou rôle manquant');
    }

    const userRole = user.roles[0]; // Assuming user has a primary role

    const hasAccess = requiredPermissions.every((permission) =>
      hasPermission(userRole, permission),
    );

    if (!hasAccess) {
      throw new PermissionDeniedException();
    }

    return true;
  }
}
