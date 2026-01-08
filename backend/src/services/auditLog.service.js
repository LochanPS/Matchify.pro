import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class AuditLogService {
  /**
   * Log an admin action (immutable)
   */
  static async log({
    adminId,
    action,
    entityType,
    entityId = null,
    details = {},
    ipAddress = null,
    userAgent = null,
  }) {
    try {
      const log = await prisma.auditLog.create({
        data: {
          adminId,
          action,
          entityType,
          entityId,
          details: JSON.stringify(details),
          ipAddress,
          userAgent,
        },
      });

      console.log(`[AUDIT] ${action} by admin ${adminId} on ${entityType} ${entityId || ''}`);
      return log;
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging failure shouldn't break operations
      return null;
    }
  }

  /**
   * Get all audit logs (paginated)
   */
  static async getAll({ page = 1, limit = 50, action, entityType, adminId, startDate, endDate }) {
    const skip = (page - 1) * limit;

    const where = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (adminId) where.adminId = adminId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Parse JSON details
    const logsWithParsedDetails = logs.map(log => ({
      ...log,
      details: JSON.parse(log.details),
    }));

    return {
      logs: logsWithParsedDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get logs for specific entity
   */
  static async getByEntity(entityType, entityId) {
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Parse JSON details
    return logs.map(log => ({
      ...log,
      details: JSON.parse(log.details),
    }));
  }
}

export default AuditLogService;
