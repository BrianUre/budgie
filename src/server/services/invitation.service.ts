import type { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { createHash, randomBytes } from "crypto";
import type { UserService } from "./user.service";

const DEFAULT_EXPIRY_HOURS = 48;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type PendingInvitationWithUser = {
  id: string;
  email: string;
  createdAt: Date;
  user: { name: string | null; imageUrl: string | null } | null;
};

export class InvitationService {
  constructor(
    private readonly db: PrismaClient,
    private readonly userService: UserService
  ) {}

  buildInvitationUrl(token: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return `${baseUrl}/invitations?token=${encodeURIComponent(token)}`;
  }

  async listPendingForBudgie(
    budgieId: string
  ): Promise<PendingInvitationWithUser[]> {
    const list = await this.db.invitation.findMany({
      where: { budgieId, resolved: false },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, createdAt: true },
    });
    const result: PendingInvitationWithUser[] = await Promise.all(
      list.map(async (invitation) => {
        const user = await this.userService.getByEmail(invitation.email);
        return {
          id: invitation.id,
          email: invitation.email,
          createdAt: invitation.createdAt,
          user,
        };
      })
    );
    return result;
  }

  async createForBudgie(
    budgieId: string,
    email: string,
    invitedByUserId: string,
    invitationMessage?: string
  ): Promise<{ invitation: { id: string }; token: string }> {
    const normalizedEmail = email.trim();

    const existingContributor = await this.db.contributor.findFirst({
      where: {
        budgieId,
        user: {
          email: { equals: normalizedEmail, mode: "insensitive" },
        },
      },
    });
    if (existingContributor) {
      throw new Error("This email is already a contributor");
    }

    const existingInvitation = await this.db.invitation.findFirst({
      where: {
        budgieId,
        email: { equals: normalizedEmail, mode: "insensitive" },
        resolved: false,
      },
    });
    if (existingInvitation) {
      throw new Error("An invitation for this email is already pending");
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(
      Date.now() + DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000
    );

    const invitation = await this.db.invitation.create({
      data: {
        email,
        invitedById: invitedByUserId,
        budgieId,
        tokenHash,
        expiresAt,
        invitationMessage: invitationMessage ?? "",
      },
    });

    return { invitation: { id: invitation.id }, token };
  }

  async getByToken(token: string) {
    const tokenHash = hashToken(token);
    return this.db.invitation.findUnique({
      where: { tokenHash },
      include: {
        budgie: true,
        invitedBy: true,
      },
    });
  }

  async accept(
    token: string,
    userId: string
  ): Promise<{ budgieId: string; alreadyContributor: boolean }> {
    const invitation = await this.getByToken(token);
    if (!invitation) {
      throw new Error("Invitation not found");
    }
    if (invitation.accepted || invitation.resolved) {
      throw new Error("Invitation already used");
    }
    if (invitation.expiresAt < new Date()) {
      throw new Error("Invitation has expired");
    }

    const user = await this.db.user.findUnique({
      where: { id: userId },
    });
    const invitedEmail = invitation.email.trim().toLowerCase();
    const userEmail = user?.email?.trim().toLowerCase() ?? "";
    if (userEmail !== invitedEmail) {
      throw new Error("This invitation was sent to a different email address.");
    }

    const existingContributor = await this.db.contributor.findFirst({
      where: { budgieId: invitation.budgieId, userId },
    });

    if (existingContributor) {
      await this.db.invitation.update({
        where: { id: invitation.id },
        data: { resolved: true },
      });
      return { budgieId: invitation.budgieId, alreadyContributor: true };
    }

    const name = user?.name ?? user?.email ?? "Contributor";

    await this.db.$transaction(async (tx) => {
      const newContributor = await tx.contributor.create({
        data: {
          budgieId: invitation.budgieId,
          name,
          userId,
          isAdmin: false,
        },
      });

      const costs = await tx.cost.findMany({
        where: { month: { budgieId: invitation.budgieId } },
      });

      if (costs.length > 0) {
        await tx.contribution.createMany({
          data: costs.map((cost) => ({
            costId: cost.id,
            contributorId: newContributor.id,
            percentage: new Decimal(0),
          })),
        });
      }

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { accepted: true, resolved: true },
      });
    });

    return { budgieId: invitation.budgieId, alreadyContributor: false };
  }

  async cancel(invitationId: string, userId: string): Promise<void> {
    const invitation = await this.db.invitation.findUnique({
      where: { id: invitationId },
      include: { budgie: true },
    });
    if (!invitation) {
      throw new Error("Invitation not found");
    }
    if (invitation.invitedById !== userId) {
      const isAdmin = await this.db.contributor.findFirst({
        where: {
          budgieId: invitation.budgieId,
          userId,
          isAdmin: true,
        },
      });
      if (!isAdmin) {
        throw new Error("Not authorized to cancel this invitation");
      }
    }

    await this.db.invitation.update({
      where: { id: invitationId },
      data: { resolved: true },
    });
  }
}
