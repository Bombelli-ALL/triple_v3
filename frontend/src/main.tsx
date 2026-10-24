import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.tsx'
import { Toaster } from 'react-hot-toast'
import '@/lib/i18n.ts'

createRoot(document.getElementById('root')!).render(
	<>
		<Toaster position='top-right' reverseOrder={false} />
		<App />
	</>,
)
