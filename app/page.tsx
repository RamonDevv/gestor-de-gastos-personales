'use client'

import { FormEvent, useMemo, useState, useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTransactions } from "./context/transactions-context";

/*
  - Formulario para añadir transacciones (concepto, monto, tipo, categoría). ✅
  - Listado filtrable por tipo/categoría.✅
  - Balance total, ingresos vs gastos.✅
  - Gráfico de pastel por categorías y gráfico de evolución mensual.✅
  - Persistencia en localStorage.✅
*/

export default function Home() {
  type FormDraft = {
    concepto?: string
    monto?: string
    tipo?: string
    categoria?: string
  }

  //Listas
  const ListaOriginalTipos = ['Ingreso', 'Gasto']
  const ListaOriginalCategoria = ['hogar', 'comida', 'transporte','tecnologia','entretenimiento', 'salud']
  const chartColors = ['#0f766e', '#1d4ed8', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2']
  const currencyFormatter = new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
  })
  const dateFormatter = new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const {
    transacciones,
    addTransaccion,
    totalIngresos,
    totalGastos,
    balanceTotal,
    gastosPorCategoria,
    evolucionMensual,
  } = useTransactions()

  const readLocalStorage = <T,>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') {
      return fallback
    }

    const raw = localStorage.getItem(key)
    if (!raw) {
      return fallback
    }

    try {
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  }

  const formatLabel = (value: string) => {
    return value.charAt(0).toUpperCase() + value.slice(1)
  }

  const emptyStoredForm = {
    concepto: '',
    monto: '',
    tipo: '',
    categoria: '',
  }

  const emptyStoredFormSnapshot = JSON.stringify(emptyStoredForm)

  const subscribeToStoredForm = (callback: () => void) => {
    if (typeof window === 'undefined') {
      return () => undefined
    }

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || ['concepto', 'monto', 'tipo', 'categoria'].includes(event.key)) {
        callback()
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }

  const storedFormSnapshot = useSyncExternalStore(
    subscribeToStoredForm,
    () => JSON.stringify({
      concepto: readLocalStorage('concepto', ''),
      monto: readLocalStorage('monto', ''),
      tipo: readLocalStorage('tipo', ''),
      categoria: readLocalStorage('categoria', ''),
    }),
    () => emptyStoredFormSnapshot,
  )

  const storedForm = useMemo(() => {
    return JSON.parse(storedFormSnapshot) as typeof emptyStoredForm
  }, [storedFormSnapshot])

  const [draftForm, setDraftForm] = useState<FormDraft>({})

  const concepto = draftForm.concepto ?? storedForm.concepto
  const monto = draftForm.monto ?? storedForm.monto
  const tipo = draftForm.tipo ?? storedForm.tipo
  const categoria = draftForm.categoria ?? storedForm.categoria

  const updateStoredField = (field: keyof typeof emptyStoredForm, value: string) => {
    setDraftForm((prev) => ({ ...prev, [field]: value }))
    localStorage.setItem(field, JSON.stringify(value))
  }

  const [historyTipo, setHistoryTipo] = useState('')
  const [historyCategoria, setHistoryCategoria] = useState('')

  const transaccionesFiltradas = useMemo(() => {
    return transacciones.filter((item) => {
      const matchTipo = historyTipo ? item.tipo === historyTipo : true
      const matchCategoria = historyCategoria ? item.categoria === historyCategoria : true
      return matchTipo && matchCategoria
    })
  }, [transacciones, historyTipo, historyCategoria])

  const transaccionesRecientes = useMemo(() => {
    return transaccionesFiltradas.slice(0, 3)
  }, [transaccionesFiltradas])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const montoNumero = Number(monto)
    if (!concepto.trim() || Number.isNaN(montoNumero) || montoNumero <= 0 || !tipo || !categoria) {
      return
    }

    addTransaccion({
      concepto: concepto.trim(),
      monto: montoNumero,
      tipo,
      categoria,
    })
    setDraftForm({
      concepto: '',
      monto: '',
      tipo: '',
      categoria: '',
    })
    localStorage.setItem('concepto', JSON.stringify(''))
    localStorage.setItem('monto', JSON.stringify(''))
    localStorage.setItem('tipo', JSON.stringify(''))
    localStorage.setItem('categoria', JSON.stringify(''))
  }




  return (
    <main className="form-page">
      <section className="transaction-card" aria-labelledby="transaction-title">
        <h1 id="transaction-title">Nueva transaccion</h1>
        <p>Registra un ingreso o gasto con su categoria.</p>

        <form className="transaction-form" onSubmit={handleSubmit}>
          <label htmlFor="concepto">Concepto</label>
          <input
            type="text"
            id="concepto"
            name="concepto"
            placeholder="Ej: Supermercado"
            value={concepto}
            onChange={(e) => updateStoredField('concepto', e.target.value)}
            required
          />
          

          <label htmlFor="monto">Monto</label>
          <input
            type="number"
            id="monto"
            name="monto"
            placeholder="Ej: 25000"
            min="0"
            step="0.01"
            value={monto}
            onChange={(e) => updateStoredField('monto', e.target.value)}
            required
          />

          <label htmlFor="tipo">Tipo</label>
          <select id="tipo" name="tipo" value={tipo} onChange={(e) => updateStoredField('tipo', e.target.value)} required>
            <option value="" disabled>
              Selecciona un tipo
            </option>
            <option value="ingreso">Ingreso</option>
            <option value="gasto">Gasto</option>
          </select>

          <label htmlFor="categoria">Categoria</label>
          <select id="categoria" name="categoria" value={categoria} onChange={(e) => updateStoredField('categoria', e.target.value)} required>
            <option value="" disabled>
              Selecciona una categoria
            </option>
            <option value="hogar">Hogar</option>
            <option value="comida">Comida</option>
            <option value="transporte">Transporte</option>
            <option value="tecnologia">Tecnologia</option>
            <option value="entretenimiento">Entretenimiento</option>
            <option value="salud">Salud</option>
          </select>

          <button type="submit">Agregar transaccion</button>
        </form>
      </section>
      <section className="transaction-card history-transactions" aria-label="Historial de transacciones">
        <h1> Transacciones recientes </h1>
        <div className="history-filters transaction-form">
          <div className="history-filter-group">
            <label htmlFor="history-tipo">Tipo</label>
            <select id="history-tipo" name="history-tipo" value={historyTipo} onChange={(e) => setHistoryTipo(e.target.value)}>
              <option value="">
                Todos
              </option>
              {ListaOriginalTipos.map((item) => (
                <option key={item} value={item.toLowerCase()}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="history-filter-group">
            <label htmlFor="history-categoria">Categoria</label>
            <select id="history-categoria" name="history-categoria" value={historyCategoria} onChange={(e) => setHistoryCategoria(e.target.value)}>
              <option value="">
                Todas
              </option>
              {ListaOriginalCategoria.map((item) => (
                <option key={item} value={item}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="history-list-wrapper">
          {transaccionesRecientes.length === 0 ? (
            <p>No hay transacciones registradas.</p>
          ) : (
            <>
              <div className="history-summary">
                <span>Mostrando {transaccionesRecientes.length} de {transaccionesFiltradas.length} movimientos</span>
              </div>

              <ul className="history-list">
              {transaccionesRecientes.map((item) => (
                <li key={item.id} className="history-item">
                  <div className="history-item-top">
                    <div className="history-item-copy">
                      <strong className="history-item-title">{item.concepto}</strong>
                      <span className="history-item-date">{dateFormatter.format(new Date(item.fecha))}</span>
                    </div>
                    <span className={item.tipo === 'ingreso' ? 'badge badge-income' : 'badge badge-expense'}>
                      {formatLabel(item.tipo)}
                    </span>
                  </div>
                  <div className="history-item-bottom">
                    <span className="history-category-chip">{formatLabel(item.categoria)}</span>
                    <span className={item.tipo === 'ingreso' ? 'history-amount history-amount-income' : 'history-amount history-amount-expense'}>
                      {item.tipo === 'ingreso' ? '+' : '-'} {currencyFormatter.format(item.monto)}
                    </span>
                  </div>
                </li>
              ))}
              </ul>
            </>
          )}
        </div>
      </section>

      <section className="transaction-card balance-card" aria-label="Balance total">
        <h1>Balance total</h1>
        <div className="balance-content">
          <p className={balanceTotal >= 0 ? 'balance-amount balance-positive' : 'balance-amount balance-negative'}>
            {currencyFormatter.format(balanceTotal)}
          </p>
          <div className="balance-right" aria-label="Resumen de ingresos y gastos">
            <div className="balance-row">
              <p>Ingresos</p>
              <span className="income-amount">+ {currencyFormatter.format(totalIngresos)}</span>
            </div>
            <div className="balance-row">
              <p>Gastos</p>
              <span className="expense-amount">- {currencyFormatter.format(totalGastos)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="transaction-card chart-card" aria-label="Gastos por categoría">
        <div className="chart-card-header">
          <div>
            <h1>Gastos por categoria</h1>
            <p>Distribucion de tus gastos acumulados por categoria.</p>
          </div>
        </div>

        {gastosPorCategoria.length === 0 ? (
          <div className="chart-empty-state">
            <p>Agrega al menos un gasto para ver el grafico de pastel.</p>
          </div>
        ) : (
          <div className="chart-shell">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gastosPorCategoria}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                >
                  {gastosPorCategoria.map((item, index) => (
                    <Cell key={item.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [currencyFormatter.format(Number(value ?? 0)), formatLabel(String(name ?? ''))]}
                />
                <Legend formatter={(value) => formatLabel(String(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="transaction-card chart-card chart-card-wide" aria-label="Evolución mensual">
        <div className="chart-card-header">
          <div>
            <h1>Evolucion mensual</h1>
            <p>Comparacion mensual entre ingresos y gastos.</p>
          </div>
        </div>

        {evolucionMensual.length === 0 ? (
          <div className="chart-empty-state">
            <p>Agrega transacciones para visualizar la evolucion mensual.</p>
          </div>
        ) : (
          <div className="chart-shell chart-shell-wide">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evolucionMensual}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8d2c5" vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} />
                <YAxis
                  tickFormatter={(value) => currencyFormatter.format(Number(value)).replace('.00', '')}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip
                  formatter={(value, name) => [currencyFormatter.format(Number(value ?? 0)), formatLabel(String(name ?? ''))]}
                />
                <Legend formatter={(value) => formatLabel(String(value))} />
                <Bar dataKey="ingresos" fill="#16a34a" radius={[8, 8, 0, 0]} />
                <Bar dataKey="gastos" fill="#dc2626" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    
    </main>

  );
}
