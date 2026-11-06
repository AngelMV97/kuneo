/**
 * DASHBOARD PAGE
 * Admin overview and statistics
 */

import React from 'react'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Panel de Administración</h1>
        <p className="page-subtitle">Gestiona el contenido de Kuneo</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <Link to="/modules" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3>📚 Módulos</h3>
          <p>Gestionar módulos de aprendizaje</p>
        </Link>

        <Link to="/upload" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3>📤 Subir Contenido</h3>
          <p>Cargar PDFs y crear embeddings</p>
        </Link>

        <div className="card">
          <h3>📊 Estadísticas</h3>
          <p>Ver métricas de uso</p>
        </div>
      </div>
    </div>
  )
}
