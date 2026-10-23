// H2 표준 재료 사전. 레시피와 장보기 목록은 이 id로만 재료를 가리킨다.

// D5 매장 코너
export type Corner = '채소' | '육류·달걀' | '수산' | '두부·콩' | '곡류' | '양념'
export const CORNERS: Corner[] = ['채소', '육류·달걀', '수산', '두부·콩', '곡류', '양념']

export type Ingredient = {
  name: string
  unit: 'g' | 'ml' | '개' // 레시피 분량과 판매 단위가 모두 이 단위를 쓴다
  corner: Corner
  // D2 판매 단위. 쿠팡에서 많이 파는 포장 단위에 맞춘다. amount는 unit 기준 양
  saleUnit: { amount: number; label: string }
  // G1 쿠팡 검색어. 판매 단위까지 넣어 그 단위 상품이 위에 나오게 한다
  coupangQuery: string
  // G4 직접 골라 고정한 쿠팡 상품 주소. 있으면 검색 대신 이 상품으로 연결한다
  coupangUrl?: string
  premium?: string // B1 '한 주 플렉스'에서 고급 재료로 보는 재료와 화면에 쓸 짧은 이름
}

export const ingredients = {
  greenOnion: { name: '대파', unit: 'g', corner: '채소', saleUnit: { amount: 500, label: '1단(약 500g)' }, coupangQuery: '대파 1단' },
  onion: { name: '양파', unit: 'g', corner: '채소', saleUnit: { amount: 1000, label: '1망(1kg)' }, coupangQuery: '국내산 양파 1kg' },
  garlic: { name: '다진 마늘', unit: 'g', corner: '채소', saleUnit: { amount: 200, label: '1팩(200g)' }, coupangQuery: '다진마늘 200g' },
  carrot: { name: '당근', unit: 'g', corner: '채소', saleUnit: { amount: 500, label: '1봉(500g)' }, coupangQuery: '세척 당근 500g' },
  zucchini: { name: '애호박', unit: 'g', corner: '채소', saleUnit: { amount: 300, label: '1개(300g)' }, coupangQuery: '애호박 1개' },
  potato: { name: '감자', unit: 'g', corner: '채소', saleUnit: { amount: 1000, label: '1봉(1kg)' }, coupangQuery: '국내산 감자 1kg' },
  sweetPotato: { name: '고구마', unit: 'g', corner: '채소', saleUnit: { amount: 1000, label: '1봉(1kg)' }, coupangQuery: '고구마 1kg' },
  tomato: { name: '토마토', unit: 'g', corner: '채소', saleUnit: { amount: 1000, label: '1팩(1kg)' }, coupangQuery: '토마토 1kg' },
  cabbage: { name: '양배추', unit: 'g', corner: '채소', saleUnit: { amount: 1000, label: '1/2통(약 1kg)' }, coupangQuery: '양배추 1/2통' },
  broccoli: { name: '브로콜리', unit: 'g', corner: '채소', saleUnit: { amount: 300, label: '1송이(300g)' }, coupangQuery: '브로콜리 1송이' },
  kimchi: { name: '배추김치', unit: 'g', corner: '채소', saleUnit: { amount: 500, label: '1봉(500g)' }, coupangQuery: '배추김치 500g' },
  spinach: { name: '시금치', unit: 'g', corner: '채소', saleUnit: { amount: 200, label: '1단(200g)' }, coupangQuery: '시금치 1단' },
  kingOysterMushroom: { name: '새송이버섯', unit: 'g', corner: '채소', saleUnit: { amount: 400, label: '1봉(400g)' }, coupangQuery: '새송이버섯 400g' },
  beanSprouts: { name: '콩나물', unit: 'g', corner: '채소', saleUnit: { amount: 300, label: '1봉(300g)' }, coupangQuery: '콩나물 300g' },
  radish: { name: '무', unit: 'g', corner: '채소', saleUnit: { amount: 800, label: '1/2개(800g)' }, coupangQuery: '무 1/2개' },
  eggplant: { name: '가지', unit: 'g', corner: '채소', saleUnit: { amount: 300, label: '2개입(300g)' }, coupangQuery: '가지 2개' },
  cheongyangPepper: { name: '청양고추', unit: 'g', corner: '채소', saleUnit: { amount: 100, label: '1봉(100g)' }, coupangQuery: '청양고추 100g' },
  porkShoulder: { name: '돼지고기 앞다리살', unit: 'g', corner: '육류·달걀', saleUnit: { amount: 500, label: '1팩(500g)' }, coupangQuery: '돼지 앞다리살 500g' },
  porkTenderloin: { name: '돼지고기 안심', unit: 'g', corner: '육류·달걀', saleUnit: { amount: 500, label: '1팩(500g)' }, coupangQuery: '돼지 안심 500g' },
  beefBulgogi: { name: '소고기 불고기용', unit: 'g', corner: '육류·달걀', saleUnit: { amount: 500, label: '1팩(500g)' }, premium: '소고기', coupangQuery: '소고기 불고기용 500g' },
  beefRound: { name: '소고기 우둔', unit: 'g', corner: '육류·달걀', saleUnit: { amount: 400, label: '1팩(400g)' }, premium: '소고기', coupangQuery: '소고기 우둔 400g' },
  chickenBreast: { name: '닭가슴살', unit: 'g', corner: '육류·달걀', saleUnit: { amount: 1000, label: '1팩(1kg)' }, coupangQuery: '닭가슴살 냉장 1kg' },
  egg: { name: '달걀', unit: '개', corner: '육류·달걀', saleUnit: { amount: 15, label: '15구' }, coupangQuery: '계란 15구' },
  mackerel: { name: '손질 고등어', unit: 'g', corner: '수산', saleUnit: { amount: 400, label: '1팩(2마리, 400g)' }, coupangQuery: '손질 고등어' },
  pollock: { name: '손질 동태', unit: 'g', corner: '수산', saleUnit: { amount: 600, label: '1팩(600g)' }, coupangQuery: '손질 동태 600g' },
  salmon: { name: '생연어', unit: 'g', corner: '수산', saleUnit: { amount: 300, label: '1팩(300g)' }, premium: '연어', coupangQuery: '생연어 300g' },
  tunaCan: { name: '참치캔', unit: '개', corner: '수산', saleUnit: { amount: 3, label: '3캔입(150g)' }, coupangQuery: '참치캔 3입' },
  squid: { name: '손질 오징어', unit: 'g', corner: '수산', saleUnit: { amount: 500, label: '1팩(2마리, 500g)' }, coupangQuery: '손질 오징어' },
  shrimp: { name: '냉동 새우살', unit: 'g', corner: '수산', saleUnit: { amount: 500, label: '1봉(500g)' }, premium: '새우', coupangQuery: '냉동 새우살 500g' },
  tofu: { name: '두부', unit: 'g', corner: '두부·콩', saleUnit: { amount: 300, label: '1모(300g)' }, coupangQuery: '부침두부 300g' },
  softTofu: { name: '순두부', unit: 'g', corner: '두부·콩', saleUnit: { amount: 350, label: '1봉(350g)' }, coupangQuery: '순두부 350g' },
  chickpeas: { name: '병아리콩 통조림', unit: 'g', corner: '두부·콩', saleUnit: { amount: 240, label: '1캔(건더기 240g)' }, coupangQuery: '병아리콩 통조림' },
  pasta: { name: '스파게티면', unit: 'g', corner: '곡류', saleUnit: { amount: 500, label: '1봉(500g)' }, coupangQuery: '스파게티면 500g' },
  udon: { name: '우동면', unit: '개', corner: '곡류', saleUnit: { amount: 3, label: '3개입(1개 200g)' }, coupangQuery: '우동사리 3입' },
  soySauce: { name: '간장', unit: 'ml', corner: '양념', saleUnit: { amount: 500, label: '1병(500ml)' }, coupangQuery: '진간장 500ml' },
  gochujang: { name: '고추장', unit: 'g', corner: '양념', saleUnit: { amount: 500, label: '1통(500g)' }, coupangQuery: '고추장 500g' },
  doenjang: { name: '된장', unit: 'g', corner: '양념', saleUnit: { amount: 500, label: '1통(500g)' }, coupangQuery: '된장 500g' },
  chiliPowder: { name: '고춧가루', unit: 'g', corner: '양념', saleUnit: { amount: 200, label: '1봉(200g)' }, coupangQuery: '고춧가루 200g' },
  sesameOil: { name: '참기름', unit: 'ml', corner: '양념', saleUnit: { amount: 320, label: '1병(320ml)' }, coupangQuery: '참기름 320ml' },
  allulose: { name: '알룰로스', unit: 'g', corner: '양념', saleUnit: { amount: 500, label: '1병(500g)' }, coupangQuery: '알룰로스 500g' },
  salt: { name: '소금', unit: 'g', corner: '양념', saleUnit: { amount: 500, label: '1봉(500g)' }, coupangQuery: '꽃소금 500g' },
  blackPepper: { name: '후추', unit: 'g', corner: '양념', saleUnit: { amount: 50, label: '1통(50g)' }, coupangQuery: '순후추 50g' },
  cookingOil: { name: '식용유', unit: 'ml', corner: '양념', saleUnit: { amount: 900, label: '1병(900ml)' }, coupangQuery: '식용유 900ml' },
  oliveOil: { name: '올리브유', unit: 'ml', corner: '양념', saleUnit: { amount: 500, label: '1병(500ml)' }, coupangQuery: '올리브유 500ml' },
  perillaOil: { name: '들기름', unit: 'ml', corner: '양념', saleUnit: { amount: 160, label: '1병(160ml)' }, coupangQuery: '들기름 160ml' },
  sesameSeeds: { name: '통깨', unit: 'g', corner: '양념', saleUnit: { amount: 100, label: '1봉(100g)' }, coupangQuery: '통깨 100g' },
  vinegar: { name: '식초', unit: 'ml', corner: '양념', saleUnit: { amount: 500, label: '1병(500ml)' }, coupangQuery: '식초 500ml' },
  mirin: { name: '맛술', unit: 'ml', corner: '양념', saleUnit: { amount: 500, label: '1병(500ml)' }, coupangQuery: '미림 500ml' },
  oligosaccharide: { name: '올리고당', unit: 'g', corner: '양념', saleUnit: { amount: 700, label: '1병(700g)' }, coupangQuery: '올리고당 700g' },
  oysterSauce: { name: '굴소스', unit: 'g', corner: '양념', saleUnit: { amount: 350, label: '1병(350g)' }, coupangQuery: '굴소스 350g' },
  fishSauce: { name: '멸치액젓', unit: 'ml', corner: '양념', saleUnit: { amount: 500, label: '1병(500ml)' }, coupangQuery: '멸치액젓 500ml' },
  plumSyrup: { name: '매실청', unit: 'ml', corner: '양념', saleUnit: { amount: 1000, label: '1병(1L)' }, coupangQuery: '매실청 1L' },
  tunaSauce: { name: '참치액', unit: 'ml', corner: '양념', saleUnit: { amount: 500, label: '1병(500ml)' }, coupangQuery: '참치액 500ml' },
  butter: { name: '버터', unit: 'g', corner: '양념', saleUnit: { amount: 450, label: '1개(450g)' }, coupangQuery: '버터 450g' },
  ketchup: { name: '케첩', unit: 'g', corner: '양념', saleUnit: { amount: 500, label: '1통(500g)' }, coupangQuery: '케첩 500g' },
  mayonnaise: { name: '마요네즈', unit: 'g', corner: '양념', saleUnit: { amount: 500, label: '1통(500g)' }, coupangQuery: '마요네즈 500g' },
  mustard: { name: '머스터드', unit: 'g', corner: '양념', saleUnit: { amount: 200, label: '1병(200g)' }, coupangQuery: '머스터드 200g' },
  balsamic: { name: '발사믹 식초', unit: 'ml', corner: '양념', saleUnit: { amount: 250, label: '1병(250ml)' }, coupangQuery: '발사믹 식초 250ml' },
  honey: { name: '꿀', unit: 'g', corner: '양념', saleUnit: { amount: 500, label: '1병(500g)' }, coupangQuery: '꿀 500g' },
  basil: { name: '바질(건조)', unit: 'g', corner: '양념', saleUnit: { amount: 10, label: '1병(10g)' }, coupangQuery: '바질 가루' },
  oregano: { name: '오레가노', unit: 'g', corner: '양념', saleUnit: { amount: 10, label: '1병(10g)' }, coupangQuery: '오레가노 가루' },
  paprikaPowder: { name: '파프리카 가루', unit: 'g', corner: '양념', saleUnit: { amount: 50, label: '1병(50g)' }, coupangQuery: '파프리카 가루' },
  chickenStock: { name: '치킨스톡', unit: 'g', corner: '양념', saleUnit: { amount: 100, label: '1통(100g)' }, coupangQuery: '치킨스톡' },
} satisfies Record<string, Ingredient>

export type IngredientId = keyof typeof ingredients
