// 설정값은 모두 여기서 읽는다 (CLAUDE.md "설정값으로 분리할 것").
export const config = {
  // B4 고단백 기준: 1인분 단백질 30g 이상, 600kcal 이하. 2026-10-23 식단 분류 삭제로 지금은 필터에 쓰지 않는다
  highProtein: { minProteinG: 30, maxKcal: 600 },
  // C2 밥과 함께 먹는 메뉴(베이스 탄수화물이 밥)는 영양정보에 쌀밥을 이만큼 더한다
  riceWithMeal: { grams: 150 },
  // A6 한 끼 칼로리 기준. 사용자가 고르지 않고 모든 레시피가 지킨다(2026-10-23)
  maxKcalPerMeal: 600,
  // B1 메뉴 조합 탐색. 조합 수가 maxCombos 이하면 모두 비교하고, 넘으면 탐욕 선택으로 돌아간다.
  // keep: 예산 계산(F1)에 넘길 상위 조합 수. missingSeasoningPenalty: 새로 살 양념 1종당 깎는 점수(A9)
  menuSearch: { maxCombos: 1_000_000, keep: 300, missingSeasoningPenalty: 0.01 },
  // 같은 조리법(볶음, 조림 등)은 메뉴 수의 이 비율(올림)까지. 0.5면 메뉴 2개는 서로 다르게, 3~4개는 2개까지
  maxSameMethodRatio: 0.5,
  // A4 메뉴 개수
  menuCount: { min: 1, default: 2, max: 5 },
  // A2 식사 날짜 최대 선택 기간 (제안 단계)
  maxSelectDays: 14,
  // A2 최대 기간 해석 (미결). span: 첫날~마지막 날 기간, count: 선택한 날짜 개수
  maxSelectMode: 'span' as 'span' | 'count',
  // F3 예산 버전: A는 예산 먼저, B는 예산 마지막. 주소에 ?budget=A 또는 B를 붙여 바꿔 볼 수 있다
  budgetVersion: 'A' as 'A' | 'B',
  // G2 쿠팡 파트너스를 쓸 때만 수수료 고지를 보인다
  coupang: { partners: false },
  // A7 예산 슬라이더 (원). 범위는 조건마다 계산한다: 최소는 가장 싼 조합 금액(step 단위 내림),
  // 최대는 그 금액 × maxMultiplier(step 단위 올림). 처음 값은 범위의 중간. 후보가 없을 때만 fallback 범위
  // cheapPool: 가장 싼 조합을 찾을 때 볼 레시피 수(혼자 만들 때 금액이 싼 순). 12개면 메뉴 5개도 792가지
  budget: { step: 5_000, maxMultiplier: 2.5, fallbackMin: 50_000, fallbackMax: 300_000, cheapPool: 12 },
  // E1 냉장·냉동 분배 방식 (미결). byDate: 날짜 기준안, byMealCount: 끼니 수 기준 초안
  storageSplit: 'byDate' as 'byDate' | 'byMealCount',
  // E4 식품 안전 수치. 공식 기준 확인 전 임시값이므로 화면에 임시값 표시를 붙인다
  foodSafety: {
    provisional: true,
    fridgeDays: 3, // 2026-10-23 3일로 확정. 식약처 공식 기준 확인 전이라 provisional은 유지
    fridgeMaxC: 5,
    freezerMaxC: -18,
  },
}
