import type { PrismaClient } from "@prisma/client";

export class DestinationService {
  constructor(private readonly db: PrismaClient) {}

  async listByBudgie(budgieId: string) {
    return this.db.destination.findMany({
      where: { budgieId },
      orderBy: { name: "asc" },
    });
  }

  async getById(id: string) {
    return this.db.destination.findUnique({
      where: { id },
    });
  }

  async create(budgieId: string, name: string) {
    return this.db.destination.create({
      data: { budgieId, name: name.trim() },
    });
  }

  async update(id: string, name: string) {
    return this.db.destination.update({
      where: { id },
      data: { name: name.trim() },
    });
  }

  async delete(id: string) {
    return this.db.destination.delete({
      where: { id },
    });
  }
}
