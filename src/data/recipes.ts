// H1 레시피 데이터. 조리 단계는 직접 작성했고 외부 글을 옮기지 않았다.
// 영양정보는 검수 전 추정치다(verified: false). H3 공공 식품 성분 자료로 다시 계산한다.
import type { IngredientId } from './ingredients'

// B6 단백질 공급원 분산용
export type ProteinSource = 'pork' | 'beef' | 'chicken' | 'fish' | 'seafood' | 'tofu' | 'egg' | 'legume'

export type Recipe = {
  id: string
  name: string
  korean: boolean // A5 한식 분류. 고단백은 태그 없이 영양정보로 판정한다(B4)
  proteinSource: ProteinSource
  // C1 1인분 기준 분량. amount는 재료 사전의 unit 기준
  ingredients: { id: IngredientId; amount: number }[]
  steps: string[]
  cookMinutes: number
  // C2 1인분 영양정보. 나트륨만 mg, 나머지는 g
  nutrition: {
    kcal: number
    carbsG: number
    proteinG: number
    fatG: number
    saturatedFatG: number
    sugarG: number
    sodiumMg: number
  }
  // C4 보관 정보
  storage: { freezable: boolean; fridgeDays: number }
  verified: boolean // 사람 검수 여부
}

export const recipes: Recipe[] = [
  {
    id: 'spicy-pork',
    name: '돼지고기 고추장볶음',
    korean: true,
    proteinSource: 'pork',
    ingredients: [
      { id: 'porkShoulder', amount: 150 },
      { id: 'onion', amount: 50 },
      { id: 'greenOnion', amount: 30 },
      { id: 'garlic', amount: 10 },
      { id: 'gochujang', amount: 20 },
      { id: 'soySauce', amount: 10 },
      { id: 'chiliPowder', amount: 5 },
      { id: 'sugar', amount: 5 },
      { id: 'sesameOil', amount: 5 },
    ],
    steps: [
      '고추장, 간장, 고춧가루, 설탕, 다진 마늘을 섞어 양념을 만든다.',
      '돼지고기를 한입 크기로 썰어 양념에 버무리고 10분 둔다.',
      '양파는 굵게 채 썰고 대파는 어슷하게 썬다.',
      '달군 팬에 고기를 넣고 중불에서 속까지 익을 때까지 볶는다.',
      '양파와 대파를 넣어 숨이 죽을 만큼만 더 볶고 불을 끈 뒤 참기름을 두른다.',
    ],
    cookMinutes: 25,
    nutrition: { kcal: 480, carbsG: 22, proteinG: 32, fatG: 28, saturatedFatG: 9, sugarG: 12, sodiumMg: 1100 },
    storage: { freezable: true, fridgeDays: 3 },
    verified: false,
  },
  {
    id: 'beef-bulgogi',
    name: '소고기 불고기',
    korean: true,
    proteinSource: 'beef',
    ingredients: [
      { id: 'beefBulgogi', amount: 150 },
      { id: 'onion', amount: 50 },
      { id: 'greenOnion', amount: 20 },
      { id: 'carrot', amount: 30 },
      { id: 'garlic', amount: 10 },
      { id: 'soySauce', amount: 20 },
      { id: 'sugar', amount: 8 },
      { id: 'sesameOil', amount: 5 },
    ],
    steps: [
      '간장, 설탕, 다진 마늘, 참기름을 섞어 양념을 만든다.',
      '소고기의 핏물을 키친타월로 누르고 양념에 20분 재운다.',
      '양파와 당근은 채 썰고 대파는 어슷하게 썬다.',
      '팬에 고기와 채소를 함께 넣고 센 불에서 국물이 졸아들 때까지 볶는다.',
    ],
    cookMinutes: 30,
    nutrition: { kcal: 450, carbsG: 20, proteinG: 31, fatG: 26, saturatedFatG: 10, sugarG: 13, sodiumMg: 1200 },
    storage: { freezable: true, fridgeDays: 3 },
    verified: false,
  },
  {
    id: 'soy-chicken',
    name: '닭가슴살 간장조림',
    korean: true,
    proteinSource: 'chicken',
    ingredients: [
      { id: 'chickenBreast', amount: 180 },
      { id: 'onion', amount: 40 },
      { id: 'greenOnion', amount: 20 },
      { id: 'garlic', amount: 10 },
      { id: 'broccoli', amount: 80 },
      { id: 'soySauce', amount: 20 },
      { id: 'sugar', amount: 5 },
    ],
    steps: [
      '닭가슴살을 2cm 크기로 깍둑썰기 한다.',
      '브로콜리는 작은 송이로 나눠 끓는 물에 1분 데친다.',
      '냄비에 간장, 설탕, 다진 마늘, 물 100ml를 넣고 끓인다.',
      '닭고기와 양파를 넣고 중약불에서 국물이 자작해질 때까지 10분 조린다.',
      '브로콜리와 대파를 넣고 한 번 뒤적여 마무리한다.',
    ],
    cookMinutes: 25,
    nutrition: { kcal: 330, carbsG: 16, proteinG: 44, fatG: 5, saturatedFatG: 1, sugarG: 9, sodiumMg: 1150 },
    storage: { freezable: true, fridgeDays: 3 },
    verified: false,
  },
  {
    id: 'mackerel-kimchi',
    name: '고등어 김치조림',
    korean: true,
    proteinSource: 'fish',
    ingredients: [
      { id: 'mackerel', amount: 150 },
      { id: 'kimchi', amount: 100 },
      { id: 'onion', amount: 40 },
      { id: 'greenOnion', amount: 20 },
      { id: 'garlic', amount: 10 },
      { id: 'chiliPowder', amount: 5 },
      { id: 'soySauce', amount: 10 },
    ],
    steps: [
      '고등어를 흐르는 물에 헹구고 3등분 한다.',
      '냄비 바닥에 김치를 깔고 그 위에 고등어를 올린다.',
      '간장, 고춧가루, 다진 마늘을 물 200ml에 풀어 붓는다.',
      '뚜껑을 덮고 중불에서 15분 끓이다가 양파와 대파를 넣고 5분 더 졸인다.',
    ],
    cookMinutes: 30,
    nutrition: { kcal: 420, carbsG: 12, proteinG: 31, fatG: 27, saturatedFatG: 6, sugarG: 6, sodiumMg: 1400 },
    storage: { freezable: true, fridgeDays: 2 },
    verified: false,
  },
  {
    id: 'tofu-doenjang-stew',
    name: '두부 된장찌개',
    korean: true,
    proteinSource: 'tofu',
    ingredients: [
      { id: 'tofu', amount: 150 },
      { id: 'zucchini', amount: 60 },
      { id: 'potato', amount: 60 },
      { id: 'onion', amount: 40 },
      { id: 'greenOnion', amount: 15 },
      { id: 'garlic', amount: 5 },
      { id: 'doenjang', amount: 25 },
    ],
    steps: [
      '감자, 애호박, 양파, 두부를 한입 크기로 썬다.',
      '냄비에 물 400ml와 된장을 풀고 감자를 넣어 끓인다.',
      '감자가 반쯤 익으면 애호박, 양파, 다진 마늘을 넣는다.',
      '두부를 넣고 5분 더 끓인 뒤 대파를 올린다.',
    ],
    cookMinutes: 25,
    nutrition: { kcal: 280, carbsG: 26, proteinG: 18, fatG: 11, saturatedFatG: 2, sugarG: 6, sodiumMg: 1300 },
    storage: { freezable: false, fridgeDays: 3 },
    verified: false,
  },
  {
    id: 'zucchini-egg-bowl',
    name: '애호박 달걀덮밥',
    korean: true,
    proteinSource: 'egg',
    ingredients: [
      { id: 'egg', amount: 2 },
      { id: 'zucchini', amount: 100 },
      { id: 'onion', amount: 40 },
      { id: 'greenOnion', amount: 15 },
      { id: 'soySauce', amount: 10 },
      { id: 'sesameOil', amount: 5 },
      { id: 'cookedRice', amount: 1 },
    ],
    steps: [
      '애호박은 반달 모양으로, 양파는 채 썬다.',
      '팬에 양파와 애호박을 볶다가 간장으로 간한다.',
      '달걀을 풀어 팬 한쪽에 붓고 저어 가며 반쯤 익힌 뒤 채소와 섞는다.',
      '데운 밥 위에 올리고 대파와 참기름을 뿌린다.',
    ],
    cookMinutes: 15,
    nutrition: { kcal: 520, carbsG: 74, proteinG: 19, fatG: 16, saturatedFatG: 4, sugarG: 6, sodiumMg: 800 },
    storage: { freezable: false, fridgeDays: 2 },
    verified: false,
  },
  {
    id: 'chicken-cabbage-rice',
    name: '닭가슴살 양배추볶음밥',
    korean: false,
    proteinSource: 'chicken',
    ingredients: [
      { id: 'chickenBreast', amount: 150 },
      { id: 'cookedRice', amount: 1 },
      { id: 'cabbage', amount: 80 },
      { id: 'carrot', amount: 30 },
      { id: 'egg', amount: 1 },
      { id: 'greenOnion', amount: 15 },
      { id: 'soySauce', amount: 10 },
    ],
    steps: [
      '닭가슴살, 양배추, 당근을 잘게 썬다.',
      '팬에 대파를 볶아 향을 낸 뒤 닭고기를 넣어 익힌다.',
      '양배추와 당근을 넣고 숨이 죽을 때까지 볶는다.',
      '밥을 넣고 간장으로 간한 뒤 달걀을 깨 넣어 고루 섞으며 익힌다.',
    ],
    cookMinutes: 20,
    nutrition: { kcal: 590, carbsG: 72, proteinG: 46, fatG: 10, saturatedFatG: 3, sugarG: 5, sodiumMg: 750 },
    storage: { freezable: true, fridgeDays: 3 },
    verified: false,
  },
  {
    id: 'beef-broccoli',
    name: '소고기 브로콜리볶음',
    korean: false,
    proteinSource: 'beef',
    ingredients: [
      { id: 'beefBulgogi', amount: 150 },
      { id: 'broccoli', amount: 100 },
      { id: 'onion', amount: 40 },
      { id: 'garlic', amount: 10 },
      { id: 'soySauce', amount: 15 },
      { id: 'sesameOil', amount: 5 },
    ],
    steps: [
      '브로콜리는 작은 송이로 나누고 양파는 굵게 썬다.',
      '팬에 다진 마늘을 볶다가 소고기를 넣어 센 불에서 겉면을 익힌다.',
      '브로콜리와 양파, 물 2큰술을 넣고 뚜껑을 덮어 2분 익힌다.',
      '간장을 둘러 볶고 불을 끈 뒤 참기름을 넣는다.',
    ],
    cookMinutes: 15,
    nutrition: { kcal: 420, carbsG: 14, proteinG: 33, fatG: 25, saturatedFatG: 9, sugarG: 5, sodiumMg: 950 },
    storage: { freezable: true, fridgeDays: 3 },
    verified: false,
  },
]
