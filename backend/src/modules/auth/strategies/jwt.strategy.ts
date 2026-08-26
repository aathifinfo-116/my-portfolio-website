import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.secret'),
    });
  }

  /**
   * Re-checks the account on every request so a deactivated admin loses access
   * immediately instead of when their token happens to expire.
   */
  async validate(payload: JwtPayload) {
    const user = await this.authService.findActiveById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Account is no longer active.');
    }
    return { id: user.id, email: user.email, displayName: user.displayName };
  }
}
