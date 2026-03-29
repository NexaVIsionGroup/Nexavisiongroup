'use client'
import { useState, useEffect } from 'react'

interface Agreement {
  id: string
  title: string
  status: string
  created_at: string
  [key: string]: any
}

export default function SigningAdmin() {
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [copied, setCopied] = useState('')
  const [form, setForm] = useState({
    title: 'Settlement and Payment Agreement',
    signer1Name: '', signer1Role: 'Client',
    signer2Name: '', signer2Role: 'Client',
    signer3Name: '', signer3Role: 'Respondent',
    signer4Name: '', signer4Role: 'Counsel',
  })

  const fetchAgreements = async () => {
    try {
      const res = await fetch('/api/sign/admin')
      if (res.ok) {
        const data = await res.json()
        setAgreements(data.agreements || [])
      }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchAgreements() }, [])

  const createAgreement = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/sign/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        setShowForm(false)
        fetchAgreements()
        setForm({ title: 'Settlement and Payment Agreement', signer1Name: '', signer1Role: 'Client', signer2Name: '', signer2Role: 'Client', signer3Name: '', signer3Role: 'Respondent', signer4Name: '', signer4Role: 'Counsel' })
      }
    } catch {} finally { setCreating(false) }
  }

  const copyLink = (id: string) => {
    const url = `https://nexavisiongroup.com/sign/${id}`
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(''), 2000)
  }

  const deleteAgreement = async (id: string) => {
    if (!confirm('Delete this agreement? This cannot be undone.')) return
    await fetch(`/api/sign/admin?id=${id}`, { method: 'DELETE' })
    fetchAgreements()
  }

  const statusColor = (s: string) => {
    if (s === 'completed') return 'bg-green-100 text-green-800'
    if (s === 'partially_signed') return 'bg-amber-100 text-amber-800'
    if (s === 'voided') return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-600'
  }

  const signedCount = (a: Agreement) => {
    let count = 0
    for (let i = 1; i <= 4; i++) if (a[`signer_${i}_signature`]) count++
    return count
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Document Signing</h1>
          <p className="text-sm text-gray-400">Manage signing agreements and track status</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          {showForm ? 'Cancel' : '+ New Agreement'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Signing Agreement</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Agreement Title</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                className="w-full bg-gray-900 border border-gray-600 text-white rounded px-3 py-2 text-sm" />
            </div>
            {[1,2,3,4].map(n => (
              <div key={n} className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">Signer {n} Name</label>
                  <input value={(form as any)[`signer${n}Name`]}
                    onChange={e => setForm({...form, [`signer${n}Name`]: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                    placeholder={n <= 2 ? 'Client name' : n === 3 ? 'Respondent name' : 'Attorney name'} />
                </div>
                <div className="w-32">
                  <label className="block text-xs text-gray-400 mb-1">Role</label>
                  <input value={(form as any)[`signer${n}Role`]}
                    onChange={e => setForm({...form, [`signer${n}Role`]: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-600 text-white rounded px-3 py-2 text-sm" />
                </div>
              </div>
            ))}
          </div>
          <button onClick={createAgreement} disabled={creating || !form.signer1Name}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium">
            {creating ? 'Creating...' : 'Create & Generate Link'}
          </button>
        </div>
      )}

      {/* Agreements List */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading...</div>
      ) : agreements.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p className="text-lg mb-2">No agreements yet</p>
          <p className="text-sm">Click &quot;+ New Agreement&quot; to create one</p>
        </div>
      ) : (
        <div className="space-y-4">
          {agreements.map(a => (
            <div key={a.id} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
              {/* Agreement header */}
              <div className="px-5 py-4 flex items-center justify-between border-b border-gray-700">
                <div>
                  <h3 className="font-semibold text-white">{a.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Created: {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${statusColor(a.status)}`}>
                    {a.status === 'completed' ? '✓ COMPLETE' : a.status === 'partially_signed' ? `${signedCount(a)}/4 SIGNED` : a.status.toUpperCase()}
                  </span>
                  <button onClick={() => copyLink(a.id)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition">
                    {copied === a.id ? '✓ Copied!' : 'Copy Link'}
                  </button>
                  <a href={`/sign/${a.id}`} target="_blank" rel="noopener"
                    className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs font-medium transition">
                    Open
                  </a>
                  <button onClick={() => deleteAgreement(a.id)}
                    className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded text-xs font-medium transition">
                    Delete
                  </button>
                </div>
              </div>

              {/* Signer status grid */}
              <div className="px-5 py-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1,2,3,4].map(n => {
                  const signed = !!a[`signer_${n}_signature`]
                  const name = a[`signer_${n}_name`]
                  const role = a[`signer_${n}_role`]
                  const at = a[`signer_${n}_signed_at`]
                  return (
                    <div key={n} className={`rounded-md p-3 ${signed ? 'bg-green-900/30 border border-green-700' : 'bg-gray-900/50 border border-gray-700'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-white truncate">{name}</p>
                        {signed ? (
                          <span className="text-green-400 text-xs font-bold">✓</span>
                        ) : (
                          <span className="text-gray-500 text-xs">—</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{role}</p>
                      {signed && at && (
                        <p className="text-xs text-green-500 mt-1">
                          {new Date(at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Signing link */}
              <div className="px-5 py-3 bg-gray-900/50 border-t border-gray-700">
                <p className="text-xs text-gray-500 mb-1">Signing Link:</p>
                <code className="text-xs text-blue-400 break-all select-all">
                  https://nexavisiongroup.com/sign/{a.id}
                </code>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
