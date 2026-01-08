import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import juice from 'juice';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TemplateService {
  constructor() {
    this.compiledTemplates = {};
    this.basePath = path.join(__dirname, '../../templates/emails');
  }

  // Load and compile a template
  async loadTemplate(templateName) {
    if (this.compiledTemplates[templateName]) {
      return this.compiledTemplates[templateName];
    }

    try {
      const templatePath = path.join(this.basePath, `${templateName}.hbs`);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const compiled = Handlebars.compile(templateContent);
      
      this.compiledTemplates[templateName] = compiled;
      return compiled;
    } catch (error) {
      console.error(`Error loading template ${templateName}:`, error);
      throw new Error(`Template ${templateName} not found`);
    }
  }

  // Render email with base layout
  async renderEmail(templateName, data) {
    const template = await this.loadTemplate(templateName);
    const baseTemplate = await this.loadTemplate('base');
    
    const content = template(data);
    const fullHtml = baseTemplate({
      ...data,
      content,
      unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?email=${data.email}`
    });

    // Inline CSS for better email client support
    return juice(fullHtml);
  }

  // Generate plain text version from HTML
  htmlToText(html) {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gs, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Render both HTML and text versions
  async renderBoth(templateName, data) {
    const html = await this.renderEmail(templateName, data);
    const text = this.htmlToText(html);
    
    return { html, text };
  }
}

export default new TemplateService();
