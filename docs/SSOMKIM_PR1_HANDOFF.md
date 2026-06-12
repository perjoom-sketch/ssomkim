# SSOMKIM PR-1 HANDOFF — 캐릭터 렌더 + 상태머신 + L1 반응 로더

> 실행 도구: Windsurf (Claude Fable 5) — 이 PR은 단독 완결, 중간 핸드오프 없음
> 상위 문서: SSOMKIM_SPEC_v1.md
> **기준 구현: ssomkim.html (검증 완료 프로토타입) — 비주얼/모션/제스처 판정은 이 파일이 정답.**
> 프로토의 동작을 reactions.json 데이터 주도 구조로 재설계하는 것이 이 PR의 본질.
> 키비주얼 2장(양말 도둑 컷, 거실 등신대 컷) 첨부 — 색감/표정 비율의 최종 기준.

## 0. 제품 정의 (모든 판단 기준)

**"게임은 핑계고, 쏨킴가 콘텐츠다."**
구현 중 애매한 결정이 생기면 "쏨킴의 반응을 더 보고 싶게 만드는 쪽"을 선택.

## 1. PR-1 범위

### In
1. 쏨킴 캐릭터 SVG 렌더 (상태별 표정/포즈 전환) — ssomkim.html 비주얼 그대로
2. 감정 상태머신 (평온/짜증/분노/삐짐/화해) + 분노 시 역삼각 변신
3. L1 반응 시스템: JSON 정의 → 애니메이션+사운드+말풍선 실행
4. 제스처 4종 (프로토에서 검증 완료): 탭=찌르기(부위 판정: 머리/배/엉덩이), 길게=꼬집기, 빠른 문지르기=간지럼(참기→빵 터짐 2단계), 가로 휙=밀어 넘어뜨리기(버둥→탭 도움/방치 분기)
5. 삐짐 중 문지르기=쓰다듬기(화해 진입)
6. 빡침 게이지 (UI 포함)
7. PWA 기본 골격 (Vercel 배포 가능 상태)

### 검증된 판정/모션 수치 (프로토에서 확정, 변경 금지)
- 꼬집기 발동: 350ms 홀드 (이동 시 취소)
- 밀기: 가로 이동 >90px, 350ms 이내, |dx| > |dy|×1.3
- 간지럼: 에너지 누적식(이동속도 합산, 200ms마다 ×0.82 감쇠), 참기 진입 140, 빵 터짐 460
- 덩치감 모션: squash 0.45s / 출렁 1.5s / 숨쉬기 2.9s — 더 빠르게 하지 말 것 (작아 보임)
- 게이지: 찌르기 +8, 꼬집기 +14, 간지럼 +5, 방치 기상 +18, 도움 -10, 초당 -2 자연 감소

### Out (다음 PR — 절대 미리 구현하지 말 것)
- 새총/먹이 주기 (PR-2)
- AI 호출 일체 (PR-3)
- 코인/도감/카드 (PR-5+)

## 2. 스택/구조

- 순수 HTML/CSS/JS 단일 페이지 (프레임워크 없음, 빌드 없음) + SVG + Web Animations API + Web Audio 합성음
- 새 저장소/새 Vercel 프로젝트 (ThisOne과 완전 분리)
- localStorage만 사용. 서버/외부 API 호출 0건

```
/index.html
/css/main.css
/js/character.js     # SVG 파트 제어, 표정 세터
/js/statemachine.js  # 상태 전이 로직
/js/reactions.js     # L1 로더+실행기
/js/audio.js         # Web Audio 합성 (구구/뿅/퍽 등 함수형)
/js/main.js          # 입력 라우팅, 게이지
/data/reactions.json # ★ 반응 정의 (콘텐츠의 전부)
/manifest.json /sw.js
```

## 3. 쏨킴 비주얼 스펙 (확정 — ssomkim.html + 키비주얼 기준)

- **완전 가상 생물. 실존 동물 연상 금지.** 크림색 털뭉치 계란형, 처진 뱃살 라인, 분홍 볼터치, 반쯤 감은 씨익 눈
- **시그니처: 정수리 좌상단에 비스듬한 반창고 1개. 모든 상태(등 돌린 삐짐 포함)에서 보여야 함**
- 분노 시 역삼각 변신: 어깨 벌어진 몸 + 플렉스 팔 + 몸 전체 붉어짐 (BODY_SOFT/BODY_BUFF 패스는 ssomkim.html 참조)
- 종 특정 요소 금지: 수염, 부리, 귀, 꼬리 일절 배제. 스킨 확장도 유령/로봇/푸딩 등 가상 변형만
- 세계관 설정: 무릎 높이 덩치 (강아지 크기). 화면 연출은 묵직한 모션으로 덩치감 표현
- **뱃살 필수**: 하단 1/3이 살짝 처진 형태, idle 시 뱃살이 들썩이는 숨쉬기 애니메이션 (1.8s loop)
- 기본 표정: 반쯤 감은 눈 + 씰룩 입 (얄미움). 참고 구현: 기존 kkuku.html의 eyelid/brow 패턴 재사용 가능
- squash & stretch: 맞으면 가로로 퍼졌다 복원 (변형 폭이 타격감의 전부, 과감하게 30%+)
- SVG 파트에 id 부여 필수: body, belly, antenna1, antenna2, eyeL, eyeR, eyelid, brow, mouth, blush — reactions.json에서 id로 제어

