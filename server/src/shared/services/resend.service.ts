import { Resend } from 'resend';
import type { ResendEmailBody } from '@/shared/types/resend.types.js';


export class ResendService {
    private readonly resend_api_key: string
    private readonly resend: Resend
    constructor () {
        const resend_api_key = process.env.RESEND_API_KEY
        if (!resend_api_key) {
            throw new Error("Resend is not properly configured")
        }
        this.resend_api_key = resend_api_key
        this.resend = new Resend(this.resend_api_key)
    }

    async sendMail(emailBody: ResendEmailBody) {
        const controller = new AbortController();
        const { data, error  } = await this.resend.emails.send(emailBody, { signal: controller.signal })
        if (error || !data) {
            throw new Error(`Failed to send email: ${error?.message ?? "Unknown error"}`);
        }    
        return data;
    }

}