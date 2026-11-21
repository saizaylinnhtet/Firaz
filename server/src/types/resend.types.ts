export type ResendEmailBody = {
    from: string,
    to: string,
    replyTo: string,
    subject: string,
    text: string
}