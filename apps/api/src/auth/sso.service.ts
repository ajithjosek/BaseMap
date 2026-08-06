import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SsoConfig {
  provider: 'oidc' | 'saml';
  enabled?: boolean;
  issuer?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  idpMetadataUrl?: string;
  entryPoint?: string;
  certificate?: string;
}

@Injectable()
export class SsoService {
  private db: any;

  constructor(private prisma: PrismaService) {
    this.db = this.prisma as any;
  }

  async resolveSso(tenantId: string): Promise<SsoConfig | null> {
    const tenant = await this.db.tenant.findUnique({
      where: { id: tenantId },
    });
    const config = tenant?.settings?.sso;
    if (!config || !config.enabled) {
      return null;
    }
    return config as SsoConfig;
  }

  async buildOidcConfig(tenantId: string): Promise<SsoConfig> {
    const config = await this.resolveSso(tenantId);
    if (!config)
      throw new BadRequestException('SSO not configured for this tenant');
    if (
      config.provider !== 'oidc' ||
      !config.issuer ||
      !config.clientId ||
      !config.clientSecret
    ) {
      throw new BadRequestException('Invalid OIDC SSO configuration');
    }
    return config;
  }

  async provisionSsoUser(
    email: string,
    provider: string,
    tenantId: string,
    firstName?: string,
    lastName?: string,
  ) {
    const existing = await this.db.user.findUnique({
      where: { tenant_id_email: { tenant_id: tenantId, email } },
    });

    if (existing) {
      const update: any = {};
      if (!existing.sso_provider) update.sso_provider = provider;
      if (!existing.sso_subject) update.sso_subject = `${provider}:${email}`;
      if (Object.keys(update).length) {
        return this.db.user.update({
          where: { id: existing.id },
          data: update,
        });
      }
      return existing;
    }

    return this.db.user.create({
      data: {
        tenant_id: tenantId,
        email,
        first_name: firstName,
        last_name: lastName,
        sso_provider: provider,
        sso_subject: `${provider}:${email}`,
      },
    });
  }

  /**
   * Minimal SAML response parser. Extracts the email / nameID attribute from a
   * base64-encoded (or raw) SAML Response XML payload. For production use,
   * replace with a full signature-verified parser (e.g. passport-saml).
   */
  parseSamlResponse(samlResponse: string): {
    email: string;
    firstName?: string;
    lastName?: string;
  } {
    let payload = samlResponse;
    if (!payload.includes('<')) {
      payload = Buffer.from(payload, 'base64').toString('utf-8');
    }

    const attr = (name: string): string | undefined => {
      const valuePattern = new RegExp(
        `Attribute[^>]*Name=["']${name}["'][^>]*>\\s*<saml2?:AttributeValue[^>]*>([^<]*)</saml2?:AttributeValue>`,
        'i',
      );
      const direct = payload.match(valuePattern);
      if (direct) return direct[1];
      const nameIdPattern = new RegExp(
        `<saml2?:AttributeValue[^>]*>([^<]*)<\\/saml2?:AttributeValue>[^<]*<saml2?:Attribute[^>]*Name=["']${name}["']`,
        'i',
      );
      const byId = payload.match(nameIdPattern);
      return byId ? byId[1] : undefined;
    };

    const nameId = payload.match(
      /<saml2?:NameID[^>]*>([^<]+)<\/saml2?:NameID>/i,
    )?.[1];
    const email =
      attr('email') ||
      attr('mail') ||
      attr('urn:oid:0.9.2342.19200300.100.1.3') ||
      (nameId && /.+@.+\..+/.test(nameId) ? nameId : undefined);

    if (!email)
      throw new UnauthorizedException(
        'SAML response did not include an email/NameID',
      );
    return {
      email,
      firstName: attr('givenName') || attr('first_name'),
      lastName: attr('sn') || attr('last_name'),
    };
  }
}
