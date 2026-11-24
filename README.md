# Ron's Butchery Place

정적 HTML/CSS 개인 홈페이지. 빌드 도구 없이 파일을 그대로 열거나 GitHub Pages에 올리면 바로 동작해요.

## 폴더 구조

```
index.html              Home — 히어로 → Recent work 2025–2026 → Career highlights → 문의 CTA
about.html              About me — 소개, 관심사, 연대기
archive.html            Archive — 사진 컬렉션 3개 + 집필 섹션 + 인스타그램
contact.html            Contact
css/style.css           전체 스타일 (컬러·폰트 변수 포함)
js/main.js              모바일 메뉴 토글, 스크롤 등장 효과
js/gallery.js           data/gallery.json을 읽어 사진 컬렉션·Recent work를 그리고 라이트박스 띄움
data/gallery.json       사진 목록 — 새 사진은 여기에 한 덩어리만 추가
scripts/make_thumbs.py  사진 목록용 축소본(thumbs) 생성
images/home/            히어로 사진
images/shared/          스탬프 로고
images/archive/         아카이브 사진 (YYYY/YYYY-MM-DD_slug/01.jpg …)
```

## 사진 추가하는 법 — 두 단계

1. 원본 사진을 `images/archive/2025/2025-08-19_gwangpyung/01.jpg` 처럼 **날짜_이름 폴더**에 넣기
2. `python3 scripts/make_thumbs.py` 실행 → `thumbs/01.jpg`가 만들어지고, 아래에 붙여 넣을 JSON 조각이 출력돼요

```json
{
  "src": "images/archive/2025/2025-08-19_gwangpyung/01.jpg",
  "thumb": "images/archive/2025/2025-08-19_gwangpyung/thumbs/01.jpg",
  "date": "2025-08-19",
  "title": "광평미트 매장 클래스",
  "place": "Gwangpyung Meat",
  "tags": ["butchery"],
  "alt": "카운터에서 시연하는 모습",
  "width": 480,
  "height": 320
}
```

- 이 조각을 `data/gallery.json` 배열에 붙이고 `title`·`place`·`tags`·`alt`만 채우면 끝이에요. **HTML은 손대지 않습니다.**
- `width`·`height`는 화면에 나가는 파일(썸네일) 기준이라 레이아웃이 흔들리지 않아요.
- 확인되지 않은 값은 **비워 두세요.** 빈 문자열이면 캡션에서 자동으로 빠집니다.
- Pillow가 필요해요: `python3 -m pip install Pillow` (축소본 만들 때만)

### 태그 — 어느 섹션에 나오나

| tags | 어디에 나오나 |
|---|---|
| `trips` | Archive 01 · Business trips & projects |
| `butchery`, `class` | Archive 02 · Butchery & plating |
| `travel`, `hobby` | Archive 03 · Travel & hobbies |

- Home의 **Recent work**는 `"recent": true`를 넣은 사진만 모아 카드로 보여줘요. 사진이 없으면 지금처럼 정리된 카드(사진 자리 표시)가 그대로 남습니다.
- 태그는 여러 개 붙여도 되고, 섹션을 늘리고 싶으면 `archive.html`의 `data-gallery="태그"` 한 곳만 추가하면 돼요.

## 지금 남은 자리

`Photo to follow`라고 적힌 점선 상자는 사진을 기다리는 자리예요. 사진이 오면 `data/gallery.json`에 넣거나, 그 자리만 `<img>`로 바꾸면 됩니다.

- About 히어로(셰프 포트레이트), Archive 히어로, About 관심사 4칸(색소폰·사이클링·필름·골프)
- Home Career highlights 8칸
- Recent work 4칸 — 사진이 준비되면 `recent: true` 항목으로 자동 교체

## 확인된 것만 쓰는 원칙

아임웹 갤러리에서 내려받은 140×140 썸네일 20장은 **어떤 사진인지 확인하는 용도**라 사이트에 넣지 않았어요(흐릿하고, 원본이 아님). 사건명이 틀린 캡션이 붙는 것보다 빈 자리가 낫다는 기준으로, 사진이 확인된 것만 `data/gallery.json`에 넣습니다.

## GitHub Pages에 올리기

1. GitHub 저장소: `https://github.com/Ronkoai/ron-butchery-place`
2. 저장소 Settings → Pages → Branch를 `main` / `/(root)`로 지정 후 저장
3. 몇 분 뒤 `https://ronkoai.github.io/ron-butchery-place/` 로 접속 가능

작업 브랜치는 `feature/restructure` — 확인 후 `main`에 합치면 Pages에 반영돼요.

## 스크롤 등장 효과

섹션에 `class="reveal"`을 붙이면 스크롤해서 화면에 들어올 때 부드럽게 나타나요. 히어로에는 일부러 넣지 않았고, 기기에서 "동작 줄이기"를 켜두면 효과 없이 바로 보입니다.

## 색상 · 폰트 토큰

`css/style.css` 상단 `:root` 안에 전부 변수로 정리되어 있어요 (`--oxblood`, `--brass`, `--bone`, `--kraft`, `--gap`, `--radius` …). 사진 그리드와 라이트박스도 같은 토큰만 씁니다. 색을 바꾸려면 변수 값만 고치면 사이트 전체에 반영돼요.