## 4. 상태머신

| 상태 | 진입 | idle 행동 | 비고 |
|---|---|---|---|
| calm | 시작/화해 후 | 약올리기 idle 3종 로테이션 (혀 내밀기, 딴청, 플레이어 쳐다보고 피식) | |
| annoyed | 게이지 ≥30 | 째려봄 idle | |
| angry | 게이지 ≥70 | 씩씩거림, 콩콩 뜀 | |
| sulking | 게이지 ≥100 | 등 돌림, **모든 탭 무반응** (등만 움찔) | PR-1에선 출구 = 10초 방치 시 calm 복귀 (달래기는 PR-2) |
| reconcile | (PR-2에서 진입) | 연출만 미리 구현: 눈물 그렁→돌아봄→해맑음 (5초) | 디버그 키로 발동 테스트 가능하게 |

- 게이지: 탭당 +6, 초당 -1 자연 감소. 수치는 const로 상단 분리 (밸런싱 대상)
- 상태 전이 시 표정/포즈 즉시 전환 + 전이 전용 짧은 연출 허용

## 5. reactions.json 스키마 (★ 핵심 산출물)

```json
{
  "version": 1,
  "reactions": [
    {
      "id": "poke_belly_calm",
      "trigger": { "input": "tap", "part": "belly", "state": "calm" },
      "weight": 1,
      "anim": [
        { "target": "body", "type": "squash", "amount": 0.3, "dur": 200 },
        { "target": "belly", "type": "jiggle", "dur": 600 }
      ],
      "sound": { "fn": "boing", "pitch": 1.0 },
      "line": { "pool": ["뭐임?", "방금 너냐?", "배 아님. 근육임."], "show_ms": 700 },
      "gauge": 6
    }
  ]
}
```

- 같은 trigger에 reaction 여러 개 → weight 랜덤 선택 (반복감 제거)
- anim type 최소 세트: squash, jiggle, shake, jump, turn_away, blink, blush
- **초기 콘텐츠 분량: 상태 4종(sulking 제외) × 부위 3 × 각 2~3개 = 약 30개 반응 정의 필수.** 대사는 반말, 한 문장, 20자 이내, 절대 비굴하지 않은 츤데레 톤
- 코드는 이 JSON만 읽어서 동작해야 함. 반응 추가 시 JS 수정 0줄이 합격 기준

## 6. 사운드

- Web Audio 합성 함수 5종: boing(탭), thud(강타감), squeak(짜증), grumble(분노), sparkle(화해)
- 외부 오디오 파일 금지 (PR-1 기준). 모바일 첫 터치 시 AudioContext resume 처리 필수

## 7. 수용 기준 (Acceptance)

1. 모바일 Safari/Chrome에서 탭 → 0ms 체감 즉각 반응 (애니+사운드+말풍선)
2. 같은 곳 연타 시 calm→annoyed→angry(역삼각 변신)→sulking 전이가 표정/몸으로 명확히 구분됨
3. **문지르기/밀기 제스처 중 화면 스크롤·당겨서 새로고침·바운스 미발생** (touch-action:none + setPointerCapture — ssomkim.html 참조)
4. 제스처 4종이 한 손가락으로 오발동 없이 구분됨 (판정 수치는 §1 고정값 사용)
5. sulking에서 탭 무반응 → 문지르면 화해 연출 → calm 복귀
6. reactions.json에 반응 1개 추가하는 것만으로 새 반응 동작 (JS 무수정)
7. Vercel 배포 + 홈화면 추가(PWA) 동작
8. 콘솔 에러 0, 외부 네트워크 요청 0

## 8. 금지 사항

- 프레임워크/빌드 도구 도입 금지
- AI/fetch 호출 금지
- PR 범위 밖 기능 선구현 금지 (구조만 확장 가능하게)

## 9. 저장소 초기 설정

새 저장소에 AGENTS.md를 함께 생성할 것:
- **캐릭터 이름은 js/config.js의 NAME 상수 단 한 곳에만 존재. 파일명·저장소명·변수명·CSS 클래스명에 캐릭터 이름 사용 절대 금지** (저장소/파일은 중립 코드네임 사용: 예. poke-pet)
- 수정 후 모바일 뷰포트 기준 3회 연속 검증 통과 전 완료 보고 금지
- ssomkim.html의 검증 수치(§1)는 합의 없이 변경 금지
- 모든 신규 반응/대사는 reactions.json에만 추가 (JS 하드코딩 금지)
- 커밋 단위: 기능 1개 = 커밋 1개
