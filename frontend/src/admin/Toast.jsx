import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  const show = useCallback((type, message) => {
    clearTimeout(timer.current)
    setToast({ type, message, id: Date.now() })
    timer.current = setTimeout(() => setToast(null), type === 'error' ? 4500 : 3000)
  }, [])

  const api = useRef({ success: (m) => show('success', m), error: (m) => show('error', m) }).current

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast && (
        <div key={toast.id} className={'toast ' + toast.type} role="status" onClick={() => setToast(null)}>
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  )
}
