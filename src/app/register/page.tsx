'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // If email confirmation is required, identities will be empty
    if (data.user && data.user.identities?.length === 0) {
      setError('An account with this email already exists.')
      setLoading(false)
      return
    }

    if (data.session) {
      router.push('/')
      router.refresh()
    } else {
      setSuccess('Check your email for a confirmation link.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111] px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-[#d4d4d8] mb-8 text-center">
          Create account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm text-[#71717a] mb-1.5">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
              className="w-full px-3 py-2 bg-[#19191d] border border-[#2c2c30] rounded-md text-[#d4d4d8] text-sm placeholder-[#71717a] outline-none focus:border-[#3b82f6] transition-colors"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-[#71717a] mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-3 py-2 bg-[#19191d] border border-[#2c2c30] rounded-md text-[#d4d4d8] text-sm placeholder-[#71717a] outline-none focus:border-[#3b82f6] transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-[#71717a] mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-3 py-2 bg-[#19191d] border border-[#2c2c30] rounded-md text-[#d4d4d8] text-sm placeholder-[#71717a] outline-none focus:border-[#3b82f6] transition-colors"
              placeholder="Min 6 characters"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          {success && (
            <p className="text-sm text-green-400">{success}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-md hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#71717a]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#3b82f6] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
