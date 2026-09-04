import Link from "next/link";
import { InfoPage } from "@/components/info-page";

export default function HelpPage() {
  return <InfoPage eyebrow="Registration support" title="Need help?" intro="Use these quick checks if you cannot complete your registration or join the live session.">
    <section><h2>I cannot continue with my number</h2><p>Enter a valid 10-digit Indian mobile number without the country code. The portal adds +91 automatically.</p></section>
    <section><h2>I did not receive or lost the code</h2><p>Return to the verification screen and choose “Resend code.” Pilot participants will see the current pilot access code on that screen.</p></section>
    <section><h2>I cannot join the webinar</h2><p>The join button appears 10 minutes before the scheduled start time. Before then, add the session to your calendar and return to this portal.</p></section>
    <section><h2>Still stuck?</h2><p>Visit the <a href="https://www.varmaninnovationlabs.com/" target="_blank" rel="noreferrer">official Varman Innovation Labs website</a> to contact the team, or <Link href="/">restart your registration</Link>.</p></section>
  </InfoPage>;
}
