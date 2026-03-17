'use client'

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Transaccion = {
  id: string
  concepto: string
  monto: number
  tipo: string
  categoria: string
  fecha: string
}

type NuevaTransaccion = {
  concepto: string
  monto: number
  tipo: string
  categoria: string
}

type CategoriaChartDatum = {
  name: string
  value: number
}

type EvolucionMensualDatum = {
  mes: string
  ingresos: number
  gastos: number
}

type TransactionsContextValue = {
  transacciones: Transaccion[]
  addTransaccion: (input: NuevaTransaccion) => void
  totalIngresos: number
  totalGastos: number
  balanceTotal: number
  gastosPorCategoria: CategoriaChartDatum[]
  evolucionMensual: EvolucionMensualDatum[]
}

const TransactionsContext = createContext<TransactionsContextValue | undefined>(undefined)

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

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([])
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    setTransacciones(readLocalStorage<Transaccion[]>('transacciones', []))
    setHasHydrated(true)
  }, [])

  useEffect(() => {
    if (!hasHydrated) {
      return
    }

    localStorage.setItem('transacciones', JSON.stringify(transacciones))
  }, [hasHydrated, transacciones])

  const addTransaccion = (input: NuevaTransaccion) => {
    const nuevaTransaccion: Transaccion = {
      id: crypto.randomUUID(),
      concepto: input.concepto.trim(),
      monto: input.monto,
      tipo: input.tipo,
      categoria: input.categoria,
      fecha: new Date().toISOString(),
    }

    setTransacciones((prev) => [nuevaTransaccion, ...prev])
  }

  const { totalIngresos, totalGastos, balanceTotal } = useMemo(() => {
    const totalIngresosCalculado = transacciones
      .filter((item) => item.tipo === 'ingreso')
      .reduce((acc, item) => acc + item.monto, 0)

    const totalGastosCalculado = transacciones
      .filter((item) => item.tipo === 'gasto')
      .reduce((acc, item) => acc + item.monto, 0)

    return {
      totalIngresos: totalIngresosCalculado,
      totalGastos: totalGastosCalculado,
      balanceTotal: totalIngresosCalculado - totalGastosCalculado,
    }
  }, [transacciones])

  const gastosPorCategoria = useMemo(() => {
    const totals = transacciones
      .filter((item) => item.tipo === 'gasto')
      .reduce<Record<string, number>>((acc, item) => {
        acc[item.categoria] = (acc[item.categoria] ?? 0) + item.monto
        return acc
      }, {})

    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [transacciones])

  const evolucionMensual = useMemo(() => {
    const monthlyTotals = transacciones.reduce<Record<string, EvolucionMensualDatum>>((acc, item) => {
      const fecha = new Date(item.fecha)
      const key = `${fecha.getFullYear()}-${fecha.getMonth()}`

      if (!acc[key]) {
        acc[key] = {
          mes: fecha.toLocaleDateString('es-DO', {
            month: 'short',
            year: '2-digit',
          }),
          ingresos: 0,
          gastos: 0,
        }
      }

      if (item.tipo === 'ingreso') {
        acc[key].ingresos += item.monto
      } else {
        acc[key].gastos += item.monto
      }

      return acc
    }, {})

    return Object.entries(monthlyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value)
  }, [transacciones])

  const value = useMemo(() => {
    return {
      transacciones,
      addTransaccion,
      totalIngresos,
      totalGastos,
      balanceTotal,
      gastosPorCategoria,
      evolucionMensual,
    }
  }, [transacciones, totalIngresos, totalGastos, balanceTotal, gastosPorCategoria, evolucionMensual])

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>
}

export function useTransactions() {
  const context = useContext(TransactionsContext)

  if (!context) {
    throw new Error('useTransactions debe usarse dentro de TransactionsProvider')
  }

  return context
}