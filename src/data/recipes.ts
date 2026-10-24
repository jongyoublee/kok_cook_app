// H1 레시피 데이터. 조리 단계는 직접 작성했고 외부 글을 옮기지 않았다.
// 영양정보는 재료별 추정 영양값(data/nutrition)으로 계산한 검수 전 값이다(verified: false).
import { computeNutrition } from '../lib/nutrition'
import type { IngredientId } from './ingredients'
import type { NutritionFacts } from './nutrition'
import rawRecipes from './recipes.json'

// A10 베이스 탄수화물. 반찬·찌개처럼 밥과 함께 먹는 메뉴는 rice
export type CarbBase = 'rice' | 'noodle' | 'potato' | 'sweetPotato'

// 맛 계열과 조리법. 같은 재료라도 양념·조리법이 다르면 다른 메뉴로 본다(추가 제안, 교체).
// 2026-10-23 Claude가 붙인 값으로 사람 검수 전이다
export type Flavor = 'soy' | 'spicy' | 'doenjang' | 'kimchi' | 'oyster' | 'tomato' | 'oilSalt' | 'mayo'
export type CookMethod = 'stirFry' | 'braise' | 'grill' | 'steam' | 'salad'
export const FLAVOR_LABEL: Record<Flavor, string> = {
  soy: '간장',
  spicy: '매콤',
  doenjang: '된장',
  kimchi: '김치',
  oyster: '굴소스',
  tomato: '토마토',
  oilSalt: '오일·소금',
  mayo: '마요',
}
export const METHOD_LABEL: Record<CookMethod, string> = { stirFry: '볶음', braise: '조림', grill: '구이', steam: '찜', salad: '샐러드' }

// B6 단백질 공급원 분산용
export type ProteinSource = 'pork' | 'beef' | 'chicken' | 'fish' | 'seafood' | 'tofu' | 'egg' | 'legume'

export type Recipe = {
  id: string
  name: string
  korean: boolean // 한식 여부. 2026-10-23 식단 분류에서 빠졌고, 나중에 '한식만 보기' 같은 필터에 쓴다
  proteinSource: ProteinSource
  carb: CarbBase
  flavor: Flavor
  method: CookMethod
  // C1 1인분 기준 분량. amount는 재료 사전의 unit 기준
  ingredients: { id: IngredientId; amount: number }[]
  steps: string[]
  cookMinutes: number
  // 1인분 조리 후 무게(g). 다 만든 뒤 저울로 이만큼씩 나눠 담는다. 검수 전 추정치
  portionG: number
  // C2 1인분 영양정보. 나트륨만 mg, 나머지는 g. 재료 분량으로 계산한다(H3, lib/nutrition)
  nutrition: NutritionFacts
  // C4 보관 정보
  storage: { freezable: boolean; fridgeDays: number }
  verified: boolean // 사람 검수 여부
}

// H1 레시피 원본 값은 recipes.json에 두고 관리 화면(개발 서버 전용)에서 고친다.
// 영양정보는 적지 않고 여기서 계산해 채운다. 값 검사는 lib/recipeCheck(테스트·저장 공통)
export type RecipeData = Omit<Recipe, 'nutrition'>
export const recipeData = rawRecipes as RecipeData[]

export const recipes: Recipe[] = recipeData.map((r) => ({ ...r, nutrition: computeNutrition(r) }))
