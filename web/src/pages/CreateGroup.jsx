import React, { useState } from 'react'
import { me, createGroup } from '../lib/api'

export default function CreateGroup() {
  const user = me()
  const [course, setCourse] = useState('')
  const [title, setTitle] = useState('')
  const [id, setId] = useState('')
  if (!user) return <p className="text-warning">Login required.</p>
  const onSubmit = (e) => {
    e.preventDefault()
    const gid = createGroup(user.email, { course, title })
    setId(gid)
  }
  return (
    <div className="card cm-card p-4">
      <h1 className="h3 mb-3">Create Group</h1>
      <form onSubmit={onSubmit} className="vstack gap-3">
        <input className="form-control" placeholder="course" value={course} onChange={e=>setCourse(e.target.value)} />
        <input className="form-control" placeholder="title" value={title} onChange={e=>setTitle(e.target.value)} />
        <button className="btn btn-primary">Create</button>
      </form>
      {id && <p className="mt-3">Group created: <span className="badge bg-info text-dark">{id}</span></p>}
    </div>
  )
}
