import { fmtDate, ListItem, statusColor, statusLabel, Tab } from '../ContactPage'
import { btn, card, iconBtn } from '@/styles/shared'
import { C } from '@/constants/colors'
import { Check, Loader2, RefreshCw, Trash2, Star } from 'lucide-react'
import { Feedback, Pagination } from '@/types/dust'
import { Badge } from '@/components/ui'
import PaginationComponent from '@/components/ui/Pagination'
import TableSkeleton from '@/components/ui/TableSkeleton'
import { useState, useEffect } from 'react'
import { Drawer } from './Drawer'
import LimitSelect from '@/components/ui/LimitSelect'

export type TableProps = {
  tab: Tab
  meta: Pagination
  list: ListItem[]
  loading: boolean
  page: number
  limit: number
  setPage: (val: number) => void
  setLimit: (val: number) => void
  deleting: string | null
  resolving: string | null
  refetch: () => void
  resolve: (id: string) => void
  remove: (id: string) => void
}

const ENQUIRY_HEADS = ["Name", "Email", "Phone", "Message", "Date", "Actions"]
const FEEDBACK_HEADS = ["Name", "Email", "Phone", "Category", "Rating", "Station", "Feedback", "Date", "Status", "Actions"]

const Table = (props: TableProps) => {
  const { tab, meta, list, loading, page, limit, setPage, setLimit, deleting, resolving, resolve, remove, refetch } = props
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null)
  const isFeedback = (item: ListItem): item is Feedback => "rating" in item

  // keep drawer in sync with list updates
  useEffect(() => {
    if (!selectedItem) return
    if (deleting === selectedItem.id) { setSelectedItem(null); return }
    const fresh = list.find((x) => x.id === selectedItem.id)
    if (fresh) setSelectedItem(fresh)
  }, [list, deleting])

  const onLimitChange = (val: number) => {
    setLimit(val)
    setPage(1)
  }

  if (loading) {
    // Keep the loading skeleton exactly as wide as the real table (it was one
    // column short for feedback, and the new Phone column widens enquiries).
    return <TableSkeleton rows={7} columns={tab === "feedback" ? FEEDBACK_HEADS.length : ENQUIRY_HEADS.length} />
  }

  return (
    <div>
      {(tab === "enquiry" || tab === "feedback") && (
        <div style={{ ...card(), padding: 0, overflow: "hidden" }}>

          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.bd}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontWeight: 600, color: C.t, fontSize: 14 }}>
              {tab === "enquiry" ? "Contact Form Submissions" : "Feedback Submissions"}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={refetch}
                style={{ ...btn("ghost"), padding: "6px 10px", fontSize: 12 }}
                disabled={loading}
              >
                <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              </button>
              <LimitSelect value={limit} onChange={(val) => { onLimitChange(val) }} />
            </div>
          </div>

          {list.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: C.tm, fontSize: 13 }}>No records found</div>
          )}

          {list.length > 0 && (
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: tab === "feedback" ? 960 : 560 }}>
                <thead>
                  <tr style={{ background: C.bg }}>
                    {(tab === "enquiry" ? ENQUIRY_HEADS : FEEDBACK_HEADS).map((h) => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: C.tm, whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((s, i) => (
                    
                    <tr
                      key={s.id}
                      onClick={() => setSelectedItem(s)}
                      style={{
                        borderTop: `1px solid ${C.bd}`,
                        background: selectedItem?.id === s.id ? `${C.p}0f` : i % 2 === 0 ? C.white : "#fafcfb",
                        opacity: deleting === s.id ? 0.4 : 1,
                        transition: "background 0.15s, opacity 0.2s",
                        cursor: "pointer",
                      }}
                      onMouseEnter={e => { if (selectedItem?.id !== s.id) (e.currentTarget as HTMLElement).style.background = C.bg }}
                      onMouseLeave={e => { if (selectedItem?.id !== s.id) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? C.white : "#fafcfb" }}
                    >
                      <td style={{ padding: "12px 16px", fontWeight: 500, color: C.t, fontSize: 13, whiteSpace: "nowrap" }}>{s.name}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: C.tm, whiteSpace: "nowrap" }}>{s.email}</td>

                      {/* Phone column for both tabs — enquiries store `phone`,
                          feedback stores `phoneNo`. */}
                      <td style={{ padding: "12px 16px", fontSize: 12, color: C.tm, whiteSpace: "nowrap" }}>
                        {(isFeedback(s) ? s.phoneNo : s.phone)?.trim() || "-"}
                      </td>

                      {isFeedback(s) && (
                        <>
                          <td style={{ padding: "12px 16px", fontSize: 12, color: C.tm, whiteSpace: "nowrap" }}>{s.category}</td>
                          <td style={{ padding: "12px 16px", fontSize: 12, color: C.tm, whiteSpace: "nowrap" }}>
                            <span style={{ display: "inline-flex", gap: 1, alignItems: "center" }}>
                              {Array.from({ length: s.rating }, (_, idx) => (
                                <Star key={idx} size={13} color="#f59e0b" fill="#f59e0b" />
                              ))}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 12, color: C.tm, whiteSpace: "nowrap" }}>{s.stationName ?? "-"}</td>
                        </>
                      )}

                      <td style={{ padding: "12px 16px", fontSize: 12, color: C.t, maxWidth: 200, minWidth: 120 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.message}</div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: C.tm, whiteSpace: "nowrap" }}>{
                      
                      fmtDate(s.createdAt)}</td>

                      {tab === "feedback" && (
                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                          <Badge color={statusColor((s as Feedback).status)}>{statusLabel((s as Feedback).status)}</Badge>
                        </td>
                      )}

                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {tab === "feedback" && (
                            <button
                              onClick={() => resolve(s.id!)}
                              disabled={resolving === s.id || (s as Feedback).status === "resolved"}
                              title="Resolve feedback"
                              style={{ ...btn("ghost"), padding: "4px 10px", fontSize: 12, color: C.p, opacity: (s as Feedback).status === "resolved" ? 0.4 : 1 }}
                            >
                              {resolving === s.id
                                ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                                : <Check size={12} />}
                              Resolve
                            </button>
                          )}
                          <button
                            onClick={() => remove(s.id!)}
                            disabled={deleting === s.id}
                            title="Delete"
                            aria-label="Delete"
                            style={iconBtn("ghost", 30, { color: C.red })}
                          >
                            {deleting === s.id
                              ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                              : <Trash2 size={12} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <PaginationComponent
            meta={meta}
            page={page}
            loading={loading}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      <Drawer
        item={selectedItem}
        tab={tab}
        onClose={() => setSelectedItem(null)}
        resolving={resolving}
        deleting={deleting}
        resolve={resolve}
        remove={remove}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default Table