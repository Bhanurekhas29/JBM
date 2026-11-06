import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '../api.js'
import { Icon } from '../icons.jsx'
import { useToast } from '../Toast.jsx'

const empty = { id: 0, username: '', full_name: '', email: '', password: '', is_active: true }

function fmt(d) {
  if (!d) return 'Never'
  const dt = new Date(String(d).replace(' ', 'T'))
  return isNaN(dt) ? d : dt.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

function UserModal({ initial, onClose, onSaved }) {
  const toast = useToast()
  const editing = !!initial.id
  const [f, setF] = useState({ ...initial, password: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setError(''); setErrors({})
    try {
      await (editing ? adminApi.users.update(f) : adminApi.users.create(f))
      onSaved(editing ? 'User updated' : 'User created')
    } catch (err) {
      setError(err.message); setErrors(err.errors || {}); toast.error(err.message)
    } finally { setBusy(false) }
  }

  const Field = ({ k, label, type = 'text', hint, ...rest }) => (
    <div className={'fld' + (errors[k] ? ' bad' : '')}>
      <label htmlFor={k}>{label}</label>
      <input id={k} type={type} value={f[k]} onChange={set(k)} {...rest} />
      {errors[k] ? <div className="msg">{errors[k]}</div> : hint && <div className="hint">{hint}</div>}
    </div>
  )

  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <h3>{editing ? 'Edit user' : 'Add user'}</h3>
        <form onSubmit={submit} noValidate>
          {error && !Object.keys(errors).length && <div className="alert-err">{error}</div>}
          {Field({ k: 'username', label: 'Username', autoFocus: true, autoComplete: 'off', disabled: initial.is_superuser })}
          {Field({ k: 'full_name', label: 'Full name' })}
          {Field({ k: 'email', label: 'Email', type: 'email' })}
          {Field({ k: 'password', label: editing ? 'New password' : 'Password', type: 'password', autoComplete: 'new-password',
            hint: editing ? 'Leave blank to keep the current password.' : 'Minimum 8 characters.' })}
          <label className="chk"><input type="checkbox" checked={f.is_active} onChange={set('is_active')} disabled={initial.is_me || initial.is_superuser} /> Active (can sign in)</label>
          <div className="modal-foot">
            <button type="button" className="adm-btn sm ghost" onClick={onClose}>Cancel</button>
            <button className="adm-btn sm" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const toast = useToast()

  const load = useCallback(() => adminApi.users.list().then((r) => setUsers(r.users)).finally(() => setLoading(false)), [])
  useEffect(() => { load() }, [load])

  async function toggle(u) {
    try { await adminApi.users.toggle(u.id); toast.success(u.is_active ? 'User deactivated' : 'User activated'); load() } catch (e) { toast.error(e.message) }
  }

  async function remove(u) {
    if (!window.confirm(`Delete user "${u.username}"? This cannot be undone.`)) return
    try { await adminApi.users.remove(u.id); toast.success('User deleted'); load() } catch (e) { toast.error(e.message) }
  }

  return (
    <>
      <div className="page-head">
        <h1>Users</h1>
      </div>

      <section className="card">
        <div className="card-head row">
          <h3>All users ({users.length})</h3>
          <button className="adm-btn sm" onClick={() => setModal({ ...empty })}><Icon.plus width={16} height={16} /> Add user</button>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>User</th><th>Email</th><th>Status</th><th>Last login</th><th /></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="5" className="muted">Loading...</td></tr>}
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="u-cell">
                      <span className="avatar sm">{u.username[0].toUpperCase()}</span>
                      <div><strong>{u.username}</strong>{u.is_me && <span className="badge you">You</span>}{u.is_superuser && <span className="badge main">Main admin</span>}
                        {u.full_name && <div className="muted">{u.full_name}</div>}</div>
                    </div>
                  </td>
                  <td className="muted">{u.email || '-'}</td>
                  <td><span className={'badge ' + (u.is_active ? 'on' : 'off')}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td className="muted">{fmt(u.last_login)}</td>
                  <td className="actions">
                    <button className={'row-btn tgl ' + (u.is_active ? 'off' : 'on')} disabled={u.is_me || u.is_superuser} onClick={() => toggle(u)}
                      title={u.is_superuser ? 'The main admin cannot be deactivated' : u.is_me ? "You can't deactivate yourself" : u.is_active ? 'Deactivate' : 'Activate'}>
                      {u.is_active ? <><Icon.ban width={15} height={15} /> Deactivate</> : <><Icon.check width={15} height={15} /> Activate</>}
                    </button>
                    <button className="row-btn" title="Edit" onClick={() => setModal({ ...u })}><Icon.edit /></button>
                    <button className="row-btn danger" title={u.is_superuser ? 'The main admin cannot be deleted' : u.is_me ? "You can't delete yourself" : 'Delete'} disabled={u.is_me || u.is_superuser} onClick={() => remove(u)}><Icon.trash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modal && <UserModal initial={modal} onClose={() => setModal(null)} onSaved={(m) => { setModal(null); toast.success(m); load() }} />}
    </>
  )
}
