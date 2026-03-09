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
      include: { user: true },
    });
  }

  async add(data: {
    budgieId: string;
    name?: string;
    userId?: string;
    isAdmin?: boolean;
  }) {
    let name = data.name;
    if (data.userId != null && !name) {
      const user = await this.db.user.findUnique({
        where: { id: data.userId },
      });
      if (!user) throw new Error("User not found");
      name = user.email;
    }
    if (!name?.trim()) throw new Error("Name is required for contributor");
    return this.db.contributor.create({
      data: {
        budgieId: data.budgieId,
        name: name.trim(),
        isAdmin: data.isAdmin ?? false,
        userId: data.userId ?? null,
      },
    });
  }

  async isAdmin(budgieId: string, userId: string): Promise<boolean> {
    const contributor = await this.db.contributor.findFirst({
      where: { budgieId, userId, isAdmin: true },
    });
    return !!contributor;
  }

  async isContributor(budgieId: string, userId: string): Promise<boolean> {
    const contributor = await this.db.contributor.findFirst({
      where: { budgieId, userId },
    });
    return !!contributor;
  }

  async listAdminsForBudgie(budgieId: string) {
    return this.db.contributor.findMany({
      where: { budgieId, isAdmin: true },
      include: { user: true },
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
