import Hero from '@/components/Hero'
import CollaborationSection from '@/components/CollaborationSection'
import PricingSection from '@/components/PricingSection'
import FAQSection from '@/components/FAQSection'

function Home() {
	return (
		<>
			<Hero />
			<div className='relative z-10'>
				<CollaborationSection />
				<PricingSection />
				<FAQSection />
			</div>
		</>
	)
}

export default Home
