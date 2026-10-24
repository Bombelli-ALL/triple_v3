import { ShieldCheck } from 'lucide-react'
import LegalPageLayout, { type LegalSection } from '@/components/layouts/LegalPageLayout'

export default function PrivacyPolicy() {
	const lastUpdated = 'October 12, 2025'
	const title = 'Privacy Policy'
	const description = 'We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.'

	const sections: LegalSection[] = [
		{
			id: 'introduction',
			title: 'Introduction',
			content: (
				<div>
					<p>
						Welcome to Trippple's Privacy Policy. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.
					</p>
					<p>
						Our core mission is to empower travelers with seamless experiences while maintaining the highest standards of data security and transparency. By reading this document, you'll understand exactly what we collect, why we collect it, and how we keep it safe.
					</p>
				</div>
			)
		},
		{
			id: 'information-we-collect',
			title: 'Information We Collect',
			content: (
				<div>
					<p>
						We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
					</p>
					<ul>
						<li><strong>Identity Data</strong> includes first name, last name, username or similar identifier, marital status, title, date of birth and gender.</li>
						<li><strong>Contact Data</strong> includes billing address, delivery address, email address and telephone numbers.</li>
						<li><strong>Financial Data</strong> includes bank account and payment card details (which are securely processed via certified payment gateways).</li>
						<li><strong>Transaction Data</strong> includes details about payments to and from you and other details of products and services you have purchased from us.</li>
						<li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
					</ul>
					<p>
						We also collect, use and share <strong>Aggregated Data</strong> such as statistical or demographic data for any purpose. Aggregated Data could be derived from your personal data but is not considered personal data in law as this data will not directly or indirectly reveal your identity.
					</p>
				</div>
			)
		},
		{
			id: 'how-we-use-information',
			title: 'How We Use Information',
			content: (
				<div>
					<p>
						We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
					</p>
					<ul>
						<li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
						<li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
						<li>Where we need to comply with a legal obligation.</li>
					</ul>
					<h3>Opting Out</h3>
					<p>
						You can ask us or third parties to stop sending you marketing messages at any time by logging into the website and checking or unchecking relevant boxes to adjust your marketing preferences or by following the opt-out links on any marketing message sent to you.
					</p>
				</div>
			)
		},
		{
			id: 'cookies',
			title: 'Cookies',
			content: (
				<div>
					<p>
						You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that some parts of this website may become inaccessible or not function properly.
					</p>
					<p>
						Our platform utilizes essential cookies for authentication and security, alongside optional analytical cookies to help us improve your browsing experience. We prioritize complete transparency regarding our tracking mechanisms.
					</p>
				</div>
			)
		},
		{
			id: 'data-sharing',
			title: 'Data Sharing',
			content: (
				<div>
					<p>
						We may have to share your personal data with the parties set out below for the purposes outlined in this policy:
					</p>
					<ul>
						<li>Internal Third Parties acting as joint controllers or processors.</li>
						<li>External Third Parties, such as premium travel partners, payment gateways, and IT service providers.</li>
						<li>Third parties to whom we may choose to sell, transfer or merge parts of our business or our assets.</li>
					</ul>
					<p>
						We require all third parties to respect the security of your personal data and to treat it in accordance with the law. We do not allow our third-party service providers to use your personal data for their own purposes.
					</p>
				</div>
			)
		},
		{
			id: 'data-retention',
			title: 'Data Retention',
			content: (
				<div>
					<p>
						We will only retain your personal data for as long as reasonably necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, regulatory, tax, accounting or reporting requirements. We may retain your personal data for a longer period in the event of a complaint or if we reasonably believe there is a prospect of litigation in respect to our relationship with you.
					</p>
					<p>
						To determine the appropriate retention period for personal data, we consider the amount, nature and sensitivity of the personal data, the potential risk of harm from unauthorized use or disclosure of your personal data, and applicable legal requirements.
					</p>
				</div>
			)
		},
		{
			id: 'user-rights',
			title: 'User Rights',
			content: (
				<div>
					<p>
						Under certain circumstances, you have rights under data protection laws in relation to your personal data. You have the right to:
					</p>
					<ul>
						<li><strong>Request access</strong> to your personal data (commonly known as a "data subject access request").</li>
						<li><strong>Request correction</strong> of the personal data that we hold about you.</li>
						<li><strong>Request erasure</strong> of your personal data when there is no good reason for us continuing to process it.</li>
						<li><strong>Object to processing</strong> of your personal data where we are relying on a legitimate interest.</li>
						<li><strong>Request restriction of processing</strong> of your personal data.</li>
						<li><strong>Request the transfer</strong> of your personal data to you or to a third party.</li>
						<li><strong>Withdraw consent at any time</strong> where we are relying on consent to process your personal data.</li>
					</ul>
				</div>
			)
		},
		{
			id: 'security',
			title: 'Security',
			content: (
				<div>
					<p>
						We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
					</p>
					<p>
						They will only process your personal data on our instructions and they are subject to a duty of confidentiality. We have put in place procedures to deal with any suspected personal data breach and will notify you and any applicable regulator of a breach where we are legally required to do so.
					</p>
				</div>
			)
		},
		{
			id: 'contact-us',
			title: 'Contact Us',
			content: (
				<div>
					<p>
						If you have any questions about this privacy policy or our privacy practices, please contact our data privacy manager in the following ways:
					</p>
					<ul>
						<li>Email address: <strong>privacy@trippple.com</strong></li>
						<li>Postal address: Trippple HQ, 123 Innovation Drive, Tech District</li>
						<li>Telephone number: +1 (555) 123-4567</li>
					</ul>
					<p>
						You have the right to make a complaint at any time to your relevant national supervisory authority for data protection issues. We would, however, appreciate the chance to deal with your concerns before you approach the authority so please contact us in the first instance.
					</p>
				</div>
			)
		}
	]

	return (
		<LegalPageLayout 
			title={title}
			description={description}
			lastUpdated={lastUpdated}
			icon={<ShieldCheck className='w-4 h-4 text-zinc-500' />}
			sections={sections}
		/>
	)
}
