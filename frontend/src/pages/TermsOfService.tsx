import { ShieldCheck } from 'lucide-react'
import LegalPageLayout, { type LegalSection } from '@/components/layouts/LegalPageLayout'

export default function TermsOfService() {
	const lastUpdated = 'October 15, 2025'
	const title = 'Terms of Service'
	const description = 'These Terms of Service govern your use of the Trippple platform, services, and any related applications. Please read these terms carefully before accessing or using our services, as they contain important information regarding your legal rights.'

	const sections: LegalSection[] = [
		{
			id: 'acceptance-of-terms',
			title: 'Acceptance of Terms',
			content: (
				<div>
					<p>
						By accessing or using the Trippple services, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service. These Terms apply to all visitors, users, and others who access or use the Service.
					</p>
					<p>
						We reserve the right to update or change our Terms at any time and you should check these Terms periodically. Your continued use of the Service after we post any modifications will constitute your acknowledgment of the modifications and your consent to abide and be bound by the modified Terms.
					</p>
				</div>
			)
		},
		{
			id: 'use-of-services',
			title: 'Use of Services',
			content: (
				<div>
					<p>
						Our platform is designed to provide you with intelligent travel planning and community features. When using our services, you agree to:
					</p>
					<ul>
						<li>Provide accurate, current, and complete information during the registration process.</li>
						<li>Maintain the security of your password and accept all risks of unauthorized access to your account.</li>
						<li>Immediately notify us of any security breaches or unauthorized use of your account.</li>
						<li>Take responsibility for all activities that occur under your account.</li>
					</ul>
					<p>
						We reserve the right to withdraw or amend our service, and any service or material we provide via the platform, in our sole discretion without notice. We will not be liable if for any reason all or any part of the platform is unavailable at any time or for any period.
					</p>
				</div>
			)
		},
		{
			id: 'accounts',
			title: 'Accounts',
			content: (
				<div>
					<p>
						When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
					</p>
					<p>
						You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service. You agree not to disclose your password to any third party.
					</p>
				</div>
			)
		},
		{
			id: 'payments',
			title: 'Payments',
			content: (
				<div>
					<p>
						Certain features of the Service may be subject to payments now or in the future (the "Paid Services"). Please note any payment terms presented to you in the process of using or signing up for a Paid Service are deemed part of this Agreement.
					</p>
					<ul>
						<li><strong>Billing</strong>: We use a third-party payment processor to bill you through a payment account linked to your account.</li>
						<li><strong>Payment Method</strong>: The processing of payments will be subject to the terms, conditions, and privacy policies of the Payment Processor in addition to this Agreement.</li>
						<li><strong>Refunds</strong>: Refunds are handled on a case-by-case basis and in accordance with our overarching refund policy available on the platform.</li>
					</ul>
				</div>
			)
		},
		{
			id: 'prohibited-conduct',
			title: 'Prohibited Conduct',
			content: (
				<div>
					<p>
						You agree not to engage in any of the following prohibited activities:
					</p>
					<ul>
						<li>Copying, distributing, or disclosing any part of the Service in any medium, including without limitation by any automated or non-automated "scraping."</li>
						<li>Using any automated system, including without limitation "robots," "spiders," "offline readers," etc., to access the Service.</li>
						<li>Transmitting spam, chain letters, or other unsolicited email.</li>
						<li>Attempting to interfere with, compromise the system integrity or security, or decipher any transmissions to or from the servers running the Service.</li>
						<li>Taking any action that imposes, or may impose at our sole discretion an unreasonable or disproportionately large load on our infrastructure.</li>
					</ul>
				</div>
			)
		},
		{
			id: 'intellectual-property',
			title: 'Intellectual Property',
			content: (
				<div>
					<p>
						The Service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of Trippple and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
					</p>
					<p>
						Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Trippple. Your use of the Service grants you no right or license to reproduce or otherwise use any Trippple or third-party trademarks.
					</p>
				</div>
			)
		},
		{
			id: 'termination',
			title: 'Termination',
			content: (
				<div>
					<p>
						We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
					</p>
					<p>
						Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service or contact support to request account deletion.
					</p>
				</div>
			)
		},
		{
			id: 'disclaimer',
			title: 'Disclaimer',
			content: (
				<div>
					<p>
						Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance.
					</p>
					<p>
						Trippple its subsidiaries, affiliates, and its licensors do not warrant that a) the Service will function uninterrupted, secure, or available at any particular time or location; b) any errors or defects will be corrected; c) the Service is free of viruses or other harmful components; or d) the results of using the Service will meet your requirements.
					</p>
				</div>
			)
		},
		{
			id: 'limitation-of-liability',
			title: 'Limitation of Liability',
			content: (
				<div>
					<p>
						In no event shall Trippple, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
					</p>
					<ul>
						<li>Your access to or use of or inability to access or use the Service.</li>
						<li>Any conduct or content of any third party on the Service.</li>
						<li>Any content obtained from the Service.</li>
						<li>Unauthorized access, use, or alteration of your transmissions or content.</li>
					</ul>
				</div>
			)
		},
		{
			id: 'governing-law',
			title: 'Governing Law',
			content: (
				<div>
					<p>
						These Terms shall be governed and construed in accordance with the laws of applicable jurisdictions, without regard to its conflict of law provisions.
					</p>
					<p>
						Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
					</p>
				</div>
			)
		},
		{
			id: 'contact-information',
			title: 'Contact Information',
			content: (
				<div>
					<p>
						If you have any questions about these Terms, please contact us. We are always eager to assist our users and clarify any points of confusion regarding our service policies.
					</p>
					<ul>
						<li>Email: <strong>legal@trippple.com</strong></li>
						<li>Address: Trippple HQ, 123 Innovation Drive, Tech District</li>
						<li>Phone: +1 (555) 987-6543</li>
					</ul>
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
