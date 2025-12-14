"use client"

interface InvoiceData {
  id: string
  company: string
  amount: number
  contactName: string
  contactEmail: string
  issueDate?: string
}

const COMPANY_INFO = {
  name: "(주)GS",
  address: "서울특별시 강남구 논현로 508 GS타워",
  bank: "우리은행 982-018207-01-002 ㈜지에스",
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR").format(amount) + "원"
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function generateInvoiceHTML(record: InvoiceData): string {
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

  const dueDate = new Date(issueDate)
  dueDate.setMonth(dueDate.getMonth() + 1)

  return `
    <div style="width: 794px; min-height: 1123px; padding: 60px; box-sizing: border-box; font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; background: #fff; color: #000; page-break-after: always;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 50px;">
        <h1 style="font-size: 36px; font-weight: bold; margin: 0;">Invoice</h1>
        <img src="/miso-logo.png" alt="MISO" style="width: 80px; height: 27px; object-fit: contain;" />
      </div>
      
      <div style="margin-bottom: 40px; font-size: 13px; line-height: 1.8;">
        <div style="margin-bottom: 4px;"><span style="font-weight: 600; display: inline-block; width: 120px;">발행일</span><span>${formatDate(issueDate)}</span></div>
        <div><span style="font-weight: 600; display: inline-block; width: 120px;">결제 기한</span><span>${formatDate(dueDate)}</span></div>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 50px;">
        <div style="flex: 1; font-size: 13px; line-height: 1.8;">
          <div style="font-weight: 600; margin-bottom: 8px;">발행자</div>
          <div style="font-weight: 600; margin-bottom: 8px;">${COMPANY_INFO.name}</div>
          <div>${COMPANY_INFO.address}</div>
        </div>
        <div style="flex: 1; text-align: right; font-size: 13px; line-height: 1.8;">
          <div style="font-weight: 600; margin-bottom: 8px;">수신자</div>
          <div>${record.company}</div>
          <div>${record.contactName}</div>
          <div>${record.contactEmail}</div>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;"><div style="font-size: 32px; font-weight: bold;">${formatCurrency(record.amount)}</div></div>
      
      <div style="margin-bottom: 30px; font-size: 13px;"><span style="font-weight: 600; margin-right: 8px;">입금계좌</span>${COMPANY_INFO.bank}</div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
        <thead>
          <tr style="border-bottom: 1px solid #000;">
            <th style="text-align: left; padding: 12px 0; font-size: 13px; font-weight: 600;">설명</th>
            <th style="text-align: right; padding: 12px 0; font-size: 13px; font-weight: 600; width: 120px;">금액</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 16px 0; font-size: 13px;">PLAI 패키지</td>
            <td style="text-align: right; padding: 16px 0; font-size: 13px;">${formatCurrency(record.amount)}</td>
          </tr>
        </tbody>
      </table>
      
      <div style="margin-left: auto; width: 300px; margin-bottom: 60px;">
        <div style="display: flex; justify-content: space-between; padding: 12px 0; font-size: 13px; border-bottom: 1px solid #E5E5E5;">
          <span>총액</span><span>${formatCurrency(record.amount)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 12px 0; font-size: 14px; font-weight: bold;">
          <span>최종 결제 금액</span><span>${formatCurrency(record.amount)}</span>
        </div>
      </div>
      
      <div style="margin-top: auto; font-size: 12px; color: #666;">기타 문의사항은 (주)GS 업무지원팀 이수민 매니저에게 문의하시기 바랍니다.</div>
    </div>
  `
}

export async function generateInvoicePDF(records: InvoiceData[]) {
  // HTML 생성
  const invoicesHTML = records.map((record) => generateInvoiceHTML(record)).join("")

  // 오늘 날짜로 파일명 생성
  const today = new Date().toISOString().split("T")[0]
  const fileName = `invoices_${today}`
  const originalTitle = document.title

  // 현재 페이지를 임시로 숨기기 위한 스타일 추가
  const printStyle = document.createElement("style")
  printStyle.id = "invoice-print-style"
  printStyle.textContent = `
    @media print {
      @page {
        size: A4;
        margin: 0;
      }
      body > *:not(.invoice-print-container) {
        display: none !important;
      }
      body {
        margin: 0;
        padding: 0;
        background: #fff;
      }
      .invoice-print-container {
        display: block !important;
      }
    }
    @media screen {
      .invoice-print-container {
        display: none;
      }
    }
  `
  document.head.appendChild(printStyle)

  // 인보이스 컨테이너 생성 및 추가
  const printContainer = document.createElement("div")
  printContainer.className = "invoice-print-container"
  printContainer.innerHTML = invoicesHTML
  document.body.appendChild(printContainer)

  // 인쇄 전 title 변경 (PDF 파일명으로 사용됨)
  document.title = fileName

  // 인쇄 대화상자 표시
  window.print()

  // 인쇄 완료 후 정리
  const cleanup = () => {
    document.title = originalTitle
    printContainer.remove()
    printStyle.remove()
    window.removeEventListener("afterprint", cleanup)
  }
  window.addEventListener("afterprint", cleanup)
  
  // 일부 브라우저는 afterprint를 지원하지 않으므로, 일정 시간 후에도 정리
  setTimeout(() => {
    if (document.body.contains(printContainer)) {
      cleanup()
    }
  }, 1000)
}
