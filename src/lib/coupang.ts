// G1 재료별 쿠팡 검색 링크. 파트너스 승인 전이라 일반 검색 링크이며, 승인 후 이 함수만 파트너스 링크로 바꾼다.
// G3 쿠팡 가격은 가져오거나 저장하지 않는다
export const coupangSearchUrl = (query: string) => `https://www.coupang.com/np/search?q=${encodeURIComponent(query)}`

// G2 수수료 고지
export const COUPANG_NOTICE = '쿠팡 링크로 구매하면 쿠팡 파트너스 활동의 일환으로 일정액의 수수료를 제공받을 수 있어요.'
