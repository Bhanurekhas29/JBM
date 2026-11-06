// Builds a neatly formatted .xlsx of enquiries and downloads it. exceljs is loaded on demand so it
// does not weigh down the rest of the admin panel.
const NAVY = 'FF0E1F38'
const GOLD = 'FFEDB445'
const thin = { style: 'thin', color: { argb: 'FFE3DCC8' } }
const BORDER = { top: thin, left: thin, bottom: thin, right: thin }

function toDate(s) {
  const d = new Date(String(s).replace(' ', 'T'))
  return isNaN(d) ? null : d
}
const pad = (n) => String(n).padStart(2, '0')

export async function exportEnquiries(rows, label = 'All enquiries') {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  wb.creator = 'JBM Admin'
  wb.created = new Date()
  const ws = wb.addWorksheet('Enquiries', {
    views: [{ state: 'frozen', ySplit: 4, showGridLines: false }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  })

  const cols = [
    ['S.No', 7], ['Date', 14], ['Time', 11], ['Name', 22], ['Business', 24], ['Email', 30],
    ['Phone', 17], ['Service', 28], ['Message', 60], ['Status', 11],
  ]
  ws.columns = cols.map(([, width]) => ({ width }))
  const last = cols.length

  // Title block
  const now = new Date()
  ws.mergeCells(1, 1, 1, last)
  const title = ws.getCell(1, 1)
  title.value = 'JBM – Website Enquiries'
  title.font = { name: 'Calibri', size: 18, bold: true, color: { argb: GOLD } }
  title.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.getRow(1).height = 34
  ws.mergeCells(2, 1, 2, last)
  const sub = ws.getCell(2, 1)
  sub.value = `${label}  •  ${rows.length} record${rows.length === 1 ? '' : 's'}  •  Exported on ${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`
  sub.font = { name: 'Calibri', size: 10.5, italic: true, color: { argb: 'FFCBD3E1' } }
  sub.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.getRow(2).height = 22
  for (const r of [1, 2]) for (let c = 1; c <= last; c++) ws.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }
  ws.getRow(3).height = 8

  // Header row
  const head = ws.getRow(4)
  cols.forEach(([name], i) => { head.getCell(i + 1).value = name })
  head.height = 26
  head.eachCell((c) => {
    c.font = { name: 'Calibri', size: 11, bold: true, color: { argb: NAVY } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } }
    c.alignment = { vertical: 'middle', horizontal: 'center' }
    c.border = BORDER
  })

  // Data rows
  rows.forEach((e, i) => {
    const d = toDate(e.created_at)
    const row = ws.addRow([
      i + 1, d, d, e.name || '', e.organization || '', e.email || '',
      e.phone || '', e.service || '', e.message || '', e.is_read ? 'Read' : 'New',
    ])
    row.getCell(2).numFmt = 'dd mmm yyyy'
    row.getCell(3).numFmt = 'hh:mm AM/PM'
    row.getCell(7).numFmt = '@'
    const zebra = i % 2 ? 'FFF8F5EC' : 'FFFFFFFF'
    row.eachCell({ includeEmpty: true }, (c, n) => {
      c.font = { name: 'Calibri', size: 10.5, color: { argb: 'FF1F2937' } }
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebra } }
      c.border = BORDER
      c.alignment = { vertical: 'top', wrapText: n === 9 || n === 8 || n === 5 || n === 4, horizontal: [1, 2, 3, 10].includes(n) ? 'center' : 'left' }
    })
    row.getCell(1).font = { name: 'Calibri', size: 10.5, color: { argb: 'FF8A93A3' } }
    const st = row.getCell(10)
    st.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: e.is_read ? 'FF6B7686' : 'FF1E9E5A' } }
    st.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: e.is_read ? 'FFF1EDE1' : 'FFE3F6EC' } }
    if (e.email) row.getCell(6).value = { text: e.email, hyperlink: `mailto:${e.email}` }, row.getCell(6).font = { name: 'Calibri', size: 10.5, underline: true, color: { argb: 'FF1D4ED8' } }
    const lines = Math.max(1, Math.ceil(String(e.message || '').length / 62) + String(e.message || '').split('\n').length - 1)
    row.height = Math.min(220, Math.max(22, lines * 15 + 6))
  })

  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: last } }

  const buf = await wb.xlsx.writeBuffer()
  const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `JBM-Enquiries_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}.xlsx`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  return a.download
}
