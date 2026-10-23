import type { ProteinSource } from './recipes'

// H2 표준 재료 사전. 레시피와 장보기 목록은 이 id로만 재료를 가리킨다.

// D5 매장 코너
export type Corner = '채소' | '육류·달걀' | '수산' | '두부·콩' | '곡류' | '양념'

export type Ingredient = {
  name: string
  unit: 'g' | 'ml' | '개' // 레시피 분량과 판매 단위가 모두 이 단위를 쓴다
  corner: Corner
  // D2 판매 단위. amount는 unit 기준 양
  saleUnit: { amount: number; label: string }
  // A8 안 먹는 단백질 필터용. 이 재료가 들어간 레시피는 해당 단백질을 뺄 때 제외한다
  protein?: ProteinSource
}

export const ingredients = {
  greenOnion: { name: '대파', unit: 'g', corner: '채소', saleUnit: { amount: 300, label: '1봉(300g)' } },
  onion: { name: '양파', unit: 'g', corner: '채소', saleUnit: { amount: 600, label: '1망(600g)' } },
  garlic: { name: '다진 마늘', unit: 'g', corner: '채소', saleUnit: { amount: 200, label: '1팩(200g)' } },
  carrot: { name: '당근', unit: 'g', corner: '채소', saleUnit: { amount: 300, label: '1봉(300g)' } },
  zucchini: { name: '애호박', unit: 'g', corner: '채소', saleUnit: { amount: 300, label: '1개(300g)' } },
  potato: { name: '감자', unit: 'g', corner: '채소', saleUnit: { amount: 600, label: '1봉(600g)' } },
  cabbage: { name: '양배추', unit: 'g', corner: '채소', saleUnit: { amount: 500, label: '1/4통(500g)' } },
  broccoli: { name: '브로콜리', unit: 'g', corner: '채소', saleUnit: { amount: 300, label: '1송이(300g)' } },
  kimchi: { name: '배추김치', unit: 'g', corner: '채소', saleUnit: { amount: 500, label: '1봉(500g)' } },
  porkShoulder: { name: '돼지고기 앞다리살', unit: 'g', corner: '육류·달걀', saleUnit: { amount: 600, label: '1팩(600g)' }, protein: 'pork' },
  beefBulgogi: { name: '소고기 불고기용', unit: 'g', corner: '육류·달걀', saleUnit: { amount: 400, label: '1팩(400g)' }, protein: 'beef' },
  chickenBreast: { name: '닭가슴살', unit: 'g', corner: '육류·달걀', saleUnit: { amount: 500, label: '1팩(500g)' }, protein: 'chicken' },
  egg: { name: '달걀', unit: '개', corner: '육류·달걀', saleUnit: { amount: 10, label: '10구' }, protein: 'egg' },
  mackerel: { name: '손질 고등어', unit: 'g', corner: '수산', saleUnit: { amount: 400, label: '1팩(2마리, 400g)' }, protein: 'fish' },
  tofu: { name: '두부', unit: 'g', corner: '두부·콩', saleUnit: { amount: 300, label: '1모(300g)' }, protein: 'tofu' },
  cookedRice: { name: '즉석밥', unit: '개', corner: '곡류', saleUnit: { amount: 3, label: '3개입' } },
  soySauce: { name: '간장', unit: 'ml', corner: '양념', saleUnit: { amount: 500, label: '1병(500ml)' } },
  gochujang: { name: '고추장', unit: 'g', corner: '양념', saleUnit: { amount: 500, label: '1통(500g)' } },
  doenjang: { name: '된장', unit: 'g', corner: '양념', saleUnit: { amount: 500, label: '1통(500g)' } },
  chiliPowder: { name: '고춧가루', unit: 'g', corner: '양념', saleUnit: { amount: 200, label: '1봉(200g)' } },
  sesameOil: { name: '참기름', unit: 'ml', corner: '양념', saleUnit: { amount: 160, label: '1병(160ml)' } },
  sugar: { name: '설탕', unit: 'g', corner: '양념', saleUnit: { amount: 1000, label: '1봉(1kg)' } },
} satisfies Record<string, Ingredient>

export type IngredientId = keyof typeof ingredients
