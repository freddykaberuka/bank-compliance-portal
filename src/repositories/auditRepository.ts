import prisma from '../prisma';
import { ApplicationState } from '../generated/prisma/enums';

export type AuditLogCreateParams = {
  userId: string;
  applicationId: string;
  action: string;
  previousState?: ApplicationState | null;
  newState?: ApplicationState | null;
  details?: any;
};

export const AuditRepository = {
  async create(data: AuditLogCreateParams) {
    return prisma.auditLog.create({ data });
  },

  async createWithTransaction(tx: any, data: AuditLogCreateParams) {
    return tx.auditLog.create({ data });
  },
};
