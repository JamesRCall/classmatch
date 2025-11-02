import React from 'react'
import { Routes, Route } from 'react-router-dom'
import RoutesFile from './routes'
import Nav from './components/Nav'

export default function App() {
  return (
    <>
      <Nav />
      <main className="cm-container">
        <Routes>
          {RoutesFile.map(r => <Route key={r.path} path={r.path} element={<r.element />} />)}
        </Routes>
      </main>
    </>
  )
}
