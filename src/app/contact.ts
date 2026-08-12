/* The one place the contact address is written down. It appears in the contact
   section, the JSON-LD in layout.tsx, the Ask AI grounding in profile.ts and
   the privacy notice, so a change here has to be a change everywhere.

   To move to an address on the domain (hello@pavletosic.com), add the forwarder
   at the REGISTRAR first — mail for pavletosic.com is delivered by Namecheap's
   eforward1-5.registrar-servers.com, not by Cloudflare — send yourself a test
   message, and only then edit this line. Publishing an address before it
   delivers loses real mail. */
export const EMAIL = "tosiicsftw@gmail.com";
