// G1 재료별 쿠팡 링크. 고정한 상품(G4)이 있으면 그 상품 페이지, 없으면 판매 단위까지 넣은 검색어로 연결한다.
// G3 쿠팡 가격은 가져오거나 저장하지 않는다
import { config } from '../config'
import { ingredients, type Ingredient, type IngredientId } from '../data/ingredients'

export const coupangSearchUrl = (query: string) => `https://www.coupang.com/np/search?q=${encodeURIComponent(query)}`

export function coupangLink(id: IngredientId) {
  const ing: Ingredient = ingredients[id]
  return ing.coupangUrl ?? coupangSearchUrl(ing.coupangQuery)
}

// G2 수수료 고지. 파트너스를 쓰지 않으면 보이지 않는다
export const COUPANG_NOTICE = config.coupang.partners
  ? '쿠팡 링크로 구매하면 쿠팡 파트너스 활동의 일환으로 일정액의 수수료를 제공받을 수 있어요.'
  : ''
