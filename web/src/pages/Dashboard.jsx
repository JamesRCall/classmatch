import React, { useEffect, useState } from 'react'
import { me, myGroups } from '../lib/api'

export default function Dashboard() {
  const user = me()
  const [groups, setGroups] = useState([])
  useEffect(() => { if (user) setGroups(myGroups(user.email)) }, [])
  if (!user) return <p className="text-warning">Login required.</p>
  return (
    <div className="card cm-card p-4">
      <h1 className="h3 mb-3">Dashboard</h1>
      {groups.length === 0 ? <p>No groups yet.</p> :
        <div className="row row-cols-1 row-cols-md-2 g-3">
          {groups.map(g => (
            <div className="col" key={g.id}>
              <div className="card cm-card border-secondary h-100">
                <div className="card-body">
                  <h5 className="card-title">{g.title}</h5>
                  <p className="card-text text-secondary">Course: {g.course}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  )
}
