# 알바핏 스토리 장면 일러스트 — 화풍 통일 프롬프트 템플릿

## 화풍 통일의 3원칙
1. **스타일 앵커 블록 고정**: 모든 프롬프트가 동일한 화풍 문단으로 시작한다. 바뀌는 건 장면 블록뿐.
2. **주인공 캐릭터 고정**: "주황 앞치마를 입은 한국인 알바생" 한 명이 모든 장면에 등장 — 그림책처럼 이야기가 이어진다.
3. **1번 장면을 기준 이미지로**: 첫 장면을 먼저 뽑고, 나머지 19장은 그 이미지를 스타일 참조로 걸어 생성한다.
   - Midjourney: `--sref {1번장면 URL} --sw 200 --seed 777 --ar 16:9`
   - DALL·E/나노바나나: 1번 이미지를 첨부하고 "이 그림과 동일한 화풍·주인공으로" 지시

---

## [공통] 스타일 앵커 블록 — 모든 장면 앞에 붙일 것

```
flat vector illustration, soft pastel gradient background, rounded friendly shapes,
warm cozy mood, minimal facial features, clean composition with one focal point,
a young Korean part-time worker in an orange apron as the recurring protagonist,
no text, no letters, no logos, storybook style, 16:9
```

## [장면] 블록 — 아래 한 줄씩 교체

| 슬롯 | 변형 | 장면 프롬프트 (앵커 블록 뒤에 추가) | 배경색 지시 |
|---|---|---|---|
| 1 | A | protagonist standing between two desks at dawn, one desk neatly stacked with identical documents, the other desk covered with a mystery box and question marks | sunrise orange gradient |
| 1 | B | protagonist in a convenience store, choosing between a tidy shelf-restocking cart and a colorful event display stand | sunrise orange gradient |
| 2 | A | protagonist noticing a single report page left on a copy machine, a magnifying glass hovering over mismatched numbers | soft periwinkle blue gradient |
| 2 | B | protagonist at a POS register late at night, holding a 500-won coin, receipt paper curling around | soft periwinkle blue gradient |
| 3 | A | protagonist and a stranger inside an elevator, floor indicator glowing, a small speech bubble forming | mint green gradient |
| 3 | B | protagonist entering a break room where another worker eats alone at a small table | mint green gradient |
| 4 | A | protagonist at lunch hour choosing between a sunny walking path outside the window and a cozy chair with a phone | warm yellow gradient |
| 4 | B | protagonist with 30 free minutes, a warehouse door half open on one side and a neat inventory sheet on the other | warm yellow gradient |
| 5 | A | protagonist facing a huge 200-page manual next to a glowing new computer program on screen | lavender purple gradient |
| 5 | B | protagonist in front of a brand-new self-order kiosk, screen glowing, empty store before opening | lavender purple gradient |
| 6 | A | protagonist packing identical small boxes on day four, a rhythm of motion lines showing steady speed | coral peach gradient |
| 6 | B | protagonist inspecting products for the seventh day, hands moving automatically, calm focused face | coral peach gradient |
| 7 | A | protagonist calmly holding a phone while jagged angry speech lines burst from the receiver | cool blue gradient |
| 7 | B | protagonist at a store counter facing an upset customer, a queue of small figures waiting behind | cool blue gradient |
| 8 | A | protagonist in a warehouse choosing between a tower of heavy boxes and a clipboard checklist | fresh green gradient |
| 8 | B | protagonist preparing an event hall, carts of supplies on one side, a checklist board on the other | fresh green gradient |
| 9 | A | protagonist alone at dusk staring at a spreadsheet where one cell glows red, coffee cup beside | pink magenta gradient |
| 9 | B | protagonist in a stockroom counting boxes, two ghostly missing items outlined in dotted lines | pink magenta gradient |
| 10 | A | protagonist at night reading a glowing phone message, a fork in the road behind: a shiny new store and a familiar old store | deep navy gradient |
| 10 | B | protagonist looking at a notice board, one poster says new menu training, another shows a mastered best menu | deep navy gradient |

---

## 적용 방법
1. 슬롯 1-A를 먼저 생성 → 마음에 드는 결과의 URL(또는 이미지)을 확보
2. 나머지 19장은 `앵커 블록 + 장면 블록 + --sref {1A URL} --sw 200 --seed 777` 로 일괄 생성
3. 완성된 이미지를 Vercel 저장소에 `scenes/s1a.png` 형식으로 업로드
4. index.html의 각 장면 객체에 `img: "/scenes/s1a.png"` 한 줄만 추가하면 그라디언트 배너가 자동으로 사진으로 교체됨 (코드 수정 불필요)

## 품질 체크리스트
- [ ] 주인공의 앞치마 색·머리 모양이 20장 전체에서 동일한가
- [ ] 배경 그라디언트가 앱의 슬롯별 색(index.html의 grad 값)과 톤이 맞는가
- [ ] 그림 안에 글자·간판 텍스트가 없는가 (AI 텍스트 왜곡 방지)
- [ ] 정답을 암시하는 연출이 없는가 (한쪽 선택지만 밝게 그려지면 측정 왜곡)
