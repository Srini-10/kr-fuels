// components/ui/Pagination.tsx
import { ChevronLeft, ChevronRight } from "lucide-react"
import { C } from "../../constants/colors"
import { btn } from "../../styles/shared"
import { FC } from "react"

interface PaginationMeta {
  total:      number
  page:       number
  limit:      number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface PaginationProps {
  meta:     PaginationMeta
  page:     number
  loading?: boolean
  onPageChange: (page: number) => void
}

const pageNumbers = (current: number, total: number): (number | "...")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4)        return [1, 2, 3, 4, 5, "...", total]
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total]
  return [1, "...", current - 1, current, current + 1, "...", total]
}

// A perfect circle: equal width/height, no padding, flex-centered content.
const circleBtn = {
  width:          34,
  height:         34,
  minWidth:       34,
  padding:        0,
  borderRadius:   9999,
  display:        "inline-flex",
  alignItems:     "center",
  justifyContent: "center",
  flexShrink:     0,
} as const

const Pagination: FC<PaginationProps> = ({ meta, page, loading = false, onPageChange }) => {
  if (meta.totalPages <= 1) return null

  return (
    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, padding: "12px 0",flexWrap:"wrap" }}>

      {/* Range info */}
      <span style={{ fontSize: 12, color: C.tm, marginRight: 8 }}>
        {((page - 1) * meta.limit) + 1}–{Math.min(page * meta.limit, meta.total)} of {meta.total}
      </span>

      {/* Prev */}
      <button
        aria-label="Previous page"
        style={{ ...btn("ghost"), ...circleBtn, opacity: !meta.hasPrevPage ? 0.35 : 1 }}
        disabled={!meta.hasPrevPage}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft size={15} />
      </button>

      {/* Page numbers */}
      {pageNumbers(page, meta.totalPages).map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} style={{ padding: "0 2px", color: C.tm, fontSize: 13 }}>…</span>
        ) : (
          <button
            key={`page-${i}`}
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={page === p ? "page" : undefined}
            style={{
              ...btn("ghost"),
              ...circleBtn,
              fontSize:     13,
              border:       page === p ? "none" : `1px solid ${C.bd}`,
              background:   page === p ? C.p : "transparent",
              color:        page === p ? C.white : C.tm,
              fontWeight:   page === p ? 600 : 500,
            }}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        aria-label="Next page"
        style={{ ...btn("ghost"), ...circleBtn, opacity: !meta.hasNextPage ? 0.35 : 1 }}
        disabled={!meta.hasNextPage}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight size={15} />
      </button>
    </div>
  )
}

export default Pagination