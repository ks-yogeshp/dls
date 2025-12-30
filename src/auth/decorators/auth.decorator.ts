import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { Role } from 'src/database/schemas/enums/role.enum';
import { RoleGuard, Roles } from '../guards/role.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

export const AUTH_GUARD = Symbol('auth-guard');

export function Auth(options?: { isPublic?: string; permissions?: string[]; roles?: Role[] }) {
  const strategies = options?.isPublic ? AuthGuard(options.isPublic) : JwtAuthGuard;
  const decorators: PropertyDecorator[] = [];
  if (!options?.isPublic) {
    decorators.push(ApiBearerAuth());
  }

  if (options?.roles) {
    decorators.push(Roles(...options.roles));
  }

  return applyDecorators(
    SetMetadata(AUTH_GUARD, true),
    ...decorators,
    UseGuards(strategies, RoleGuard),

    ApiUnauthorizedResponse({ description: 'Unauthorized' })
  );
}
