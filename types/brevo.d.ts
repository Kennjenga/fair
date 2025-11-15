/**
 * Type declarations for @getbrevo/brevo
 */
declare module '@getbrevo/brevo' {
  export class TransactionalEmailsApi {
    setApiKey(key: string, value: string): void;
    sendTransacEmail(email: SendSmtpEmail): Promise<CreateSmtpEmail>;
  }

  export enum TransactionalEmailsApiApiKeys {
    apiKey = 'api-key',
  }

  export class SendSmtpEmail {
    subject?: string;
    htmlContent?: string;
    textContent?: string;
    sender?: { email: string; name: string };
    to?: Array<{ email: string }>;
  }

  export interface CreateSmtpEmail {
    messageId: string;
  }
}


