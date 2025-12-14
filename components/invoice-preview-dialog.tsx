"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react"
import { InvoiceTemplate } from "@/components/invoice-template"
import { useState, useEffect, useRef } from "react"

interface Record {
  id: string
  company: string
  amount: number
  contactName: string
  contactEmail: string
  issueDate?: string
  description?: string
}

interface InvoicePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  records: Record[]
  onDownload: () => void
}

export function InvoicePreviewDialog({ open, onOpenChange, records, onDownload }: InvoicePreviewDialogProps) {
  const [zoom, setZoom] = useState(100) // 100% = fit to container
  const [currentPage, setCurrentPage] = useState(1)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    if (open && scrollContainerRef.current) {
      // 컨테이너 너비 감지
      const updateWidth = () => {
        if (scrollContainerRef.current) {
          setContainerWidth(scrollContainerRef.current.offsetWidth)
        }
      }

      updateWidth()
      window.addEventListener("resize", updateWidth)

      return () => window.removeEventListener("resize", updateWidth)
    }
  }, [open])

  useEffect(() => {
    // Reset to first page when dialog opens
    if (open) {
      setCurrentPage(1)
    }
  }, [open])

  const handleDownloadClick = async () => {
    const { generateInvoicePDF } = await import("@/lib/pdf-generator")
    await generateInvoicePDF(records)
    onOpenChange(false)
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200)) // 최대 200%
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50)) // 최소 50%
  }

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, records.length))
  }

  // A4 크기: 210mm x 297mm (at 96 DPI: 794px x 1123px)
  const a4WidthPx = 794
  const a4HeightPx = 1123

  // 컨테이너에 맞춰 기본 스케일 계산 (padding 40px 고려)
  const baseScale = containerWidth > 0 ? (containerWidth - 40) / a4WidthPx : 0.5
  const finalScale = baseScale * (zoom / 100)
  const scaledWidth = a4WidthPx * finalScale
  const scaledHeight = a4HeightPx * finalScale

  const currentRecord = records[currentPage - 1]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] w-[90vw] max-h-[95vh] p-0 flex flex-col" showCloseButton={false}>
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">인보이스 미리보기</DialogTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 border rounded-md">
                <Button variant="ghost" size="icon" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm px-2 min-w-[60px] text-center">{zoom}%</span>
                <Button variant="ghost" size="icon" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <DialogDescription className="text-sm text-muted-foreground mt-2">총 {records.length}개의 인보이스</DialogDescription>
        </DialogHeader>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto"
          style={{
            minHeight: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "20px",
              minWidth: "100%",
              justifyContent: "center",
              minHeight: "100%",
            }}
          >
            {currentRecord && (
              <div
                style={{
                  width: `${scaledWidth}px`,
                  height: `${scaledHeight}px`,
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  borderRadius: "8px",
                  overflow: "hidden",
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: `${a4WidthPx}px`,
                    height: `${a4HeightPx}px`,
                    transform: `scale(${finalScale})`,
                    transformOrigin: "top left",
                  }}
                >
                  <InvoiceTemplate
                    record={currentRecord}
                    pageNumber={currentPage}
                    totalPages={records.length}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-slate-50 flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              {records.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[80px] text-center">
                    {currentPage} / {records.length}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextPage}
                    disabled={currentPage === records.length}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                취소
              </Button>
              <Button onClick={handleDownloadClick} className="bg-primary hover:bg-primary/90">
                <Download className="mr-2 h-4 w-4" />
                PDF 다운로드
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
