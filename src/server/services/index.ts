import type { PrismaClient } from "@prisma/client";
import { BudgieService } from "./budgie.service";
import { ContributionService } from "./contribution.service";
import { ContributorService } from "./contributor.service";
import { CostService } from "./cost.service";
import { DestinationService } from "./destination.service";
import { EmailContentService } from "./email-content.service";
import { EmailService } from "./email.service";
import { ExpenseService } from "./expense.service";
import { InvitationService } from "./invitation.service";
import { MonthService } from "./month.service";
import { UserService } from "./user.service";

export function createServices(db: PrismaClient) {
  const emailContent = new EmailContentService();
  const email = new EmailService(emailContent);
  const user = new UserService(db);
  return {
    budgie: new BudgieService(db),
    month: new MonthService(db),
    expense: new ExpenseService(db),
    cost: new CostService(db),
    contributor: new ContributorService(db),
    contribution: new ContributionService(db),
    destination: new DestinationService(db),
    user,
    invitation: new InvitationService(db, user),
    emailContent,
    email,
  };
}

export type Services = ReturnType<typeof createServices>;

export { BudgieService } from "./budgie.service";
export { ContributionService } from "./contribution.service";
export type { ContributionInput } from "./contribution.service";
export { ContributorService } from "./contributor.service";
export { CostService } from "./cost.service";
export { DestinationService } from "./destination.service";
export { EmailContentService } from "./email-content.service";
export { EmailService } from "./email.service";
export { ExpenseService } from "./expense.service";
export { InvitationService } from "./invitation.service";
export { MonthService } from "./month.service";
export { UserService } from "./user.service";
