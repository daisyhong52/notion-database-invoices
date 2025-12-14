import { NextResponse } from "next/server"

export async function GET() {
  try {
    const misoUrl = process.env.MISO_URL
    const misoKey = process.env.MISO_KEY

    if (!misoUrl || !misoKey) {
      console.log("Missing credentials")
      return NextResponse.json(
        { error: "MISO 인증 정보가 설정되지 않았습니다. 환경변수를 확인해주세요." },
        { status: 500 },
      )
    }

    const apiEndpoint = `${misoUrl}/workflows/run`

    const requestBody = {
      inputs: {},
      mode: "blocking",
      user: "invoice-generator",
    }

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${misoKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      cache: "no-store",
    })


    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.log("Error response:", errorData)

      let errorMessage = "MISO API 호출에 실패했습니다."
      if (errorData.detail) {
        errorMessage = `오류: ${errorData.detail}`
      } else if (response.status === 400) {
        errorMessage = "잘못된 요청입니다. 워크플로우가 발행되었는지 확인해주세요."
      } else if (response.status === 401) {
        errorMessage = "인증에 실패했습니다. API 키를 확인해주세요."
      } else if (response.status === 500) {
        errorMessage = "서버 내부 오류가 발생했습니다."
      }

      return NextResponse.json(
        { error: errorMessage, status: response.status, detail: errorData },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("MISO API response structure:", {
      hasData: !!data.data,
      hasOutputs: !!data.data?.outputs,
      hasResults: !!data.data?.outputs?.["결과"],
      outputsKeys: data.data?.outputs ? Object.keys(data.data.outputs) : [],
    })

    if (data.data && data.data.outputs && data.data.outputs["결과"]) {
      const results = data.data.outputs["결과"]

      let parsedResults = results

      if (typeof results === "string") {
        // Remove markdown code block markers (```javascript, ```python, etc.)
        let cleanedString = results.trim()
        cleanedString = cleanedString.replace(/^```\w*\n?/g, "")
        cleanedString = cleanedString.replace(/\n?```$/g, "")
        cleanedString = cleanedString.trim()

        // Replace Python None with null for proper JSON parsing
        cleanedString = cleanedString.replace(/:\s*None/g, ": null")

        try {
          const parsed = JSON.parse(cleanedString)

          // Extract the actual array from parsed.outputs.결과
          if (parsed.outputs && parsed.outputs["결과"]) {
            parsedResults = parsed.outputs["결과"]
          } else if (Array.isArray(parsed)) {
            // If the parsed result is directly an array
            parsedResults = parsed
          } else {
            // If the parsed result is the object itself
            parsedResults = parsed
          }
        } catch (parseError) {
          console.error("Failed to parse string:", parseError)
          console.error("Cleaned string:", cleanedString)
          return NextResponse.json([])
        }
      }

      if (Array.isArray(parsedResults)) {
        console.log(`Found array with ${parsedResults.length} records`)
        console.log("First record keys:", parsedResults.length > 0 ? Object.keys(parsedResults[0]) : "No records")
        console.log("First record data:", parsedResults.length > 0 ? parsedResults[0] : "No records")

        const records = parsedResults.map((item: any, index: number) => {
          return {
            id: String(index + 1),
            company: item["회사명"] ?? "",
            amount: item["최종금액"] != null ? Number(item["최종금액"]) : 0,
            contactName: item["담당자"] ?? "",
            contactEmail: item["담당자 이메일"] ?? "",
            issueDate: item["발행일"] ?? "",
            description: item["설명"] ?? "",
          }
        })

        console.log(`Successfully parsed ${records.length} records`)
        return NextResponse.json(records)
      }
    }

    console.log("No valid data structure found in MISO response")
    return NextResponse.json([])
  } catch (error) {
    console.error("Failed to fetch records:", error)
    return NextResponse.json({ error: "MISO API 연결에 실패했습니다. 네트워크 연결을 확인해주세요." }, { status: 500 })
  }
}
