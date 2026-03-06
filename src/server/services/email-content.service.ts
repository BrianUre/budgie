import Handlebars from "handlebars";
import path from "path";
import fs from "fs";

export class EmailContentService {
  private readonly templateDir: string;
  private readonly cache = new Map<string, Handlebars.TemplateDelegate>();

  constructor(
    templateDir = path.join(process.cwd(), "src/server/emails/templates")
  ) {
    this.templateDir = templateDir;
  }

  render(templateName: string, params: Record<string, unknown>): { html: string } {
    let compile = this.cache.get(templateName);
    if (!compile) {
      const filePath = path.join(this.templateDir, `${templateName}.hbs`);
      const source = fs.readFileSync(filePath, "utf-8");
      compile = Handlebars.compile(source);
      this.cache.set(templateName, compile);
    }
    const html = compile(params);
    return { html };
  }
}
