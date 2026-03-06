import { Resend } from "resend";
import type { EmailContentService } from "./email-content.service";

export class EmailService {
  private readonly resend: Resend;
  private readonly from: string;

  constructor(
    private readonly contentService: EmailContentService,
    resendClient?: Resend
  ) {
    this.resend = resendClient ?? new Resend(process.env.RESEND_API_KEY);
    this.from =
      process.env.EMAIL_FROM ?? "Budgie <onboarding@resend.dev>";
  }

  async sendBudgieInvitation(
    to: string,
    params: { hostName: string; budgieName: string; invitationLink: string }
  ): Promise<void> {
    const { html } = this.contentService.render("sendBudgieInvitation", params);
    const subject = `You're invited to ${params.budgieName}`;
    await this.resend.emails.send({
      from: this.from,
      to,
      subject,
      html,
    });
  }
}
