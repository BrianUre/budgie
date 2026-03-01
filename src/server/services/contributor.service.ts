import type { PrismaClient } from "@prisma/client";

export class ContributorService {
  constructor(private readonly db: PrismaClient) {}

  async listForBudgie(budgieId: string) {
    return this.db.contributor.findMany({
      where: { budgieId },
      orderBy: { name: "asc" },
    });
  }

  async create(data: { budgieId: string; name: string }) {
    return this.db.contributor.create({
      data,
    });
  }
}
