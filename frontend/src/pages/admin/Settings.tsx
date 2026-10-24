import { Bell, CreditCard, Lock, Mail, Palette, Shield } from 'lucide-react'

const settingsSections = [
  {
    title: 'Account',
    description: 'Update your admin profile, role visibility, and contact details.',
    icon: Mail,
  },
  {
    title: 'Security',
    description: 'Manage passwords, 2FA, and access logs.',
    icon: Lock,
  },
  {
    title: 'Permissions',
    description: 'Control admin roles and approval policies.',
    icon: Shield,
  },
  {
    title: 'Notifications',
    description: 'Choose which alerts you receive.',
    icon: Bell,
  },
  {
    title: 'Billing',
    description: 'View invoices and payment preferences.',
    icon: CreditCard,
  },
  {
    title: 'Theme',
    description: 'Tune colors and layout density.',
    icon: Palette,
  },
]

export default function AdminSettings() {
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-semibold text-zinc-900'>Settings</h2>
        <p className='text-sm text-zinc-500'>Configure your admin workspace</p>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        {settingsSections.map((section) => (
          <div key={section.title} className='rounded-[22px] border border-zinc-200 bg-white p-5 shadow-sm'>
            <div className='flex items-start gap-4'>
              <div className='rounded-xl bg-orange-500/15 p-3 text-orange-500'>
                <section.icon className='h-5 w-5' />
              </div>
              <div>
                <div className='text-base font-semibold text-zinc-900'>{section.title}</div>
                <p className='mt-1 text-sm text-zinc-500'>{section.description}</p>
                <button className='mt-4 rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600'>
                  Open settings
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
