/**
 * AI Policy Generator Service
 * Uses AI to generate enhanced cookie policy content
 */

interface CookieData {
  name: string;
  domain: string;
  category: 'necessary' | 'functional' | 'analytics' | 'advertising';
  expiry: string;
  description: string;
}

interface PolicyGenerationOptions {
  companyName: string;
  contactEmail: string;
  websiteUrl: string;
  jurisdiction?: 'EU' | 'US' | 'IN' | 'global';
}

export class AIPolicyGenerator {
  private static readonly API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyDTuDL4Q-Vp7y0RpVqz6uT9phimJOEHtdU';
  private static readonly API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  /**
   * Generate enhanced cookie policy using AI
   */
  static async generatePolicy(
    cookies: CookieData[],
    options: PolicyGenerationOptions
  ): Promise<string> {
    try {
      // Prepare cookie summary for the AI
      const cookieSummary = this.prepareCookieSummary(cookies);

      // Create the prompt for AI
      const prompt = this.createPolicyPrompt(cookieSummary, options);

      // Call AI API
      const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Invalid response from AI service');
      }
    } catch (error) {
      console.error('AI Policy Generation Error:', error);
      // Fallback to template-based generation
      return this.generateFallbackPolicy(cookies, options);
    }
  }

  /**
   * Prepare cookie summary for AI prompt
   */
  private static prepareCookieSummary(cookies: CookieData[]): string {
    const cookiesByCategory = cookies.reduce((acc, cookie) => {
      if (!acc[cookie.category]) {
        acc[cookie.category] = [];
      }
      acc[cookie.category].push(cookie);
      return acc;
    }, {} as Record<string, CookieData[]>);

    let summary = `Cookie Analysis Summary:\n\n`;

    Object.entries(cookiesByCategory).forEach(([category, cookieList]) => {
      summary += `${category.toUpperCase()} Cookies (${cookieList.length}):\n`;
      cookieList.slice(0, 10).forEach(cookie => {
        summary += `- ${cookie.name} (${cookie.domain}): ${cookie.description || 'No description'}\n`;
      });
      if (cookieList.length > 10) {
        summary += `... and ${cookieList.length - 10} more\n`;
      }
      summary += '\n';
    });

    return summary;
  }

  /**
   * Create comprehensive prompt for AI
   */
  private static createPolicyPrompt(cookieSummary: string, options: PolicyGenerationOptions): string {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `As a legal content expert, generate a comprehensive cookie policy for ${options.companyName} based on the following cookie analysis.

Website: ${options.websiteUrl}
Contact: ${options.contactEmail}
Date: ${currentDate}
Jurisdiction: ${options.jurisdiction || 'global'}

${cookieSummary}

Requirements:
1. Create a professional, GDPR and DPDPA 2023 compliant cookie policy
2. Include sections for: Introduction, What Are Cookies, How We Use Cookies, Types of Cookies, Third-Party Cookies, Managing Preferences, Your Rights, Updates, and Contact
3. For each cookie category found, provide detailed explanations and examples
4. Include specific cookie names where relevant
5. Add practical guidance for users on managing cookies
6. Ensure the tone is professional yet easy to understand
7. Do not mention AI or automated generation
8. Format using markdown with clear headings (# ## ###)
9. Include a disclaimer at the end about legal consultation

Generate the complete cookie policy now:`;
  }

  /**
   * Fallback policy generation when AI fails
   */
  private static generateFallbackPolicy(cookies: CookieData[], options: PolicyGenerationOptions): string {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const cookiesByCategory = cookies.reduce((acc, cookie) => {
      if (!acc[cookie.category]) {
        acc[cookie.category] = [];
      }
      acc[cookie.category].push(cookie);
      return acc;
    }, {} as Record<string, CookieData[]>);

    let policy = `# Cookie Policy for ${options.companyName}

**Last Updated:** ${currentDate}

## Introduction

${options.companyName} is committed to protecting your privacy. This Cookie Policy explains how we use cookies and similar technologies on our website (${options.websiteUrl}).

## What Are Cookies?

Cookies are small text files stored on your device when you visit a website. They help us provide you with a better experience by remembering your preferences and enabling certain functionality.

## How We Use Cookies

We use cookies to:
- Ensure the website functions properly
- Remember your preferences
- Analyze website traffic
- Provide personalized content
- Display relevant advertisements

## Types of Cookies We Use

Based on our analysis, we use the following cookies:
`;

    Object.entries(cookiesByCategory).forEach(([category, cookieList]) => {
      const categoryInfo = {
        necessary: {
          title: 'Essential Cookies',
          description: 'These cookies are essential for the website to function.'
        },
        functional: {
          title: 'Functional Cookies',
          description: 'These cookies enable enhanced functionality and personalization.'
        },
        analytics: {
          title: 'Analytics Cookies',
          description: 'These cookies help us understand how visitors interact with our website.'
        },
        advertising: {
          title: 'Advertising Cookies',
          description: 'These cookies are used to display relevant advertisements.'
        }
      }[category];

      policy += `
### ${categoryInfo?.title}

${categoryInfo?.description}

**Cookies in this category:**
${cookieList.map(c => `- **${c.name}**: ${c.description || 'Used for ' + category + ' purposes'}`).join('\n')}
`;
    });

    policy += `
## Managing Your Cookies

You can control cookies through:
- Your browser settings
- Our cookie consent banner
- Privacy settings on third-party websites

## Your Rights

You have the right to:
- Know what cookies we use
- Accept or reject cookies
- Withdraw consent at any time
- Access information about cookies

## Contact Us

If you have questions about this Cookie Policy, please contact us:
- Email: ${options.contactEmail}
- Website: ${options.websiteUrl}

---

*This policy was generated based on the cookies found on our website. For legal advice, please consult with a legal professional.*`;

    return policy;
  }

  /**
   * Enhance existing policy with AI
   */
  static async enhancePolicy(
    existingPolicy: string,
    cookies: CookieData[],
    options: PolicyGenerationOptions
  ): Promise<string> {
    try {
      const prompt = `Enhance the following cookie policy to be more comprehensive and professional. Add specific details about the cookies found, improve clarity, and ensure legal compliance.

Current Policy:
${existingPolicy}

Cookie Analysis:
${this.prepareCookieSummary(cookies)}

Company: ${options.companyName}
Website: ${options.websiteUrl}

Please enhance the policy by:
1. Adding more detailed explanations for each cookie type found
2. Including specific cookie names and their purposes
3. Improving the professional tone and clarity
4. Adding practical examples where appropriate
5. Ensuring GDPR and DPDPA compliance
6. Do not mention AI or automated generation

Return the enhanced policy:`;

      const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      } else {
        return existingPolicy;
      }
    } catch (error) {
      console.error('AI Policy Enhancement Error:', error);
      return existingPolicy;
    }
  }
}
