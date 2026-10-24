import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import AuthLayout, { ErrorAlert, Field, primaryButton } from '../components/AuthLayout.jsx'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await register({ username: form.username.trim(), email: form.email.trim(), password: form.password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Customers can browse and buy vehicles"
      footer={<>Already registered? <Link to="/login" className="font-medium text-brand-700 hover:underline">Sign in</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <ErrorAlert message={error} />
        <Field label="Username" id="username" name="username" autoComplete="username" required value={form.username} onChange={update} />
        <Field label="Email" id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={update} />
        <Field label="Password" id="password" name="password" type="password" autoComplete="new-password" required value={form.password} onChange={update} />
        <Field label="Confirm password" id="confirm" name="confirm" type="password" autoComplete="new-password" required value={form.confirm} onChange={update} />
        <button type="submit" disabled={busy} className={primaryButton}>{busy ? 'Creating…' : 'Create account'}</button>
      </form>
    </AuthLayout>
  )
}
