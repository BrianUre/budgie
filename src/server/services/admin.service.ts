import type { PrismaClient } from "@prisma/client";

export class AdminService {
  constructor(private readonly db: PrismaClient) {}

  async listAdminsForBudgie(budgieId: string) {
    return this.db.admin.findMany({
      where: { budgieId },
      include: { user: true },
    });
  }

  async addAdmin(budgieId: string, userId: string) {
    return this.db.admin.upsert({
      where: {
        budgieId_userId: { budgieId, userId },
      },
      create: { budgieId, userId },
      update: {},
    });
  }

  async isAdmin(budgieId: string, userId: string): Promise<boolean> {
    const admin = await this.db.admin.findUnique({
      where: {
        budgieId_userId: { budgieId, userId },
      },
    });
    return !!admin;
  }
}
