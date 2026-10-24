import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import AuthLayout, { ErrorAlert, Field, primaryButton } from '../components/AuthLayout.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.username.trim() || !form.password) {
      setError('Enter your username and password.')
      return
    }
    setBusy(true)
    try {
      await login(form.username.trim(), form.password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Manage and browse the dealership inventory"
      footer={<>New here? <Link to="/register" className="font-medium text-brand-700 hover:underline">Create an account</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <ErrorAlert message={error} />
        <Field label="Username" id="username" name="username" autoComplete="username" value={form.username} onChange={update} />
        <Field label="Password" id="password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={update} />
        <button type="submit" disabled={busy} className={primaryButton}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </AuthLayout>
  )
}
