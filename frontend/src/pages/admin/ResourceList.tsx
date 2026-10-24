import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useEffect, useMemo, useState } from 'react'

type Props = {
  title: string
  endpoint: string
}

export default function AdminResourceList({ title, endpoint }: Props) {
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<unknown>(null)

  const canFetch = useMemo(() => Boolean(token), [token])

  async function load() {
    if (!canFetch) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(endpoint)
      setData(res.data)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, canFetch])

  return (
    <div className='space-y-4'>
      <header className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>{title}</h1>
          <p className='text-sm text-gray-600'>Endpoint: {endpoint}</p>
        </div>
        <button
          onClick={load}
          disabled={!canFetch || loading}
          className='px-4 h-10 rounded-lg bg-primary text-white disabled:opacity-60'>
          {loading ? 'Chargement...' : 'Rafraîchir'}
        </button>
      </header>

      {!token && (
        <div className='p-4 rounded-lg bg-muted'>
          <p className='text-sm text-gray-700'>Connecte-toi pour accéder aux données admin.</p>
        </div>
      )}

      {error && (
        <div className='p-4 rounded-lg bg-red-50 border border-red-200'>
          <p className='text-sm text-red-700'>{error}</p>
        </div>
      )}

      <section className='p-4 rounded-lg border border-gray-200'>
        <pre className='text-xs overflow-auto max-h-[60vh]'>{JSON.stringify(data, null, 2)}</pre>
      </section>
    </div>
  )
}

