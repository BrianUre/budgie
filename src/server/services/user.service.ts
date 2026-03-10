import type { PrismaClient } from "@prisma/client";

export class UserService {
  constructor(private readonly db: PrismaClient) {}

  async upsert(
    id: string,
    email: string,
    name?: string | null,
    imageUrl?: string | null
  ) {
    return this.db.user.upsert({
      where: { id },
      create: {
        id,
        email,
        name: name ?? undefined,
        imageUrl: imageUrl ?? undefined,
      },
      update: {
        email,
        name: name ?? undefined,
        imageUrl: imageUrl ?? undefined,
      },
    });
  }

  async delete(id: string) {
    return this.db.user.delete({
      where: { id },
    });
  }

  async getById(id: string) {
    return this.db.user.findUnique({
      where: { id },
    });
  }
}
