// 설정값은 모두 여기서 읽는다 (CLAUDE.md "설정값으로 분리할 것").
export const config = {
  // B4 고단백 기준: 1인분 단백질 30g 이상, 600kcal 이하
  highProtein: { minProteinG: 30, maxKcal: 600 },
  // C2 밥과 함께 먹는 메뉴(베이스 탄수화물이 밥)는 영양정보에 쌀밥을 이만큼 더한다
  riceWithMeal: { grams: 150 },
  // A6 한 끼 칼로리 상한. 선택 구간 값은 미결
  maxKcalPerMeal: 600,
  // A4 메뉴 개수
  menuCount: { min: 1, default: 2, max: 5 },
  // A2 식사 날짜 최대 선택 기간 (제안 단계)
  maxSelectDays: 14,
  // A2 최대 기간 해석 (미결). span: 첫날~마지막 날 기간, count: 선택한 날짜 개수
  maxSelectMode: 'span' as 'span' | 'count',
  // F3 예산 버전: A는 예산 먼저, B는 예산 마지막. 주소에 ?budget=A 또는 B를 붙여 바꿔 볼 수 있다
  budgetVersion: 'A' as 'A' | 'B',
  // A7 예산 슬라이더 (원)
  budget: { min: 50_000, max: 300_000, step: 5_000, default: 100_000 },
  // E1 냉장·냉동 분배 방식 (미결). byDate: 날짜 기준안, byMealCount: 끼니 수 기준 초안
  storageSplit: 'byDate' as 'byDate' | 'byMealCount',
  // E4 식품 안전 수치. 공식 기준 확인 전 임시값이므로 화면에 임시값 표시를 붙인다
  foodSafety: {
    provisional: true,
    fridgeDays: 3, // 3일과 4일 중 미결
    fridgeMaxC: 5,
    freezerMaxC: -18,
  },
}
