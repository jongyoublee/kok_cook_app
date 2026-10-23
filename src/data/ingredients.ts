// H2 표준 재료 사전. 레시피와 장보기 목록은 이 id로만 재료를 가리킨다.

// D5 매장 코너
export type Corner = '채소' | '육류·달걀' | '수산' | '두부·콩' | '곡류' | '양념'
export const CORNERS: Corner[] = ['채소', '육류·달걀', '수산', '두부·콩', '곡류', '양념']

export type Ingredient = {
  name: string
  unit: 'g' | 'ml' | '개' // 레시피 분량과 판매 단위가 모두 이 단위를 쓴다
  corner: Corner
  // D2 판매 단위. amount는 unit 기준 양
  saleUnit: { amount: number; label: string }
}

export const ingredients = {
  greenOnion: { name: '대파', unit: 'g', corner: '채소', saleUnit: { amount: 300, label: '1봉(300g)' } },
  onion: { name: '양파', unit: 'g', corner: '채소', saleUnit: { amount: 600, label: '1망(600g)' } },
  garlic: { name: '다진 마늘', unit: 'g', corner: '채소', saleUnit: { amount: 200, label: '1팩(200g)' } },
  carrot: { name: '당근', unit: 'g', corner: '채소', saleUnit: { amount: 300, label: '1봉(300g)' } },
  zucchini: { name: '애호박', unit: 'g', corner: '채소', saleUnit: { amount: 300, label: '1개(300g)' } },
  potato: { name: '감자', unit: 'g', corner: '채소', saleUnit: { amount: 600, label: '1봉(600g)' } },
  sweetPotato: { name: '고구마', unit: 'g', corner: '채소', saleUnit: { amount: 1000, label: '1봉(1kg)' } },
  tomato: { name: '토마토', unit: 'g', corner: '채소', saleUnit: { amount: 500, label: '1팩(500g)' } },
  cabbage: { name: '양배추', unit: 'g', corner: '채소', saleUnit: { amount: 500, label: '1/4통(500g)' } },
  broccoli: { name: '브로콜리', unit: 'g', corner: '채소', saleUnit: { amount: 300, label: '1송이(300g)' } },
  kimchi: { name: '배추김치', unit: 'g', corner: '채소', saleUnit: { amount: 500, label: '1봉(500g)' } },
  porkShoulder: { name: '돼지고기 앞다리살', unit: 'g', corner: '육류·달걀', saleUnit: { amount: 600, label: '1팩(600g)' } },
  beefBulgogi: { name: '소고기 불고기용', unit: 'g', corner: '육류·달걀', saleUnit: { amount: 400, label: '1팩(400g)' } },
  chickenBreast: { name: '닭가슴살', unit: 'g', corner: '육류·달걀', saleUnit: { amount: 500, label: '1팩(500g)' } },
  egg: { name: '달걀', unit: '개', corner: '육류·달걀', saleUnit: { amount: 10, label: '10구' } },
  mackerel: { name: '손질 고등어', unit: 'g', corner: '수산', saleUnit: { amount: 400, label: '1팩(2마리, 400g)' } },
  tofu: { name: '두부', unit: 'g', corner: '두부·콩', saleUnit: { amount: 300, label: '1모(300g)' } },
  cookedRice: { name: '즉석밥', unit: '개', corner: '곡류', saleUnit: { amount: 3, label: '3개입' } },
  pasta: { name: '스파게티면', unit: 'g', corner: '곡류', saleUnit: { amount: 500, label: '1봉(500g)' } },
  soySauce: { name: '간장', unit: 'ml', corner: '양념', saleUnit: { amount: 500, label: '1병(500ml)' } },
  gochujang: { name: '고추장', unit: 'g', corner: '양념', saleUnit: { amount: 500, label: '1통(500g)' } },
  doenjang: { name: '된장', unit: 'g', corner: '양념', saleUnit: { amount: 500, label: '1통(500g)' } },
  chiliPowder: { name: '고춧가루', unit: 'g', corner: '양념', saleUnit: { amount: 200, label: '1봉(200g)' } },
  sesameOil: { name: '참기름', unit: 'ml', corner: '양념', saleUnit: { amount: 160, label: '1병(160ml)' } },
  sugar: { name: '설탕', unit: 'g', corner: '양념', saleUnit: { amount: 1000, label: '1봉(1kg)' } },
  salt: { name: '소금', unit: 'g', corner: '양념', saleUnit: { amount: 500, label: '1봉(500g)' } },
  blackPepper: { name: '후추', unit: 'g', corner: '양념', saleUnit: { amount: 50, label: '1통(50g)' } },
  cookingOil: { name: '식용유', unit: 'ml', corner: '양념', saleUnit: { amount: 900, label: '1병(900ml)' } },
  oliveOil: { name: '올리브유', unit: 'ml', corner: '양념', saleUnit: { amount: 500, label: '1병(500ml)' } },
  perillaOil: { name: '들기름', unit: 'ml', corner: '양념', saleUnit: { amount: 160, label: '1병(160ml)' } },
  sesameSeeds: { name: '통깨', unit: 'g', corner: '양념', saleUnit: { amount: 100, label: '1봉(100g)' } },
  vinegar: { name: '식초', unit: 'ml', corner: '양념', saleUnit: { amount: 500, label: '1병(500ml)' } },
  mirin: { name: '맛술', unit: 'ml', corner: '양념', saleUnit: { amount: 500, label: '1병(500ml)' } },
  oligosaccharide: { name: '올리고당', unit: 'g', corner: '양념', saleUnit: { amount: 700, label: '1병(700g)' } },
  oysterSauce: { name: '굴소스', unit: 'g', corner: '양념', saleUnit: { amount: 350, label: '1병(350g)' } },
  fishSauce: { name: '멸치액젓', unit: 'ml', corner: '양념', saleUnit: { amount: 500, label: '1병(500ml)' } },
  plumSyrup: { name: '매실청', unit: 'ml', corner: '양념', saleUnit: { amount: 1000, label: '1병(1L)' } },
  tunaSauce: { name: '참치액', unit: 'ml', corner: '양념', saleUnit: { amount: 500, label: '1병(500ml)' } },
  butter: { name: '버터', unit: 'g', corner: '양념', saleUnit: { amount: 450, label: '1개(450g)' } },
  ketchup: { name: '케첩', unit: 'g', corner: '양념', saleUnit: { amount: 500, label: '1통(500g)' } },
  mayonnaise: { name: '마요네즈', unit: 'g', corner: '양념', saleUnit: { amount: 500, label: '1통(500g)' } },
  mustard: { name: '머스터드', unit: 'g', corner: '양념', saleUnit: { amount: 200, label: '1병(200g)' } },
  balsamic: { name: '발사믹 식초', unit: 'ml', corner: '양념', saleUnit: { amount: 250, label: '1병(250ml)' } },
  honey: { name: '꿀', unit: 'g', corner: '양념', saleUnit: { amount: 500, label: '1병(500g)' } },
  basil: { name: '바질(건조)', unit: 'g', corner: '양념', saleUnit: { amount: 10, label: '1병(10g)' } },
  oregano: { name: '오레가노', unit: 'g', corner: '양념', saleUnit: { amount: 10, label: '1병(10g)' } },
  paprikaPowder: { name: '파프리카 가루', unit: 'g', corner: '양념', saleUnit: { amount: 50, label: '1병(50g)' } },
  chickenStock: { name: '치킨스톡', unit: 'g', corner: '양념', saleUnit: { amount: 100, label: '1통(100g)' } },
} satisfies Record<string, Ingredient>

export type IngredientId = keyof typeof ingredients
