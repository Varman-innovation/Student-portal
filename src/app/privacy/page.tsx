import { InfoPage } from "@/components/info-page";

export default function PrivacyPage() {
  return <InfoPage eyebrow="Your privacy" title="Privacy Policy" intro="This notice explains how Varman Innovation Labs uses information submitted through the student masterclass portal.">
    <section><h2>Information we collect</h2><p>We collect your mobile number, name, college or institution, education details, preferred language, learning interests, campaign source, and registration activity.</p></section>
    <section><h2>How we use it</h2><p>We use this information to verify your registration, reserve your webinar seat, communicate session updates, improve student programmes, and understand which outreach campaigns are useful.</p></section>
    <section><h2>Sharing and protection</h2><p>We do not sell student data. Access is limited to authorised Varman team members and service providers needed to operate the portal and live session. We use reasonable safeguards and retain information only as long as needed for these purposes or applicable obligations.</p></section>
    <section><h2>Your choices</h2><p>You may ask to access, correct, or delete your submitted information by contacting Varman Innovation Labs through its official website. Some records may be retained where required for security or legal reasons.</p></section>
    <p className="policy-date">Last updated: 3 September 2026</p>
  </InfoPage>;
}
