import { AuditRepository, AuditLogCreateParams } from '../repositories/auditRepository';
import { ApplicationState } from '../generated/prisma/enums';

export type AuditActionParams = AuditLogCreateParams & {
  action: string;
  previousState?: ApplicationState | null;
  newState?: ApplicationState | null;
};

export const AuditService = {
  async logApplicationAction(params: AuditActionParams) {
    return AuditRepository.create(params);
  },

  async logApplicationActionTransaction(tx: any, params: AuditActionParams) {
    return AuditRepository.createWithTransaction(tx, params);
  },
};
