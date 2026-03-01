import type { PrismaClient } from "@prisma/client";

export class UserService {
  constructor(private readonly db: PrismaClient) {}

  async upsert(id: string, email: string) {
    return this.db.user.upsert({
      where: { id },
      create: { id, email },
      update: { email },
    });
  }

  async getById(id: string) {
    return this.db.user.findUnique({
      where: { id },
    });
  }
}
