import { InfoPage } from "@/components/info-page";

export default function TermsPage() {
  return <InfoPage eyebrow="Participation terms" title="Terms of Use" intro="These terms apply when you register for and use the Varman student masterclass portal.">
    <section><h2>Eligibility and registration</h2><p>You must provide accurate information and use a mobile number you control. A registration is personal to you and may not be transferred.</p></section>
    <section><h2>Live sessions</h2><p>Session dates, hosts, content, capacity, and meeting platforms may change. We will make reasonable efforts to communicate material updates, but access is not guaranteed if a session is cancelled, rescheduled, full, or affected by technical issues.</p></section>
    <section><h2>Acceptable use</h2><p>Do not misuse the portal, attempt unauthorised access, disrupt a session, impersonate another person, or share restricted meeting links. Varman may remove access where necessary to protect participants or the service.</p></section>
    <section><h2>Content and responsibility</h2><p>Masterclass content is educational and does not guarantee funding, employment, business results, or commercial success. You remain responsible for decisions you make based on the session.</p></section>
    <p className="policy-date">Last updated: 3 September 2026</p>
  </InfoPage>;
}
