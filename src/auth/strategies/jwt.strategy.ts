import { Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { CONFIG } from 'src/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([

        ExtractJwt.fromAuthHeaderAsBearerToken(),

        (context: any) => {
          const gqlCtx = GqlExecutionContext.create(context);
          const req = gqlCtx.getContext()?.req;
          return req?.headers?.authorization?.replace('Bearer ', '');
        },
      ]),
      secretOrKey: CONFIG.SECRET_KEY,
    });
  }

  validate(payload: any) {
    return { sub: payload.sub, email: payload.email, role: payload.role };
  }
}
