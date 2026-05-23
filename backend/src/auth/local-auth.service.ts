import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../lib/audit';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LocalAuthService {
  private readonly logger = new Logger(LocalAuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private audit: AuditService,
  ) {}

  async login(email: string, password: string) {
    this.logger.log(`Login attempt for: ${email}`);

    // Look up user by email
    const user = await this.prisma.users.findFirst({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Votre compte est désactivé');
    }

    // Check account lock
    const now = new Date();
    if (user.locked_until && user.locked_until > now) {
      const waitMinutes = Math.ceil((user.locked_until.getTime() - now.getTime()) / 60000);
      throw new UnauthorizedException(`Compte verrouillé. Réessayez dans ${waitMinutes} minute(s).`);
    }

    // Validate password
    let isValid = false;
    if (user.local_password) {
      isValid = await bcrypt.compare(password, user.local_password);
    } else {
      // Default initial admin login if no local_password set
      if (email === 'admin@najmo.dz' && password === 'admin123') {
        isValid = true;
      }
    }

    if (!isValid) {
      const attempts = user.login_attempts + 1;
      if (attempts >= 5) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        await this.prisma.users.update({
          where: { id: user.id },
          data: {
            login_attempts: attempts,
            locked_until: lockUntil,
          },
        });
        await this.audit.log({
          userId: user.id,
          action: 'LOGIN_LOCK',
          entityType: 'users',
          entityId: user.id,
          newValues: { reason: '5 failed login attempts', lockedUntil: lockUntil },
        });
        throw new UnauthorizedException('Mot de passe incorrect. Compte verrouillé pour 30 minutes.');
      } else {
        await this.prisma.users.update({
          where: { id: user.id },
          data: { login_attempts: attempts },
        });
        throw new UnauthorizedException(`Mot de passe incorrect. Tentatives restantes: ${5 - attempts}`);
      }
    }

    // Login successful
    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        login_attempts: 0,
        locked_until: null,
        last_login: now,
      },
    });

    await this.audit.log({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entityType: 'users',
      entityId: user.id,
    });

    const payload = {
      sub: user.id.toString(),
      email: user.email,
      name: user.full_name,
      roles: [user.role || 'EMPLOYEE'],
      forcePasswordChange: user.force_password_change,
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.full_name,
        roles: [user.role || 'EMPLOYEE'],
        forcePasswordChange: user.force_password_change,
      },
    };
  }

  async createDefaultAdmin() {
    try {
      // Check if admin user already exists
      const existing = await this.prisma.users.findFirst({
        where: { email: 'admin@najmo.dz' },
      });

      const hashedPassword = await bcrypt.hash('admin123', 10);

      if (existing) {
        // Just make sure it has password set
        await this.prisma.users.update({
          where: { id: existing.id },
          data: {
            local_password: hashedPassword,
            role: 'ADMIN',
            force_password_change: true,
            is_active: true,
          },
        });
        return {
          message: 'Admin déjà existant, mot de passe réinitialisé à admin123',
          user: { id: existing.id.toString(), email: existing.email, name: existing.full_name },
        };
      }

      // Create default admin user
      const user = await this.prisma.users.create({
        data: {
          keycloak_user_id: 'local-admin-' + Date.now(),
          full_name: 'Administrateur NAJMO',
          email: 'admin@najmo.dz',
          local_password: hashedPassword,
          role: 'ADMIN',
          force_password_change: true,
          is_active: true,
        },
      });

      await this.audit.log({
        userId: user.id,
        action: 'CREATE_ADMIN_SETUP',
        entityType: 'users',
        entityId: user.id,
      });

      return {
        message: '✅ Compte administrateur créé avec succès',
        credentials: {
          email: 'admin@najmo.dz',
          password: 'admin123',
          note: 'Changez ce mot de passe dès que possible',
        },
        user: { id: user.id.toString(), email: user.email, name: user.full_name },
      };
    } catch (error) {
      this.logger.error('Setup admin error:', error);
      return { error: error.message };
    }
  }
}
