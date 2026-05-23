import { HttpException, HttpStatus } from '@nestjs/common';

export class PermissionDeniedException extends HttpException {
  constructor(message = 'Accès interdit : privilèges insuffisants') {
    super(
      {
        success: false,
        error: message,
        data: null,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class BusinessRuleException extends HttpException {
  constructor(message: string) {
    super(
      {
        success: false,
        error: message,
        data: null,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class EntityNotFoundException extends HttpException {
  constructor(entity: string, id: string | number) {
    super(
      {
        success: false,
        error: `${entity} avec l'identifiant ${id} est introuvable`,
        data: null,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
