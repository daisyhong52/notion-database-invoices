"use client"

interface InvoiceData {
  id: string
  company: string
  amount: number
  contactName: string
  contactEmail: string
  issueDate?: string
  description?: string
}

interface InvoiceTemplateProps {
  record: InvoiceData
  pageNumber?: number
  totalPages?: number
}

const COMPANY_INFO = {
  name: "(주)GS",
  address: "서울특별시 강남구 논현로 508 GS타워",
  bank: "우리은행 982-018207-01-002 ㈜지에스",
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR").format(amount) + "원"
}

export function InvoiceTemplate({ record, pageNumber, totalPages }: InvoiceTemplateProps) {
  // 발행일: record.issueDate가 있으면 사용, 없으면 오늘 날짜
  let issueDate = new Date()
  if (record.issueDate && record.issueDate.trim() !== "") {
    // YYYY.MM.DD 형식을 YYYY-MM-DD로 변환
    const dateStr = record.issueDate.replace(/\./g, "-")
    const parsedDate = new Date(dateStr)
    if (!isNaN(parsedDate.getTime())) {
      issueDate = parsedDate
    }
  }

  const todayFormatted = issueDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // 한 달 뒤 날짜 계산
  const dueDate = new Date(issueDate)
  dueDate.setMonth(dueDate.getMonth() + 1)
  const dueDateFormatted = dueDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div
      id={`invoice-${record.id}`}
      style={{
        width: "794px",
        minHeight: "1123px",
        padding: "60px",
        margin: "0 auto",
        boxSizing: "border-box",
        fontFamily: "'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
        color: "#000000",
      }}
    >
      {/* Header with Logo and Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "50px" }}>
        <div>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: "bold",
              margin: "0",
              color: "#000000",
            }}
          >
            Invoice
          </h1>
        </div>
        <div style={{ width: "80px", height: "27px", position: "relative" }}>
          <img
            src="/miso-logo.png"
            alt="MISO"
            width={80}
            height={27}
            style={{ objectFit: "contain", width: "80px", height: "27px" }}
          />
        </div>
      </div>

      {/* Invoice Details */}
      <div style={{ marginBottom: "40px", fontSize: "13px", lineHeight: "1.8" }}>
        <div style={{ marginBottom: "4px" }}>
          <span style={{ fontWeight: "600", display: "inline-block", width: "120px" }}>발행일</span>
          <span>{todayFormatted}</span>
        </div>
        <div>
          <span style={{ fontWeight: "600", display: "inline-block", width: "120px" }}>결제 기한</span>
          <span>{dueDateFormatted}</span>
        </div>
      </div>

      {/* From and Bill To Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "50px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
            <div style={{ fontWeight: "600", marginBottom: "8px" }}>발행자</div>
            <div style={{ fontWeight: "600", marginBottom: "8px" }}>{COMPANY_INFO.name}</div>
            <div>{COMPANY_INFO.address}</div>
          </div>
        </div>
        <div style={{ flex: 1, textAlign: "right" }}>
          <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
            <div style={{ fontWeight: "600", marginBottom: "8px" }}>수신자</div>
            <div>{record.company}</div>
            <div>{record.contactName}</div>
            <div>{record.contactEmail}</div>
          </div>
        </div>
      </div>

      {/* Amount Due - Large */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "32px", fontWeight: "bold" }}>{formatCurrency(record.amount)}</div>
      </div>

      {/* Bank Info */}
      <div style={{ marginBottom: "30px", fontSize: "13px" }}>
        <span style={{ fontWeight: "600", marginRight: "8px" }}>입금계좌</span>
        {COMPANY_INFO.bank}
      </div>

      {/* Table */}
      <div style={{ marginBottom: "40px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #000000" }}>
              <th style={{ textAlign: "left", padding: "12px 0", fontSize: "13px", fontWeight: "600" }}>설명</th>
              <th style={{ textAlign: "right", padding: "12px 0", fontSize: "13px", fontWeight: "600", width: "120px" }}>
                금액
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "16px 0", fontSize: "13px" }}>{record.description || "PLAI 패키지"}</td>
              <td style={{ textAlign: "right", padding: "16px 0", fontSize: "13px" }}>{formatCurrency(record.amount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ marginLeft: "auto", width: "300px", marginBottom: "60px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "12px 0",
            fontSize: "13px",
            borderBottom: "1px solid #E5E5E5",
          }}
        >
          <span>총액</span>
          <span>{formatCurrency(record.amount)}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "12px 0",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          <span>최종 결제 금액</span>
          <span>{formatCurrency(record.amount)}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: "auto", fontSize: "12px", color: "#666666" }}>
        <div>기타 문의사항은 (주)GS 업무지원팀 이수민 매니저에게 문의하시기 바랍니다.</div>
      </div>
    </div>
  )
}
