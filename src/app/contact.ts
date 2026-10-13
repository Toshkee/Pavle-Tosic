/* The one place the contact address is written down. It appears in the contact
   card, the chat's error line, /about, the privacy notice, the JSON-LD in
   layout.tsx and the system prompt (so llms.txt too), so a change here is a
   change everywhere. public/.well-known/security.txt and SECURITY.md spell it
   out by hand: change them with it.

   Mail for pavletosic.com is Zoho Mail (EU): MX at mx.zoho.eu, SPF includes
   zohomail.eu, DKIM under the `zmail` selector. DMARC is p=reject with strict
   alignment, so a new sending service needs its SPF and DKIM on the domain
   before its first message, or that message bounces. */
export const EMAIL = "hello@pavletosic.com";
