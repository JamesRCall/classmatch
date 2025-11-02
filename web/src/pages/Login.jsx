import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../lib/api'

export default function Login() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const onSubmit = (e) => {
    e.preventDefault()
    try { login({ email, password }); nav('/dashboard') }
    catch (e) { setErr(e.message) }
  }
  return (
    <div className="card cm-card p-4">
      <h1 className="h3 mb-3">Login</h1>
      <form onSubmit={onSubmit} className="vstack gap-3">
        <input className="form-control" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="form-control" placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="btn btn-primary">Sign In</button>
      </form>
      {err && <p className="text-danger mt-3">{err}</p>}
      <p className="mt-3">No account? <Link to="/signup">Sign up</Link></p>
    </div>
  )
}
