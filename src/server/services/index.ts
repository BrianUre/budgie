import type { PrismaClient } from "@prisma/client";
import { BudgieService } from "./budgie.service";
import { ContributionService } from "./contribution.service";
import { ContributorService } from "./contributor.service";
import { CostService } from "./cost.service";
import { ExpenseService } from "./expense.service";
import { MonthService } from "./month.service";
import { UserService } from "./user.service";

export function createServices(db: PrismaClient) {
  return {
    budgie: new BudgieService(db),
    month: new MonthService(db),
    expense: new ExpenseService(db),
    cost: new CostService(db),
    contributor: new ContributorService(db),
    contribution: new ContributionService(db),
    user: new UserService(db),
  };
}

export type Services = ReturnType<typeof createServices>;

export { BudgieService } from "./budgie.service";
export { ContributionService } from "./contribution.service";
export type { ContributionInput } from "./contribution.service";
export { ContributorService } from "./contributor.service";
export { CostService } from "./cost.service";
export { ExpenseService } from "./expense.service";
export { MonthService } from "./month.service";
export { UserService } from "./user.service";
