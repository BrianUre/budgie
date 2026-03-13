import type { PrismaClient } from "@prisma/client";
import type { DestinationType } from "@/types/destination";

export class DestinationService {
  constructor(private readonly db: PrismaClient) {}

  async listByBudgie(budgieId: string) {
    return this.db.destination.findMany({
      where: { budgieId },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { costs: true } },
      },
    });
  }

  async getById(id: string) {
    return this.db.destination.findUnique({
      where: { id },
    });
  }

  /**
   * Returns the number of costs that reference this destination.
   * Used to block delete when destination is in use.
   */
  async countCostsByDestinationId(id: string): Promise<number> {
    return this.db.cost.count({
      where: { destinationId: id },
    });
  }

  async create(
    budgieId: string,
    name: string,
    recipientName: string,
    type: DestinationType,
    options?: { iban?: string | null; swift?: string | null; phone?: string | null }
  ) {
    return this.db.destination.create({
      data: {
        budgieId,
        name: name.trim(),
        recipientName: recipientName.trim(),
        type,
        ...(options?.iban !== undefined && { iban: options.iban?.trim() || null }),
        ...(options?.swift !== undefined && { swift: options.swift?.trim() || null }),
        ...(options?.phone !== undefined && { phone: options.phone?.trim() || null }),
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      recipientName?: string;
      type?: DestinationType;
      iban?: string | null;
      swift?: string | null;
      phone?: string | null;
    }
  ) {
    const payload: {
      name?: string;
      recipientName?: string;
      type?: string;
      iban?: string | null;
      swift?: string | null;
      phone?: string | null;
    } = {
      name: data.name?.trim(),
      recipientName: data.recipientName?.trim(),
      type: data.type,
      iban: data.iban?.trim() || null,
      swift: data.swift?.trim() || null,
      phone: data.phone?.trim() || null,
    };
    return this.db.destination.update({
      where: { id },
      data: payload,
    });
  }

  async delete(id: string) {
    return this.db.destination.delete({
      where: { id },
    });
  }
}
