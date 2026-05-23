import { Injectable, InternalServerErrorException, ConflictException, Logger, OnModuleInit, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async findAll() {
    const dbUsers = await this.prisma.users.findMany({
      orderBy: { created_at: 'desc' }
    });

    const kcAdminClient = new KcAdminClient({
      baseUrl: this.configService.get<string>('KEYCLOAK_AUTH_SERVER_URL'),
      realmName: 'master',
    });

    try {
      await kcAdminClient.auth({
        username: this.configService.get<string>('KEYCLOAK_ADMIN_USERNAME') || 'admin',
        password: this.configService.get<string>('KEYCLOAK_ADMIN_PASSWORD') || 'admin',
        grantType: 'password',
        clientId: 'admin-cli',
      });

      const targetRealm = this.configService.get<string>('KEYCLOAK_REALM') || 'finance-system';
      kcAdminClient.setConfig({ realmName: targetRealm });

      const usersWithRoles = await Promise.all(
        dbUsers.map(async (user) => {
          try {
            const mappings = await kcAdminClient.users.listRealmRoleMappings({
              id: user.keycloak_user_id as string,
            });
            const customRoles = mappings
              .map((r: any) => r.name)
              .filter((name: string) => ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'].includes(name.toUpperCase()));
            
            const roleTranslations: Record<string, string> = {
              'ADMIN': 'Administrateur',
              'EMPLOYEE': 'Employé',
              'ACCOUNTANT': 'Comptable',
            };
            const role = roleTranslations[customRoles[0]?.toUpperCase()] || customRoles[0] || 'Aucun';

            return {
              ...user,
              role,
            };
          } catch (e) {
            return {
              ...user,
              role: 'Aucun',
            };
          }
        })
      );

      return usersWithRoles;
    } catch (error) {
      this.logger.error('Failed to fetch user roles from Keycloak', error);
      return dbUsers.map(user => ({ ...user, role: 'Aucun' }));
    }
  }

  async createUser(createUserDto: CreateUserDto, accessToken: string) {
    const kcAdminClient = new KcAdminClient({
      baseUrl: this.configService.get<string>('KEYCLOAK_AUTH_SERVER_URL'),
      realmName: 'master',
    });

    // Authenticate with the master admin credentials to obtain administrative rights
    await kcAdminClient.auth({
      username: this.configService.get<string>('KEYCLOAK_ADMIN_USERNAME') || 'admin',
      password: this.configService.get<string>('KEYCLOAK_ADMIN_PASSWORD') || 'admin',
      grantType: 'password',
      clientId: 'admin-cli',
    });

    // Switch context to target realm for subsequent operations
    const targetRealm = this.configService.get<string>('KEYCLOAK_REALM') || 'finance-system';
    kcAdminClient.setConfig({
      realmName: targetRealm,
    });

    try {
      // 1. Create User in Keycloak
      const kcUser = await kcAdminClient.users.create({
        username: createUserDto.username,
        email: createUserDto.email,
        firstName: createUserDto.fullName.split(' ')[0],
        lastName: createUserDto.fullName.split(' ').slice(1).join(' '),
        enabled: true,
        emailVerified: true,
        credentials: [{
          type: 'password',
          value: createUserDto.password,
          temporary: false,
        }],
      });

      // 2. Assign Role in Keycloak
      const roles = await kcAdminClient.roles.find();
      
      const roleMapping: Record<string, string> = {
        'EMPLOYÉ': 'EMPLOYEE',
        'EMPLOYE': 'EMPLOYEE',
        'COMPTABLE': 'ACCOUNTANT',
        'ADMIN': 'ADMIN',
        'ADMINISTRATEUR': 'ADMIN',
      };

      const targetRoleName = roleMapping[createUserDto.role.toUpperCase()] || createUserDto.role.toUpperCase();
      const role = roles.find((r: any) => r.name?.toUpperCase() === targetRoleName);
      
      if (role && role.id && role.name) {
        await kcAdminClient.users.addRealmRoleMappings({
          id: kcUser.id!,
          roles: [{
            id: role.id,
            name: role.name,
          }],
        });
      } else {
        this.logger.warn(`Role ${createUserDto.role} not found in Keycloak realm`);
      }

      // 3. Create User in Database
      const dbUser = await this.prisma.users.create({
        data: {
          keycloak_user_id: kcUser.id,
          email: createUserDto.email,
          full_name: createUserDto.fullName,
          is_active: true,
        },
      });

      return dbUser;
    } catch (error: any) {
      this.logger.error('Error creating user inside UsersService:', error);
      if (error?.response?.data) {
        this.logger.error('Keycloak API Error Data:', JSON.stringify(error.response.data));
      }
      if (error?.response?.status === 409) {
        throw new ConflictException('User already exists in Keycloak');
      }
      throw new InternalServerErrorException(error?.response?.data?.errorMessage || error?.message || 'Failed to create user');
    }
  }
  async deleteUser(id: string, adminId?: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: BigInt(id) },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }

    const kcAdminClient = new KcAdminClient({
      baseUrl: this.configService.get<string>('KEYCLOAK_AUTH_SERVER_URL'),
      realmName: 'master',
    });

    await kcAdminClient.auth({
      username: this.configService.get<string>('KEYCLOAK_ADMIN_USERNAME') || 'admin',
      password: this.configService.get<string>('KEYCLOAK_ADMIN_PASSWORD') || 'admin',
      grantType: 'password',
      clientId: 'admin-cli',
    });

    const targetRealm = this.configService.get<string>('KEYCLOAK_REALM') || 'finance-system';
    kcAdminClient.setConfig({ realmName: targetRealm });

    // 1. Try to delete the user from Keycloak
    try {
      if (user.keycloak_user_id !== 'default-admin') {
        await kcAdminClient.users.del({ id: user.keycloak_user_id as string });
      }
    } catch (kcError: any) {
      this.logger.warn(`Failed to delete user from Keycloak: ${kcError.message}`);
    }

    // 2. Try to delete from local database
    try {
      await this.prisma.users.delete({
        where: { id: BigInt(id) },
      });
      return { message: 'Utilisateur supprimé avec succès de Keycloak et de la base de données.' };
    } catch (dbError: any) {
      // If user is linked to financial data (foreign key error P2003)
      if (dbError.code === 'P2003') {
        // Safe Automatic Reassignment to the active Admin
        if (adminId && BigInt(adminId) !== BigInt(id)) {
          const deletedUserId = BigInt(id);
          const newAdminId = BigInt(adminId);

          try {
            this.logger.log(`Reassigning all records of user ${id} to active admin ${adminId}...`);

            // Reassign operations created by deleted user
            await this.prisma.operations.updateMany({
              where: { created_by_user_id: deletedUserId },
              data: { created_by_user_id: newAdminId },
            });

            // Reassign operations validated by deleted user
            await this.prisma.operations.updateMany({
              where: { validated_by_user_id: deletedUserId },
              data: { validated_by_user_id: newAdminId },
            });

            // Reassign expenses created by deleted user
            await this.prisma.expenses.updateMany({
              where: { created_by_user_id: deletedUserId },
              data: { created_by_user_id: newAdminId },
            });

            // Reassign internal transfers created by deleted user
            await this.prisma.internal_transfers.updateMany({
              where: { created_by_user_id: deletedUserId },
              data: { created_by_user_id: newAdminId },
            });

            // Reassign payments created by deleted user
            await this.prisma.payments.updateMany({
              where: { created_by_user_id: deletedUserId },
              data: { created_by_user_id: newAdminId },
            });

            // Reassign audit logs created by deleted user
            await this.prisma.audit_logs.updateMany({
              where: { user_id: deletedUserId },
              data: { user_id: newAdminId },
            });

            // Reassign exchange rates created by deleted user
            await this.prisma.exchange_rates.updateMany({
              where: { created_by_user_id: deletedUserId },
              data: { created_by_user_id: newAdminId },
            });

            // Delete user-account linkages
            await this.prisma.user_accounts.deleteMany({
              where: { user_id: deletedUserId },
            });

            // Now that all references have been reassigned, retry deleting from database!
            await this.prisma.users.delete({
              where: { id: deletedUserId },
            });

            return { 
              message: 'L\'ancien Administrateur a été supprimé avec succès de la base de données. ' +
                       'Toutes ses opérations historiques ont été automatiquement réassignées à votre compte Administrateur actuel (FAROUK).' 
            };
          } catch (reassignError: any) {
            this.logger.error('Failed to reassign historical records during user delete:', reassignError);
          }
        }

        // Fallback: Disable them in Keycloak to lock access safely if reassignment failed or was skipped
        try {
          await kcAdminClient.users.update({ id: user.keycloak_user_id as string }, { enabled: false });
        } catch (e) {}

        // Deactivate in local DB
        await this.prisma.users.update({
          where: { id: BigInt(id) },
          data: { is_active: false },
        });

        return { 
          message: 'L\'utilisateur est lié à des opérations financières existantes. ' +
                   'Il a été désactivé de manière sécurisée pour préserver les rapports.' 
        };
      }
      throw new InternalServerErrorException('Erreur lors de la suppression de l\'utilisateur.');
    }
  }
}
