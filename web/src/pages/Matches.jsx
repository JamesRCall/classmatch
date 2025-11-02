import React, { useEffect, useState } from 'react'
import { me, matches } from '../lib/api'

export default function Matches() {
  const user = me()
  const [list, setList] = useState([])
  useEffect(() => { if (user) setList(matches(user.email)) }, [])
  if (!user) return <p className="text-warning">Login required.</p>
  return (
    <div className="card cm-card p-4">
      <h1 className="h3 mb-3">Matches</h1>
      <ul className="list-group list-group-flush">
        {list.map(u => <li className="list-group-item bg-transparent text-light border-secondary" key={u.email}>{u.name || u.email}</li>)}
      </ul>
    </div>
  )
}
