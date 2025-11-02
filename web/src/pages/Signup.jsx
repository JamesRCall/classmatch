import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signup } from '../lib/api'

export default function Signup() {
  const nav = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', name: '', prefs: '' })
  const [err, setErr] = useState('')
  const onSubmit = (e) => {
    e.preventDefault()
    try { signup(form); nav('/') } catch (e) { setErr(e.message) }
  }
  return (
    <div className="card cm-card p-4">
      <h1 className="h3 mb-3">Signup</h1>
      <form onSubmit={onSubmit} className="vstack gap-3">
        <input className="form-control" placeholder="name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
        <input className="form-control" placeholder="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
        <input className="form-control" placeholder="password" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
        <input className="form-control" placeholder="study preferences" value={form.prefs} onChange={e=>setForm({...form, prefs:e.target.value})} />
        <button className="btn btn-success">Create Account</button>
      </form>
      {err && <p className="text-danger mt-3">{err}</p>}
    </div>
  )
}
