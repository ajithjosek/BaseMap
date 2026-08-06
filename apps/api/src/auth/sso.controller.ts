import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SsoService } from './sso.service';
import * as oidc from 'openid-client';

@Controller('auth/sso')
export class SsoController {
  constructor(
    private authService: AuthService,
    private ssoService: SsoService,
  ) {}

  @Post('oidc/authorize')
  async authorize(@Body('tenantId') tenantId: string) {
    if (!tenantId) throw new BadRequestException('tenantId required');
    const config = await this.ssoService.buildOidcConfig(tenantId);

    const server = new URL(config.issuer!);
    const discover = await oidc.discovery(server, config.clientId!, {
      client_secret: config.clientSecret!,
    });

    const redirectUri =
      config.redirectUri || `${process.env.APP_URL}/auth/sso/oidc/callback`;
    const state = oidc.randomState();
    const nonce = oidc.randomNonce();

    const authorizationUrl = oidc.buildAuthorizationUrl(discover, {
      redirect_uri: redirectUri,
      scope: 'openid profile email',
      state,
      nonce,
    });

    return { authorizationUrl: authorizationUrl.toString(), state, nonce };
  }

  @Post('oidc/callback')
  async callback(@Body() body: any) {
    const tenantId = body.tenantId;
    if (!tenantId) throw new BadRequestException('tenantId required');

    const config = await this.ssoService.buildOidcConfig(tenantId);
    const server = new URL(config.issuer!);
    const discover = await oidc.discovery(server, config.clientId!, {
      client_secret: config.clientSecret!,
    });

    // Reconstruct the callback URL from the query params sent by the IdP
    const currentUrl = new URL(
      config.redirectUri || `${process.env.APP_URL}/auth/sso/oidc/callback`,
    );
    if (body.code) currentUrl.searchParams.set('code', body.code);
    if (body.state) currentUrl.searchParams.set('state', body.state);
    if (body.iss) currentUrl.searchParams.set('iss', body.iss);

    let tokenSet;
    try {
      tokenSet = await oidc.authorizationCodeGrant(discover, currentUrl, {
        expectedState: body.state,
        expectedNonce: body.nonce,
      });
    } catch {
      throw new UnauthorizedException('OIDC authentication failed');
    }

    const claims = tokenSet.claims();
    if (!claims.email) {
      throw new UnauthorizedException('SSO response missing email');
    }

    const user = await this.ssoService.provisionSsoUser(
      claims.email,
      'oidc',
      tenantId,
      claims.given_name,
      claims.family_name,
    );

    return this.authService.login(user);
  }

  @Post('saml')
  async saml(
    @Body('samlResponse') samlResponse: string,
    @Body('tenantId') tenantId: string,
  ) {
    if (!tenantId) throw new BadRequestException('tenantId required');
    if (!samlResponse) throw new BadRequestException('samlResponse required');

    const config = await this.ssoService.resolveSso(tenantId);
    if (!config)
      throw new BadRequestException('SSO not configured for this tenant');

    const parsed = this.ssoService.parseSamlResponse(samlResponse);
    const user = await this.ssoService.provisionSsoUser(
      parsed.email,
      'saml',
      tenantId,
      parsed.firstName,
      parsed.lastName,
    );

    return this.authService.login(user);
  }
}
