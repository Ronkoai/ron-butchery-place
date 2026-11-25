# Ron Ko — Cultural Butcher

융재 님(고용재 / Ron Ko)의 퍼스널 브랜딩 홈페이지. 정적 HTML/CSS/JS라 빌드 도구 없이 파일을 그대로 열거나 GitHub Pages에 올리면 바로 동작해요.

전 세계 F&B 파트너·컨설팅 의뢰인·C레벨 서치를 염두에 두고, 18년차 부처·그릴마스터이자 한우 오마카세 셰프, 그리고 푸드테크 CPO라는 세 축을 한 사이트에 담았습니다.

## 폴더 구조

```
index.html              Home — 히어로(지표 4개) → Global projects 2025–2026(4개 지역) → Signature career chapters → What I do → 육류 인문학 → 문의
about.html              About — 소개, 연대기(실제 입·퇴사 월), Interests & travel
archive.html            Archive — 필터 갤러리(전체/출장·세미나/정육·다이닝·R&D/여행·취미) + 집필 섹션
contact.html            Contact — 메일, 위치·활동 범위, 자주 묻는 세 가지
css/style.css           전체 스타일 (컬러·폰트 토큰은 :root)
js/main.js              모바일 메뉴 토글, 스크롤 등장 효과
js/gallery.js           data/gallery.json을 읽어 갤러리·필터·라이트박스를 그림
data/gallery.json       사진 목록 (현재 55장)
scripts/make_thumbs.py  thumbs/ 축소본(480px) 생성 + 붙여넣을 JSON 조각 출력
images/home/            히어로 사진(흑백 발골)
images/shared/          스탬프 로고
images/archive/         아카이브 사진 (YYYY/YYYY-MM-DD_slug/파일명.jpg + thumbs/)
```

## 사진 추가하는 법 — 세 단계

1. 원본을 1800px(긴 변) 이하 JPEG로 줄여 `images/archive/2026/2026-10-17_singapore_outdoor/` 처럼 **날짜_이름 폴더**에 넣기
2. `python3 scripts/make_thumbs.py` → `thumbs/`가 만들어지고 붙여 넣을 JSON 조각이 출력됨
3. 그 조각을 `data/gallery.json`에 붙이고 `title`·`place`·`tags`·`alt`만 채우기. **HTML은 손대지 않습니다.**

```json
{
  "src": "images/archive/2026/2026-10-17_singapore_outdoor/sg_09_outdoor_grill_evening.jpg",
  "thumb": "images/archive/2026/2026-10-17_singapore_outdoor/thumbs/sg_09_outdoor_grill_evening.jpg",
  "date": "2026-10-17",
  "title": "Evening Hanwoo grill tasting",
  "place": "Singapore",
  "tags": ["trips", "singapore"],
  "alt": "Chefs grilling Hanwoo at a night tasting under the green HANWOO banner",
  "width": 480,
  "height": 360
}
```

- `width`·`height`는 화면에 나가는 썸네일 기준이라 레이아웃이 흔들리지 않아요.
- 확인되지 않은 날짜·장소는 **비워 두세요.** 빈 문자열이면 캡션에서 자동으로 빠집니다.
- Pillow 필요: `python3 -m pip install Pillow`

### 태그 — 어느 필터에 나오나

| tags | Archive 필터 |
|---|---|
| `trips` | Global trips &amp; seminars |
| `craft` | Butchery, dining &amp; R&amp;D |
| `travel`, `hobby` | Travel &amp; hobbies |
| `recent` | Home 카드용 (현재 미사용) |

지역·소재 태그(`singapore`, `hk`, `usa`, `japan`, `laos`, `cambodia`, `thailand`, `butchery`, `rnd`, `cycling`, `golf`, `film`, `family`)는 함께 붙여 두면 나중에 필터를 늘리기 쉬워요. 새 필터는 `archive.html`의 `.chip` 한 줄만 추가하면 됩니다.

## 확인된 것만 쓰는 원칙

- 날짜·장소는 실제 촬영일(구글 포토 기준)만 적었습니다. 근거가 없는 값은 비워 뒀어요.
- 홍콩 컷은 **본인(검은 조리복)이 나오는 사진만** 사용했습니다.
- 가족·지인 얼굴이 나오는 컷은 본인 승인 범위 안에서만 넣었습니다.
- 연대기의 입·퇴사 연월은 이력서(잡코리아·경력기술서) 기준입니다. 현 직장(푸드테크 스타트업)은 2023.12 입사.
- 재직 중인 회사 이름과 제품명은 사이트 어디에도 노출하지 않습니다 — 서술·연대기·캡션 모두 "a food-tech startup"으로 표기합니다. 연락처 메일 `ron@deeplant.com`만 예외입니다(본인 확인).
- 유튜브는 `https://www.youtube.com/@cpo_ron` (`고기인문학 | 고용재`) — `contact.html`의 `YouTube` 행과 `index.html` CTA·푸터, 각 페이지 푸터에 링크로 걸려 있습니다.

## 아직 없는 것

- 2012.10~2018.09 사이 매장·현장 사진(2014 헤드 부처, 2016 파주 셀프 바비큐장 등)은 아직 없습니다.

## GitHub Pages에 올리기

1. 저장소: `https://github.com/Ronkoai/ron-butchery-place`
2. Settings → Pages → Branch `main` / `(root)` 지정
3. 몇 분 뒤 `https://ronkoai.github.io/ron-butchery-place/` 접속

작업 브랜치는 `feature/restructure` — 확인 후 `main`에 합치면 Pages에 반영됩니다.

## 로컬에서 확인할 때

`archive.html`의 갤러리·필터는 `data/gallery.json`을 fetch로 읽습니다. HTML 파일을 더블클릭해 열면(Chrome·Edge) fetch가 막혀 갤러리가 빈 상태로 보입니다. 폴더에서 `python3 -m http.server` 를 띄워 `http://localhost:8000/` 로 열거나, GitHub Pages 주소로 확인하세요.

## 색상 · 폰트 토큰

`css/style.css` 상단 `:root`에 정리되어 있어요 (`--oxblood`, `--brass`, `--bone`, `--kraft`, `--gap`, `--radius` …). 색을 바꾸려면 변수 값만 고치면 사이트 전체에 반영됩니다. 디스플레이 서체는 Fraunces, 본문은 Pretendard.
