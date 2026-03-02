import type { PrismaClient } from "@prisma/client";

export class ContributorService {
  constructor(private readonly db: PrismaClient) {}

  async getById(contributorId: string) {
    return this.db.contributor.findUnique({
      where: { id: contributorId },
    });
  }

  async listForBudgie(budgieId: string) {
    return this.db.contributor.findMany({
      where: { budgieId },
      orderBy: { name: "asc" },
    });
  }

  async add(data: { budgieId: string; name: string }) {
    return this.db.contributor.create({
      data,
    });
  }

  async delete(contributorId: string) {
    return this.db.contributor.delete({
      where: { id: contributorId },
    });
  }
}

export type Contributor = Awaited<ReturnType<ContributorService["getById"]>>;

export type Contributors = Awaited<
  ReturnType<ContributorService["listForBudgie"]>
>;
