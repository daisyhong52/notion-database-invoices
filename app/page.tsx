"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Download, Eye } from "lucide-react"
import { generateInvoicePDF } from "@/lib/pdf-generator"
import Image from "next/image"
import { InvoicePreviewDialog } from "@/components/invoice-preview-dialog"
import { numberToKorean } from "@/lib/number-to-korean"

interface Record {
  id: string
  company: string
  amount: number
  contactName: string
  contactEmail: string
  issueDate?: string
  description?: string
}

export default function InvoicePage() {
  const [records, setRecords] = useState<Record[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRecords, setSelectedRecords] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewRecords, setPreviewRecords] = useState<Record[]>([])
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [sortField, setSortField] = useState<"company" | "amount" | "contactName" | "contactEmail" | "issueDate" | "description">("company")

  useEffect(() => {
    let isCancelled = false

    const fetchRecords = async () => {
      try {
        setIsLoading(true)
        console.log("Fetching records from API...")
        const response = await fetch("/api/records")
        
        if (isCancelled) return

        if (!response.ok) {
          const errorData = await response.json()
          console.error("API error:", errorData)
          throw new Error(errorData.error || "Failed to fetch records")
        }

        const data = await response.json()
        
        if (isCancelled) return
        
        console.log("Received data:", data)
        console.log("Data type:", Array.isArray(data) ? "Array" : typeof data)
        console.log("Data length:", Array.isArray(data) ? data.length : "N/A")

        let transformedData: Record[] = []

        const today = new Date().toISOString().split("T")[0].replace(/-/g, ".")

        if (Array.isArray(data)) {
          transformedData = data.map((item: any) => ({
            id: item.id || String(Math.random()),
            company: item.company ?? "",
            amount: typeof item.amount === "number" ? item.amount : (item.amount != null ? Number.parseFloat(item.amount) : 0),
            contactName: item.contactName ?? "",
            contactEmail: item.contactEmail ?? "",
            issueDate: item.issueDate ?? "",
            description: item.description ?? "",
          }))
        } else if (data.data && data.data.outputs) {
          // MISO 원본 형식 처리
          const outputs = data.data.outputs
          transformedData = [
            {
              id: "1",
              company: outputs["회사명"] || "",
              amount: Number.parseFloat(outputs["최종금액"]) || 0,
              contactName: outputs["담당자"] || "",
              contactEmail: outputs["담당자 이메일"] || "",
              issueDate: today,
              description: outputs["설명"] || "",
            },
          ]
        }

        console.log("Transformed data:", transformedData)

        if (transformedData.length === 0) {
          console.warn("⚠️ 데이터가 비어있습니다!")
        } else {
          transformedData.forEach((record, index) => {
            const emptyFields = []
            if (!record.company) emptyFields.push("회사명")
            if (!record.amount) emptyFields.push("최종금액")
            if (!record.contactName) emptyFields.push("담당자")
            if (!record.contactEmail) emptyFields.push("담당자 이메일")

            if (emptyFields.length > 0) {
              console.warn(`⚠️ 레코드 ${index + 1}의 비어있는 필드:`, emptyFields.join(", "))
            }
          })
        }

        if (!isCancelled) {
          setRecords(transformedData)
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Error fetching records:", error)
          alert("데이터를 불러오는데 실패했습니다.")
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchRecords()

    return () => {
      isCancelled = true
    }
  }, [])

  const toggleRecord = (id: string) => {
    setSelectedRecords((prev) => (prev.includes(id) ? prev.filter((recordId) => recordId !== id) : [...prev, id]))
  }

  const toggleAll = () => {
    if (selectedRecords.length === sortedRecords.length) {
      setSelectedRecords([])
    } else {
      setSelectedRecords(sortedRecords.map((r) => r.id))
    }
  }

  const handlePreviewInvoices = () => {
    if (selectedRecords.length === 0) {
      alert("미리보기할 계약을 선택해주세요.")
      return
    }

    const selectedData = records.filter((record) => selectedRecords.includes(record.id))
    setPreviewRecords(selectedData)
    setPreviewOpen(true)
  }

  const handleGenerateInvoices = async () => {
    if (selectedRecords.length === 0) {
      alert("인보이스를 생성할 계약을 선택해주세요.")
      return
    }

    setIsGenerating(true)

    const selectedData = records.filter((record) => selectedRecords.includes(record.id))

    // Create hidden preview container for PDF generation
    const hiddenContainer = document.createElement("div")
    hiddenContainer.style.position = "fixed"
    hiddenContainer.style.left = "-9999px"
    hiddenContainer.style.top = "0"
    hiddenContainer.style.visibility = "hidden"
    hiddenContainer.style.pointerEvents = "none"
    document.body.appendChild(hiddenContainer)

    try {
      // Dynamically import and render invoices
      const { createRoot } = await import("react-dom/client")
      const { InvoiceTemplate } = await import("@/components/invoice-template")
      const React = await import("react")

      const root = createRoot(hiddenContainer)

      await new Promise<void>((resolve) => {
        root.render(
          React.createElement(
            "div",
            null,
            selectedData.map((record, index) =>
              React.createElement(InvoiceTemplate, {
                key: record.id,
                record: record,
                pageNumber: index + 1,
                totalPages: selectedData.length,
              })
            )
          )
        )
        setTimeout(resolve, 1000)
      })

      await generateInvoicePDF(selectedData)

      root.unmount()
      document.body.removeChild(hiddenContainer)

      setSelectedRecords([])
    } catch (error) {
      console.error("Invoice generation failed:", error)
      alert("인보이스 생성 중 오류가 발생했습니다.")
      if (hiddenContainer.parentNode) {
        document.body.removeChild(hiddenContainer)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount) + "원"
  }

  const toggleSort = (field: "company" | "amount" | "contactName" | "contactEmail" | "issueDate" | "description") => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const sortedRecords = [...records].sort((a, b) => {
    let comparison = 0

    switch (sortField) {
      case "company":
        comparison = a.company.localeCompare(b.company, "ko-KR")
        break
      case "amount":
        comparison = a.amount - b.amount
        break
      case "contactName":
        comparison = a.contactName.localeCompare(b.contactName, "ko-KR")
        break
      case "contactEmail":
        comparison = a.contactEmail.localeCompare(b.contactEmail)
        break
      case "issueDate":
        const dateA = a.issueDate || ""
        const dateB = b.issueDate || ""
        comparison = dateA.localeCompare(dateB)
        break
      case "description":
        const descA = a.description || ""
        const descB = b.description || ""
        comparison = descA.localeCompare(descB, "ko-KR")
        break
    }

    return sortOrder === "asc" ? comparison : -comparison
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">데이터 로딩중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-6 md:p-12 relative flex flex-col">
      <div className="mx-auto max-w-7xl w-full flex-1">
        <Card className="shadow-lg border-purple-100">
          <CardHeader className="bg-white">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <FileText className="h-6 w-6 text-primary" />
                  미소 인보이스 생성기
                </CardTitle>
                <CardDescription className="mt-2">
                  {selectedRecords.length}개 선택됨 · 총 {sortedRecords.length}개 계약
                </CardDescription>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handlePreviewInvoices}
                  disabled={selectedRecords.length === 0}
                  size="lg"
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10 bg-transparent"
                >
                  <Eye className="mr-2 h-5 w-5" />
                  미리보기
                </Button>
                <Button
                  onClick={handleGenerateInvoices}
                  disabled={selectedRecords.length === 0 || isGenerating}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                >
                  <Download className="mr-2 h-5 w-5" />
                  {isGenerating ? "생성중..." : "PDF 다운로드"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-purple-50/50 hover:bg-purple-50/50">
                    <TableHead className="w-12 pl-6">
                      <Checkbox
                        checked={selectedRecords.length === sortedRecords.length && sortedRecords.length > 0}
                        onCheckedChange={toggleAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="font-semibold">
                      <button
                        onClick={() => toggleSort("company")}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        회사명
                        {sortField === "company" && (
                          <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <button
                        onClick={() => toggleSort("description")}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        설명
                        {sortField === "description" && (
                          <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <button
                        onClick={() => toggleSort("amount")}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        최종금액
                        {sortField === "amount" && (
                          <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <button
                        onClick={() => toggleSort("contactName")}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        담당자
                        {sortField === "contactName" && (
                          <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <button
                        onClick={() => toggleSort("contactEmail")}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        담당자 이메일
                        {sortField === "contactEmail" && (
                          <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <button
                        onClick={() => toggleSort("issueDate")}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        발행일
                        {sortField === "issueDate" && (
                          <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        등록된 계약이 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedRecords.map((record) => (
                      <TableRow
                        key={record.id}
                        className={`cursor-pointer transition-colors ${
                          selectedRecords.includes(record.id) ? "bg-purple-50 hover:bg-purple-100" : "hover:bg-slate-50"
                        }`}
                        onClick={() => toggleRecord(record.id)}
                      >
                        <TableCell className="pl-6" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedRecords.includes(record.id)}
                            onCheckedChange={() => toggleRecord(record.id)}
                            aria-label={`Select ${record.company}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">{record.company}</TableCell>
                        <TableCell className="text-slate-700">{record.description || "-"}</TableCell>
                        <TableCell className="font-semibold text-primary">
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <span>{formatCurrency(record.amount)}</span>
                            {record.amount > 0 && (
                              <span className="text-xs text-slate-500 font-normal whitespace-nowrap">
                                {numberToKorean(record.amount)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-700">{record.contactName}</TableCell>
                        <TableCell className="text-slate-600">{record.contactEmail}</TableCell>
                        <TableCell className="text-slate-700">{record.issueDate || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <InvoicePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        records={previewRecords}
        onDownload={handleGenerateInvoices}
      />

      <footer className="w-full max-w-7xl mx-auto flex items-center justify-between px-6 md:px-0 py-8 mt-8">
        <div className="text-sm text-slate-400">© 2025 MISO. All rights reserved.</div>
        <div>
          <Image src="/miso-logo.png" alt="MISO" width={80} height={27} className="h-5 w-auto opacity-90" />
        </div>
      </footer>
    </div>
  )
}
