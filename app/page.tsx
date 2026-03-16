'use client'

import { useEffect, useState } from "react";

/*
  - Formulario para añadir transacciones (concepto, monto, tipo, categoría). ✅
  - Listado filtrable por tipo/categoría.✅
  - Balance total, ingresos vs gastos.
  - Gráfico de pastel por categorías y gráfico de evolución mensual.
  - Persistencia en localStorage.
*/

export default function Home() {
  //Listas
  const ListaOriginalTipos = ['Ingreso', 'Gasto']
  const ListaOriginalCategoria = ['hogar', 'comida', 'transporte','tecnologia','entretenimiento', 'salud']

  //localStorage concepto
  const [concepto, setConcepto] = useState(() => {
    const StoredConcepto = localStorage.getItem('concepto');
    return StoredConcepto ? JSON.parse(StoredConcepto) : ''
  })

  useEffect(() => {
    localStorage.setItem('Concepto', JSON.stringify(concepto))
  }, [concepto]);

    const [monto, setmonto] = useState(() => {
    const StoredMonto = localStorage.getItem('Monto');
    return StoredMonto ? JSON.parse(StoredMonto) : ''
  })
  


  return (
    <main className="form-page">
      <section className="transaction-card" aria-labelledby="transaction-title">
        <h1 id="transaction-title">Nueva transaccion</h1>
        <p>Registra un ingreso o gasto con su categoria.</p>

        <form className="transaction-form">
          <label htmlFor="concepto">Concepto</label>
          <input
            type="text"
            id="concepto"
            name="concepto"
            placeholder="Ej: Supermercado"
            onChange={(e) => setConcepto(e.target.value)}
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
            required
          />

          <label htmlFor="tipo">Tipo</label>
          <select id="tipo" name="tipo" defaultValue="" required>
            <option value="" disabled>
              Selecciona un tipo
            </option>
            <option value="ingreso">Ingreso</option>
            <option value="gasto">Gasto</option>
          </select>

          <label htmlFor="categoria">Categoria</label>
          <select id="categoria" name="categoria" defaultValue="" required>
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
            <select id="history-tipo" name="history-tipo" defaultValue="">
              <option value="" disabled>
                Selecciona un tipo
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
            <select id="history-categoria" name="history-categoria" defaultValue="">
              <option value="" disabled>
                Selecciona una categoria
              </option>
              {ListaOriginalCategoria.map((item) => (
                <option key={item} value={item}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="transaction-card balance-card" aria-label="Balance total">
        <h1>Balance total</h1>
        <div className="balance-content">
          <p className="balance-amount">$0.00</p>
          <div className="balance-right" aria-label="Resumen de ingresos y gastos">
            <div className="balance-row">
              <p>Ingresos</p>
              <span className="income-amount">+$0.00</span>
            </div>
            <div className="balance-row">
              <p>Gastos</p>
              <span className="expense-amount">-$0.00</span>
            </div>
          </div>
        </div>
      </section>
    
    </main>

  );
}
