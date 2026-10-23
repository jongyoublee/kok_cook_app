// H3 재료별 영양값. 레시피 영양정보(C2)는 이 값과 재료 분량으로 계산한다.
// 식약처 식품영양성분 DB 수준으로 추정한 임시값이다. 공공 자료를 확인한 뒤 이 파일만 바꾸면 된다.
// 기준량: unit이 g·ml인 재료는 100g(100ml)당, 개인 재료는 1개당. 먹는 상태 기준
// (참치캔은 기름을 따라낸 건더기, 병아리콩은 삶은 것, 우동면은 1개 200g)
import type { IngredientId } from './ingredients'

export type NutritionFacts = {
  kcal: number
  carbsG: number
  proteinG: number
  fatG: number
  saturatedFatG: number
  sugarG: number
  sodiumMg: number
}

const f = (kcal: number, carbsG: number, proteinG: number, fatG: number, saturatedFatG: number, sugarG: number, sodiumMg: number): NutritionFacts => ({
  kcal,
  carbsG,
  proteinG,
  fatG,
  saturatedFatG,
  sugarG,
  sodiumMg,
})

// 순서: kcal, 탄수화물, 단백질, 지방, 포화지방, 당류(g), 나트륨(mg)
export const NUTRITION_PER = {
  greenOnion: f(27, 6.2, 1.6, 0.3, 0.1, 2.4, 4),
  onion: f(37, 8.6, 1, 0.1, 0, 5, 3),
  garlic: f(130, 28, 6.5, 0.2, 0, 1.5, 10),
  carrot: f(37, 8.5, 0.9, 0.2, 0, 4.5, 40),
  zucchini: f(20, 4.3, 1.2, 0.2, 0, 2.4, 2),
  potato: f(72, 16.5, 1.9, 0.1, 0, 0.6, 3),
  sweetPotato: f(128, 30.3, 1.4, 0.2, 0, 6.6, 15),
  tomato: f(19, 4, 0.9, 0.2, 0, 2.6, 5),
  cabbage: f(26, 5.6, 1.3, 0.1, 0, 3.2, 10),
  broccoli: f(34, 6.6, 2.8, 0.4, 0.1, 1.7, 30),
  kimchi: f(18, 3.2, 1.5, 0.4, 0.1, 1.5, 650),
  spinach: f(23, 3.6, 2.9, 0.4, 0.1, 0.4, 80),
  kingOysterMushroom: f(35, 7.5, 2.5, 0.3, 0, 2, 3),
  porkShoulder: f(190, 0, 19.5, 12, 4.3, 0, 60),
  beefBulgogi: f(200, 0, 19, 13.5, 5.5, 0, 55),
  chickenBreast: f(109, 0, 23, 1.2, 0.3, 0, 45),
  egg: f(72, 0.4, 6.2, 4.8, 1.5, 0.2, 70),
  mackerel: f(205, 0, 19, 14, 3.5, 0, 80),
  salmon: f(180, 0, 20, 11, 2.5, 0, 50),
  tunaCan: f(160, 0, 24, 7, 1.5, 0, 380),
  squid: f(87, 2, 17.5, 1, 0.3, 0, 250),
  shrimp: f(85, 0.5, 19, 1, 0.3, 0, 350),
  tofu: f(84, 2.4, 9.3, 4.6, 0.7, 0.5, 5),
  softTofu: f(47, 2, 5, 2.5, 0.4, 0.3, 10),
  chickpeas: f(140, 23, 7.5, 2.2, 0.2, 4, 250),
  pasta: f(360, 74, 13, 1.5, 0.3, 3, 5),
  udon: f(260, 54, 7, 1, 0.2, 1, 600),
  soySauce: f(60, 8, 6, 0, 0, 4, 5700),
  gochujang: f(220, 45, 4, 1.5, 0.3, 25, 2400),
  doenjang: f(170, 15, 12, 6, 1, 2, 4300),
  chiliPowder: f(320, 55, 13, 11, 1.7, 25, 30),
  sesameOil: f(828, 0, 0, 92, 13, 0, 0),
  sugar: f(387, 99.9, 0, 0, 0, 99.9, 0),
  salt: f(0, 0, 0, 0, 0, 0, 38700),
  blackPepper: f(255, 64, 11, 3.3, 1, 0.6, 40),
  cookingOil: f(820, 0, 0, 92, 10, 0, 0),
  oliveOil: f(820, 0, 0, 92, 13, 0, 0),
  perillaOil: f(828, 0, 0, 92, 8, 0, 0),
  sesameSeeds: f(570, 17, 18, 50, 7, 0.3, 10),
  vinegar: f(20, 2, 0, 0, 0, 0.5, 5),
  mirin: f(180, 40, 0.3, 0, 0, 30, 400),
  oligosaccharide: f(290, 76, 0, 0, 0, 30, 5),
  oysterSauce: f(110, 23, 3, 0.3, 0, 15, 4000),
  fishSauce: f(50, 1, 10, 0, 0, 0, 8500),
  plumSyrup: f(250, 62, 0.2, 0, 0, 58, 10),
  tunaSauce: f(60, 6, 8, 0, 0, 3, 6800),
  butter: f(745, 0.6, 0.6, 82, 52, 0.6, 650),
  ketchup: f(110, 26, 1.5, 0.2, 0, 23, 900),
  mayonnaise: f(700, 1.5, 1.5, 77, 8, 1, 600),
  mustard: f(100, 8, 5, 5, 0.4, 4, 1100),
  balsamic: f(90, 18, 0.5, 0, 0, 15, 25),
  honey: f(300, 82, 0.3, 0, 0, 80, 5),
  basil: f(230, 48, 23, 4, 2, 1.7, 75),
  oregano: f(265, 69, 9, 4, 1.6, 4, 25),
  paprikaPowder: f(280, 54, 14, 13, 2, 10, 70),
  chickenStock: f(230, 30, 10, 7, 3, 10, 20000),
} satisfies Record<IngredientId, NutritionFacts>

// C2 밥과 함께 먹는 메뉴에 더하는 쌀밥 100g당 영양값. 양은 config.riceWithMeal.grams
export const RICE_PER_100G = f(145, 32, 2.6, 0.3, 0.1, 0, 2)
