/**
 * MODULES PAGE
 * Manage learning modules
 */

import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function ModulesPage() {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchModules()
  }, [])

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('kuneo.modules')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error) {
        setModules(data || [])
      }
    } catch (error) {
      console.error('Error fetching modules:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Módulos</h1>
        <p className="page-subtitle">Gestiona los módulos de aprendizaje</p>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : modules.length === 0 ? (
        <div className="card">
          <p>No hay módulos creados aún.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {modules.map((module) => (
            <div key={module.id} className="card">
              <h3>{module.title}</h3>
              <p>{module.description}</p>
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#718096' }}>
                <span>Grado {module.grade_level}</span> · <span>{module.subject}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
