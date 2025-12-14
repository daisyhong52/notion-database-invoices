/**
 * 숫자를 한글 금액으로 변환
 * @param num - 변환할 숫자
 * @returns 한글 금액 문자열 (예: "사만원", "일백이십만원")
 */
export function numberToKorean(num: number): string {
  if (num === 0) return ""

  const units = ["", "만", "억", "조"]
  const smallUnits = ["", "십", "백", "천"]
  const digits = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"]

  // 4자리씩 끊어서 처리
  const splitNum = (n: number): number[] => {
    const result: number[] = []
    while (n > 0) {
      result.push(n % 10000)
      n = Math.floor(n / 10000)
    }
    return result
  }

  // 4자리 숫자를 한글로 변환
  const convertFourDigits = (n: number): string => {
    if (n === 0) return ""

    let result = ""
    const digitArray = [
      Math.floor(n / 1000),
      Math.floor((n % 1000) / 100),
      Math.floor((n % 100) / 10),
      n % 10,
    ]

    for (let i = 0; i < 4; i++) {
      const digit = digitArray[i]
      if (digit === 0) continue

      // 1은 십, 백, 천에서 생략 (예: "일십" -> "십")
      if (digit === 1 && i < 3) {
        result += smallUnits[3 - i]
      } else {
        result += digits[digit] + smallUnits[3 - i]
      }
    }

    return result
  }

  const parts = splitNum(num)
  let result = ""

  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i]
    if (part === 0) continue

    const koreanPart = convertFourDigits(part)
    result += koreanPart + units[i]
  }

  return result + "원"
}
