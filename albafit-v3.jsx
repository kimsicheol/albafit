import { useState, useMemo } from "react";

// ---------- Design tokens ----------
const C = {
  bg: "#F5F6F2",
  paper: "#FFFFFF",
  ink: "#151B27",
  sub: "#5B6472",
  line: "#E3E6DE",
  worker: "#2E56E8",
  workerSoft: "#E8EDFE",
  company: "#0E9B6C",
  companySoft: "#E4F5EE",
  local: "#FF6F1E",
  localSoft: "#FFEDE1",
  gold: "#F2B441",
  warn: "#D9772B",
};
const font = "'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";

// ---------- 동네 ----------
const DONGS = {
  "명일동": [0, 0], "고덕동": [0.9, 0.8], "상일동": [1.9, 0.6], "암사동": [-1.4, 0.9],
  "길동": [0.2, -1.1], "둔촌동": [0.6, -2.1], "천호동": [-1.3, -0.9], "성내동": [-1.1, -1.9],
};
const DONG_LIST = Object.keys(DONGS);
function walkMin(a, b) {
  if (a === b) return 6;
  const [x1, y1] = DONGS[a], [x2, y2] = DONGS[b];
  return Math.round(6 + Math.hypot(x1 - x2, y1 - y2) * 13);
}
function distScore(min) { return Math.max(0, Math.min(100, Math.round(112 - min * 3))); }
function distTone(min) {
  if (min <= 12) return { label: `도보 ${min}분 · 슬세권`, bg: C.localSoft, color: C.local };
  if (min <= 22) return { label: `도보 ${min}분`, bg: "#FFF6E4", color: "#B07B14" };
  return { label: `도보 ${min}분 · 버스권`, bg: "#F1F2ED", color: C.sub };
}

// ---------- 성향 축 ----------
const TRAITS = [
  { key: "routine", name: "반복 내성", desc: "같은 일을 꾸준히 해내는 힘" },
  { key: "detail", name: "꼼꼼함", desc: "숫자·문서의 오류를 잡는 눈" },
  { key: "people", name: "대인 응대", desc: "사람·전화 응대가 편한 정도" },
  { key: "energy", name: "활동 체력", desc: "몸을 쓰는 일에 대한 선호" },
  { key: "learning", name: "습득 속도", desc: "새 규칙·도구를 익히는 속도" },
];
const TRAIT_NAME = Object.fromEntries(TRAITS.map(t => [t.key, t.name]));

// ---------- 3단계 검사 설계 ----------
// 1단계: 나의 기본 성향 (5문항, 리커트)
// 2단계: 일하는 스타일 (5문항, 리커트 — 축별 심화)
// 3단계: 원하는 조건 (4문항, 선택형)
const STAGE1 = [
  { t: "routine", q: "같은 작업을 반복해도 지루함을 잘 느끼지 않는다." },
  { t: "detail", q: "문서나 표에서 오타·숫자 오류를 잘 찾아내는 편이다." },
  { t: "people", q: "처음 보는 사람과 대화하는 것이 부담스럽지 않다." },
  { t: "energy", q: "하루 종일 서서 움직이는 일도 괜찮다." },
  { t: "learning", q: "새로운 프로그램이나 규칙을 빨리 익히는 편이다." },
];
const STAGE2 = [
  { t: "routine", q: "정해진 순서와 매뉴얼대로 일할 때 마음이 편하다." },
  { t: "detail", q: "일을 마치기 전에 결과물을 한 번 더 확인한다." },
  { t: "people", q: "고객의 요청이나 항의를 응대해도 크게 지치지 않는다." },
  { t: "energy", q: "책상에 오래 앉아 있는 것보다 몸을 움직이는 쪽이 좋다." },
  { t: "learning", q: "모르는 것이 생기면 검색과 매뉴얼로 스스로 해결한다." },
];
const STAGE3 = [
  { key: "time", q: "언제 일하고 싶으세요?", options: ["오전", "오후", "저녁", "무관"] },
  { key: "env", q: "어떤 환경이 좋으세요?", options: ["앉아서 사무", "서서 활동", "무관"] },
  { key: "team", q: "어떻게 일할 때 편하세요?", options: ["혼자 몰입", "사람들과 함께", "무관"] },
  { key: "term", q: "얼마나 일하실 계획인가요?", options: ["3개월 이상 장기", "단기·당일", "무관"] },
];
const SCALE = ["전혀 아니다", "아니다", "보통", "그렇다", "매우 그렇다"];
const STAGES = [
  { name: "기본 성향", sub: "나는 어떤 사람인가", color: C.worker, soft: C.workerSoft, count: STAGE1.length },
  { name: "업무 스타일", sub: "나는 어떻게 일하는가", color: C.company, soft: C.companySoft, count: STAGE2.length },
  { name: "원하는 조건", sub: "나는 무엇을 원하는가", color: C.local, soft: C.localSoft, count: STAGE3.length },
];

// ---------- 직무 데이터 ----------
const JOBS = [
  {
    id: "confirm", title: "금융거래조회서 발송·회신 관리", org: "회계법인 감사지원팀", dong: "명일동",
    req: { routine: 90, detail: 90, people: 40, energy: 15, learning: 55 },
    cond: { time: "오전", env: "앉아서 사무", team: "혼자 몰입", term: "3개월 이상 장기" },
    pay: "시급 11,500원", tags: ["사무", "숙련 4주"],
    note: "은행·증권사별 접수 규칙이 달라 거래처 파악에 약 1개월이 필요합니다. 반복 내성과 꼼꼼함이 높을수록 오래 근속합니다.",
  },
  {
    id: "dataentry", title: "회계자료 데이터 입력", org: "세무·회계 사무소", dong: "천호동",
    req: { routine: 95, detail: 80, people: 10, energy: 10, learning: 40 },
    cond: { time: "오후", env: "앉아서 사무", team: "혼자 몰입", term: "3개월 이상 장기" },
    pay: "시급 10,500원", tags: ["사무", "숙련 1주"],
    note: "전표·증빙을 정해진 양식에 입력합니다. 반복 내성이 핵심입니다.",
  },
  {
    id: "cafe", title: "카페 바리스타", org: "고덕역 프랜차이즈 카페", dong: "고덕동",
    req: { routine: 55, detail: 55, people: 80, energy: 75, learning: 60 },
    cond: { time: "오전", env: "서서 활동", team: "사람들과 함께", term: "3개월 이상 장기" },
    pay: "시급 10,300원", tags: ["서비스", "숙련 2주"],
    note: "레시피 숙지와 손님 응대가 절반씩입니다. 대인 응대와 체력이 중요합니다.",
  },
  {
    id: "logistics", title: "물류센터 피킹·패킹", org: "상일동 풀필먼트센터", dong: "상일동",
    req: { routine: 75, detail: 50, people: 10, energy: 95, learning: 30 },
    cond: { time: "저녁", env: "서서 활동", team: "혼자 몰입", term: "단기·당일" },
    pay: "일급 110,000원", tags: ["물류", "숙련 3일"],
    note: "체력이 곧 성과입니다. 활동 체력이 높은 분에게 만족도가 높습니다.",
  },
  {
    id: "frontdesk", title: "학원 데스크·수납 보조", org: "명일동 중등 전문 학원", dong: "명일동",
    req: { routine: 50, detail: 70, people: 85, energy: 35, learning: 65 },
    cond: { time: "오후", env: "앉아서 사무", team: "사람들과 함께", term: "3개월 이상 장기" },
    pay: "시급 10,800원", tags: ["교육", "숙련 2주"],
    note: "학부모 응대와 수납 처리가 함께 있어 대인 응대와 꼼꼼함이 모두 필요합니다.",
  },
  {
    id: "event", title: "행사·전시 운영 스태프", org: "성내동 이벤트 대행사", dong: "성내동",
    req: { routine: 20, detail: 40, people: 90, energy: 90, learning: 70 },
    cond: { time: "무관", env: "서서 활동", team: "사람들과 함께", term: "단기·당일" },
    pay: "일급 120,000원", tags: ["행사", "당일 투입"],
    note: "매번 현장이 달라 변화를 즐기는 성향에게 맞습니다.",
  },
  {
    id: "library", title: "도서관 자료 정리 보조", org: "암사동 구립 도서관", dong: "암사동",
    req: { routine: 80, detail: 75, people: 30, energy: 45, learning: 35 },
    cond: { time: "오전", env: "서서 활동", team: "혼자 몰입", term: "3개월 이상 장기" },
    pay: "시급 10,200원", tags: ["공공", "숙련 1주"],
    note: "청구기호 순 배열 등 규칙 기반 업무입니다. 조용히 몰입하는 성향에 적합합니다.",
  },
];

// ---------- 지원자 (기업 모드) ----------
const APPLICANTS = [
  { name: "김서연", age: 24, dong: "명일동", exp: "사무보조 8개월", traits: { routine: 88, detail: 92, people: 45, energy: 25, learning: 60 } },
  { name: "박준호", age: 27, dong: "상일동", exp: "물류 6개월 · 카페 3개월", traits: { routine: 60, detail: 40, people: 55, energy: 95, learning: 45 } },
  { name: "이지은", age: 22, dong: "고덕동", exp: "학원 데스크 1년", traits: { routine: 55, detail: 70, people: 90, energy: 50, learning: 75 } },
  { name: "최민규", age: 30, dong: "천호동", exp: "데이터 입력 2년", traits: { routine: 95, detail: 85, people: 20, energy: 15, learning: 50 } },
  { name: "정하늘", age: 25, dong: "성내동", exp: "행사 스태프 다수", traits: { routine: 25, detail: 35, people: 95, energy: 90, learning: 80 } },
  { name: "오세림", age: 23, dong: "암사동", exp: "도서관 보조 5개월", traits: { routine: 82, detail: 78, people: 35, energy: 40, learning: 55 } },
];

// ---------- 매칭 로직 ----------
function fitScore(user, req) {
  let num = 0, den = 0;
  TRAITS.forEach(({ key }) => {
    const r = req[key], u = user[key];
    const w = 0.4 + r / 100;
    const gap = u < r ? (r - u) : (u - r) * 0.4;
    num += gap * w; den += w;
  });
  return Math.min(99, Math.max(0, Math.round(100 - (num / den) * 1.6)));
}
function prefScore(prefs, cond) {
  let hit = 0, tot = 0, matched = [];
  STAGE3.forEach(({ key, q }) => {
    const p = prefs[key];
    if (!p) return;
    tot += 1;
    if (p === "무관" || cond[key] === "무관" || p === cond[key]) { hit += 1; if (p !== "무관") matched.push(p); }
  });
  return { score: tot ? Math.round((hit / tot) * 100) : 100, matched };
}
function totalScore(fit, walk, pref) {
  return Math.round(fit * 0.5 + distScore(walk) * 0.3 + pref * 0.2);
}
function tenureMonths(score) {
  return Math.max(2, Math.min(14, Math.round(2 + ((score - 45) / 55) * 12)));
}
function scoreColor(s) { return s >= 80 ? C.company : s >= 60 ? C.gold : C.warn; }

// ---------- 공용 소품 ----------
function Chip({ children, bg, color }) {
  return <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 999, background: bg || "#EFF1EA", color: color || C.sub, fontWeight: 700, whiteSpace: "nowrap" }}>{children}</span>;
}
function ScoreDial({ score, label }) {
  const col = scoreColor(score);
  return (
    <div style={{ textAlign: "center", minWidth: 72 }}>
      <div style={{ width: 60, height: 60, borderRadius: "50%", margin: "0 auto", background: `conic-gradient(${col} ${score * 3.6}deg, #ECEEE7 0deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 46, height: 46, borderRadius: "50%", background: C.paper, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: col }}>{score}</div>
      </div>
      <div style={{ fontSize: 11, color: C.sub, marginTop: 4, fontWeight: 600 }}>{label}</div>
    </div>
  );
}
function FitGauge({ user, req, leftColor, rightColor }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700 }}>
        <span style={{ color: leftColor }}>내 성향</span><span style={{ color: rightColor }}>직무 요구</span>
      </div>
      {TRAITS.map(({ key, name }) => (
        <div key={key} style={{ display: "grid", gridTemplateColumns: "1fr 78px 1fr", alignItems: "center", gap: 6 }}>
          <div style={{ width: "100%", height: 8, background: "#EFF1EA", borderRadius: 99, overflow: "hidden", transform: "scaleX(-1)" }}>
            <div style={{ width: `${user[key]}%`, height: "100%", background: leftColor, borderRadius: 99 }} />
          </div>
          <div style={{ fontSize: 11.5, textAlign: "center", fontWeight: 600 }}>{name}</div>
          <div style={{ width: "100%", height: 8, background: "#EFF1EA", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: `${req[key]}%`, height: "100%", background: rightColor, borderRadius: 99 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- 메인 ----------
export default function AlbaFitV3() {
  const [mode, setMode] = useState("home");
  const [myDong, setMyDong] = useState("명일동");
  // 검사 상태
  const [stage, setStage] = useState(0);        // 0,1,2
  const [phase, setPhase] = useState("quiz");   // quiz | rest | result
  const [qIdx, setQIdx] = useState(0);
  const [likert, setLikert] = useState(Array(10).fill(null)); // stage1(0-4) + stage2(5-9)
  const [prefs, setPrefs] = useState({});
  const [sortKey, setSortKey] = useState("total");
  // 기업
  const [jobReq, setJobReq] = useState({ routine: 90, detail: 90, people: 40, energy: 15, learning: 55 });
  const [jobTitle, setJobTitle] = useState("금융거래조회서 발송·회신 관리");
  const [jobDong, setJobDong] = useState("명일동");

  const resetTest = () => { setStage(0); setPhase("quiz"); setQIdx(0); setLikert(Array(10).fill(null)); setPrefs({}); };

  const profile = useMemo(() => {
    const all = [...STAGE1, ...STAGE2];
    const sums = {}, cnts = {};
    all.forEach((qu, i) => {
      if (likert[i] == null) return;
      sums[qu.t] = (sums[qu.t] || 0) + likert[i];
      cnts[qu.t] = (cnts[qu.t] || 0) + 1;
    });
    const p = {};
    TRAITS.forEach(({ key }) => { p[key] = cnts[key] ? Math.round(((sums[key] / cnts[key]) - 1) / 4 * 100) : 50; });
    return p;
  }, [likert]);

  const rankedJobs = useMemo(() => {
    const list = JOBS.map(j => {
      const walk = walkMin(myDong, j.dong);
      const fit = fitScore(profile, j.req);
      const pf = prefScore(prefs, j.cond);
      return { ...j, walk, fit, pref: pf.score, matched: pf.matched, total: totalScore(fit, walk, pf.score) };
    });
    if (sortKey === "fit") list.sort((a, b) => b.fit - a.fit);
    else if (sortKey === "near") list.sort((a, b) => a.walk - b.walk);
    else list.sort((a, b) => b.total - a.total);
    return list;
  }, [profile, prefs, myDong, sortKey]);

  const rankedApplicants = useMemo(() =>
    APPLICANTS.map(a => {
      const walk = walkMin(jobDong, a.dong);
      const fit = fitScore(a.traits, jobReq);
      return { ...a, walk, fit, total: Math.round(fit * 0.65 + distScore(walk) * 0.35) };
    }).sort((a, b) => b.total - a.total),
  [jobReq, jobDong]);

  const shell = { minHeight: "100vh", background: C.bg, fontFamily: font, color: C.ink, display: "flex", flexDirection: "column", alignItems: "center" };
  const card = { background: C.paper, border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 };
  const btn = (bg, color = "#fff") => ({ background: bg, color, border: "none", borderRadius: 12, padding: "13px 22px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: font });

  const css = `
    @keyframes drift { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,20px) scale(1.15)} 100%{transform:translate(0,0) scale(1)} }
    @keyframes drift2 { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-25px) scale(1.2)} 100%{transform:translate(0,0) scale(1)} }
    @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    @keyframes popIn { 0%{opacity:0; transform:translateY(14px)} 100%{opacity:1; transform:translateY(0)} }
    @keyframes pulseGlow { 0%,100%{box-shadow:0 0 0 0 rgba(255,111,30,.55)} 50%{box-shadow:0 0 0 14px rgba(255,111,30,0)} }
    @keyframes shimmer { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
    .hero-line { animation: popIn .6s ease both; }
    .hero-line2 { animation: popIn .6s .15s ease both; }
    .hero-line3 { animation: popIn .6s .3s ease both; }
    .cta-glow { animation: pulseGlow 2.2s infinite; }
    @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
  `;

  const DongPicker = ({ value, onChange, accent }) => (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.paper, border: `1.5px solid ${accent}`, borderRadius: 999, padding: "6px 12px", cursor: "pointer" }}>
      <span style={{ fontSize: 13 }}>📍</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ border: "none", background: "transparent", fontFamily: font, fontSize: 13.5, fontWeight: 800, color: accent, cursor: "pointer", outline: "none" }}>
        {DONG_LIST.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
    </label>
  );

  const Header = (
    <div style={{ width: "100%", maxWidth: 880, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px 6px", gap: 10, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, cursor: "pointer" }} onClick={() => setMode("home")}>
        <span style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1.2, lineHeight: 1 }}>
          알바<span style={{ background: `linear-gradient(90deg, ${C.local}, ${C.worker})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>핏</span>
        </span>
        <span style={{ fontSize: 12, color: C.sub, fontWeight: 700 }}>우리 동네 적성 매칭</span>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <DongPicker value={myDong} onChange={setMyDong} accent={C.local} />
        {mode !== "home" && (
          <button onClick={() => setMode("home")} style={{ background: "transparent", border: `1px solid ${C.line}`, borderRadius: 10, padding: "7px 14px", fontSize: 13, fontWeight: 600, color: C.sub, cursor: "pointer", fontFamily: font }}>처음으로</button>
        )}
      </div>
    </div>
  );

  // ================= 홈 (광고형 히어로) =================
  if (mode === "home") {
    const nearCnt = JOBS.filter(j => walkMin(myDong, j.dong) <= 15).length;
    const ticker = JOBS.map(j => `📍${j.dong} ${j.title} · ${j.pay} · 도보 ${walkMin(myDong, j.dong)}분`).join("      ");
    return (
      <div style={shell}>
        <style>{css}</style>
        {Header}
        <div style={{ width: "100%", maxWidth: 880, padding: "18px 20px 60px" }}>

          {/* ---------- 히어로 ---------- */}
          <div style={{
            borderRadius: 26, padding: "52px 34px 0", color: "#fff", position: "relative", overflow: "hidden",
            background: "linear-gradient(135deg, #0D1220 0%, #141B33 45%, #241333 100%)",
            backgroundSize: "200% 200%", animation: "shimmer 12s ease infinite",
          }}>
            {/* 글로우 오브 */}
            <div style={{ position: "absolute", right: -60, top: -70, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,111,30,.5), transparent 65%)", animation: "drift 9s ease-in-out infinite", filter: "blur(6px)" }} />
            <div style={{ position: "absolute", left: -80, bottom: -60, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(46,86,232,.55), transparent 65%)", animation: "drift2 11s ease-in-out infinite", filter: "blur(8px)" }} />
            <div style={{ position: "absolute", left: "45%", top: "20%", width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(242,180,65,.3), transparent 70%)", animation: "drift 13s ease-in-out infinite" }} />

            <div style={{ position: "relative" }}>
              <div className="hero-line" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 999, padding: "7px 16px", fontSize: 13, fontWeight: 800, letterSpacing: 0.5 }}>
                📍 {myDong} · 동네 인증 알바 매칭 · 지금 도보 15분 내 <span style={{ color: C.gold }}>{nearCnt}건</span>
              </div>

              <h1 className="hero-line2" style={{ margin: "26px 0 14px", lineHeight: 1.06, letterSpacing: -2.5 }}>
                <span style={{ display: "block", fontSize: "clamp(46px, 8vw, 76px)", fontWeight: 900, background: `linear-gradient(90deg, ${C.local}, #FFB35C)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                  걸어서 10분,
                </span>
                <span style={{ display: "block", fontSize: "clamp(46px, 8vw, 76px)", fontWeight: 900, background: "linear-gradient(90deg, #7EA0FF, #B9CBFF)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                  적성 90점.
                </span>
              </h1>

              <div className="hero-line3" style={{ fontSize: "clamp(17px, 2.6vw, 22px)", fontWeight: 800, marginBottom: 10 }}>
                알바를 그만두는 이유는 둘뿐 — <span style={{ color: "#FF9A5C" }}>멀거나</span>, <span style={{ color: "#9FB6FF" }}>안 맞거나</span>.
              </div>
              <p className="hero-line3" style={{ fontSize: 14.5, color: "#B9BFCC", lineHeight: 1.75, maxWidth: 540, margin: "0 0 26px" }}>
                3단계 적성 검사와 동네 인증으로, <b style={{ color: "#fff" }}>걸어갈 수 있는 거리의 오래 다닐 알바</b>만 골라
                핏 점수·도보 거리·예상 근속까지 한 화면에 보여드립니다.
              </p>

              <div className="hero-line3" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 34 }}>
                <button className="cta-glow" style={{ ...btn(C.local), fontSize: 17, padding: "16px 30px", borderRadius: 14 }}
                  onClick={() => { setMode("worker"); resetTest(); }}>
                  3분 적성검사 시작 →
                </button>
                <button style={{ ...btn("rgba(255,255,255,.08)", "#fff"), fontSize: 16, padding: "16px 26px", borderRadius: 14, border: "1.5px solid rgba(255,255,255,.35)" }}
                  onClick={() => setMode("company")}>
                  동네 인재 채용하기
                </button>
              </div>

              <div style={{ display: "flex", gap: 26, flexWrap: "wrap", paddingBottom: 26 }}>
                {[["1개월", "평균 숙련 기간"], ["2.8배", "핏 80점+ 근속"], ["-31%", "통근 15분 내 이탈률"]].map(([n, l]) => (
                  <div key={l}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: "#fff" }}>{n}</div>
                    <div style={{ fontSize: 11.5, color: "#9AA1B0", fontWeight: 700 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 실시간 공고 티커 */}
            <div style={{ position: "relative", margin: "0 -34px", background: "rgba(0,0,0,.35)", borderTop: "1px solid rgba(255,255,255,.1)", padding: "11px 0", overflow: "hidden" }}>
              <div style={{ display: "inline-block", whiteSpace: "nowrap", animation: "marquee 30s linear infinite", fontSize: 12.5, fontWeight: 700, color: "#D8DCE6" }}>
                <span style={{ paddingRight: 60 }}>{ticker}</span>
                <span style={{ paddingRight: 60 }}>{ticker}</span>
              </div>
            </div>
          </div>

          {/* ---------- 3단계 안내 ---------- */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 14 }}>
            {STAGES.map((s, i) => (
              <div key={s.name} style={{ ...card, borderTop: `4px solid ${s.color}` }}>
                <Chip bg={s.soft} color={s.color}>{i + 1}단계 · {[STAGE1.length, STAGE2.length, STAGE3.length][i]}문항</Chip>
                <div style={{ fontSize: 16.5, fontWeight: 800, margin: "10px 0 4px" }}>{s.name}</div>
                <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ================= 구직자: 3단계 검사 =================
  if (mode === "worker" && phase !== "result") {
    const st = STAGES[stage];
    const isChoice = stage === 2;
    const items = stage === 0 ? STAGE1 : stage === 1 ? STAGE2 : STAGE3;
    const base = stage === 1 ? STAGE1.length : 0;
    const stageAnswered = isChoice
      ? STAGE3.filter(({ key }) => prefs[key]).length
      : items.filter((_, i) => likert[base + i] != null).length;
    const stageDone = stageAnswered === items.length;

    // ----- 단계 사이 휴식 화면 -----
    if (phase === "rest") {
      const topTrait = TRAITS.reduce((a, b) => (profile[a.key] >= profile[b.key] ? a : b));
      const next = STAGES[stage + 1];
      return (
        <div style={shell}>
          <style>{css}</style>
          {Header}
          <div style={{ width: "100%", maxWidth: 560, padding: "40px 20px 60px" }}>
            <div style={{ ...card, textAlign: "center", padding: "36px 24px", animation: "popIn .5s ease both" }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>{stage === 0 ? "🎯" : "🔥"}</div>
              <div style={{ fontSize: 21, fontWeight: 900, marginBottom: 6 }}>{stage + 1}단계 완료!</div>
              <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.7, margin: "0 0 18px" }}>
                지금까지의 답변으로 보면 <b style={{ color: C.worker }}>{topTrait.name}</b>이(가) 가장 돋보여요.<br />
                {stage === 0 ? "다음 단계에서 일하는 스타일을 확인하면 더 정확해집니다." : "마지막으로 원하는 조건만 고르면 끝!"}
              </p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: next.soft, borderRadius: 12, padding: "10px 16px", marginBottom: 20 }}>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: next.color }}>다음 · {stage + 2}단계 {next.name}</span>
                <span style={{ fontSize: 12, color: C.sub }}>{next.count}문항 · 약 {stage === 0 ? 1 : 0.5}분</span>
              </div>
              <div>
                <button style={{ ...btn(next.color), fontSize: 16, padding: "14px 34px" }}
                  onClick={() => { setStage(stage + 1); setPhase("quiz"); setQIdx(0); }}>
                  계속하기 →
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ----- 문항 화면 -----
    const qu = items[qIdx];
    const doneTotal = likert.filter(a => a != null).length + STAGE3.filter(({ key }) => prefs[key]).length;
    const grandTotal = STAGE1.length + STAGE2.length + STAGE3.length;

    const advance = () => {
      if (qIdx < items.length - 1) setQIdx(qIdx + 1);
      else if (stage < 2) setPhase("rest");
      else setPhase("result");
    };

    return (
      <div style={shell}>
        <style>{css}</style>
        {Header}
        <div style={{ width: "100%", maxWidth: 620, padding: "16px 20px 60px" }}>
          {/* 단계 스텝퍼 */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {STAGES.map((s, i) => (
              <div key={s.name} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 6, borderRadius: 99, background: i < stage ? s.color : i === stage ? s.soft : "#E9EBE3", overflow: "hidden" }}>
                  {i === stage && <div style={{ width: `${(stageAnswered / items.length) * 100}%`, height: "100%", background: s.color, transition: "width .25s" }} />}
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, marginTop: 5, color: i === stage ? s.color : i < stage ? C.ink : "#B7BCC6" }}>
                  {i + 1}단계 {s.name}{i < stage ? " ✓" : ""}
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 700, textAlign: "right", marginBottom: 10 }}>
            전체 {doneTotal} / {grandTotal} 문항
          </div>

          <div style={{ ...card, animation: "popIn .35s ease both" }} key={`${stage}-${qIdx}`}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <Chip bg={st.soft} color={st.color}>{stage + 1}단계 · {st.name}</Chip>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>{qIdx + 1} / {items.length}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.5, marginBottom: 20 }}>{qu.q}</div>

            {isChoice ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {qu.options.map(op => {
                  const on = prefs[qu.key] === op;
                  return (
                    <button key={op} onClick={() => { setPrefs({ ...prefs, [qu.key]: op }); setTimeout(advance, 180); }}
                      style={{
                        padding: "13px 20px", borderRadius: 14, cursor: "pointer", fontFamily: font, fontSize: 15,
                        fontWeight: on ? 800 : 600, border: `1.5px solid ${on ? st.color : C.line}`,
                        background: on ? st.soft : C.paper, color: on ? st.color : C.ink,
                      }}>{op}</button>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {SCALE.map((label, i) => {
                  const val = i + 1;
                  const gIdx = base + qIdx;
                  const on = likert[gIdx] === val;
                  return (
                    <button key={label} onClick={() => {
                      const next = [...likert]; next[gIdx] = val; setLikert(next);
                      setTimeout(advance, 160);
                    }} style={{
                      textAlign: "left", padding: "12px 16px", borderRadius: 12, cursor: "pointer", fontFamily: font,
                      fontSize: 14.5, fontWeight: on ? 800 : 600,
                      border: `1.5px solid ${on ? st.color : C.line}`,
                      background: on ? st.soft : C.paper, color: on ? st.color : C.ink,
                    }}>{label}</button>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
            <button disabled={qIdx === 0} onClick={() => setQIdx(qIdx - 1)}
              style={{ ...btn("transparent", C.sub), border: `1px solid ${C.line}`, opacity: qIdx === 0 ? 0.4 : 1, padding: "10px 18px", fontSize: 13.5 }}>이전</button>
            {stageDone && qIdx === items.length - 1 && (
              <button style={{ ...btn(st.color), padding: "10px 20px", fontSize: 13.5 }}
                onClick={() => (stage < 2 ? setPhase("rest") : setPhase("result"))}>
                {stage < 2 ? "다음 단계 →" : "결과 보기 →"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ================= 구직자: 결과 =================
  if (mode === "worker" && phase === "result") {
    const top = rankedJobs[0];
    const sortTabs = [["total", "동네 추천순"], ["fit", "적성 핏순"], ["near", "가까운 순"]];
    return (
      <div style={shell}>
        <style>{css}</style>
        {Header}
        <div style={{ width: "100%", maxWidth: 880, padding: "16px 20px 60px" }}>
          <div style={{ ...card, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.worker }}>내 성향 프로필 · 📍 {myDong}</div>
            <div style={{ fontSize: 21, fontWeight: 900, margin: "6px 0 14px" }}>
              {myDong}에서 가장 잘 맞는 일은 <span style={{ color: C.worker }}>{top.title}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
              {TRAITS.map(({ key, name, desc }) => (
                <div key={key} style={{ flex: "1 1 140px", background: "#F8F9F5", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: 13, fontWeight: 800 }}>{name}</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: C.worker }}>{profile[key]}</span>
                  </div>
                  <div style={{ height: 6, background: "#E9EBE3", borderRadius: 99, margin: "8px 0 6px", overflow: "hidden" }}>
                    <div style={{ width: `${profile[key]}%`, height: "100%", background: C.worker }} />
                  </div>
                  <div style={{ fontSize: 11, color: C.sub }}>{desc}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {STAGE3.map(({ key }) => prefs[key] && prefs[key] !== "무관" && (
                <Chip key={key} bg={C.localSoft} color={C.local}>희망 · {prefs[key]}</Chip>
              ))}
              <button onClick={resetTest} style={{ ...btn("transparent", C.sub), border: `1px solid ${C.line}`, padding: "5px 12px", fontSize: 12, borderRadius: 999 }}>다시 검사</button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "6px 4px 10px", flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>추천 공고</div>
            <div style={{ display: "flex", gap: 6 }}>
              {sortTabs.map(([k, label]) => (
                <button key={k} onClick={() => setSortKey(k)} style={{
                  padding: "6px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, fontFamily: font, cursor: "pointer",
                  border: `1.5px solid ${sortKey === k ? C.local : C.line}`,
                  background: sortKey === k ? C.localSoft : C.paper, color: sortKey === k ? C.local : C.sub,
                }}>{label}</button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {rankedJobs.map((j, i) => {
              const dt = distTone(j.walk);
              return (
                <div key={j.id} style={{ ...card, borderLeft: i === 0 ? `4px solid ${C.local}` : `1px solid ${C.line}` }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <ScoreDial score={j.total} label="종합" />
                      <ScoreDial score={j.fit} label="적성 핏" />
                    </div>
                    <div style={{ flex: "1 1 260px" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 16.5, fontWeight: 800 }}>{j.title}</span>
                        {i === 0 && <Chip bg={C.localSoft} color={C.local}>우리 동네 최적</Chip>}
                      </div>
                      <div style={{ fontSize: 12.5, color: C.sub, margin: "3px 0 8px" }}>{j.org} · 📍 {j.dong} · {j.pay}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                        <Chip bg={dt.bg} color={dt.color}>{dt.label}</Chip>
                        {j.matched.map(m => <Chip key={m} bg={C.workerSoft} color={C.worker}>✓ {m}</Chip>)}
                        {j.tags.map(t => <Chip key={t}>{t}</Chip>)}
                        <Chip bg={C.companySoft} color={C.company}>예상 근속 {tenureMonths(j.total)}개월</Chip>
                      </div>
                      <FitGauge user={profile} req={j.req} leftColor={C.worker} rightColor="#9AA3B0" />
                      <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6, marginTop: 10, background: "#F8F9F5", borderRadius: 10, padding: "10px 12px" }}>{j.note}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ================= 기업 모드 =================
  return (
    <div style={shell}>
      <style>{css}</style>
      {Header}
      <div style={{ width: "100%", maxWidth: 880, padding: "16px 20px 60px" }}>
        <div style={{ ...card, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.company }}>공고 설정</div>
          <div style={{ fontSize: 19, fontWeight: 900, margin: "6px 0 4px" }}>어느 동네에서, 어떤 성향이 필요한가요</div>
          <p style={{ fontSize: 12.5, color: C.sub, margin: "0 0 14px" }}>근무지 동네와 성향을 설정하면 가까운 동네의 잘 맞는 지원자부터 정렬됩니다.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
            <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} style={{ flex: "1 1 260px", boxSizing: "border-box", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${C.line}`, fontSize: 14.5, fontWeight: 700, fontFamily: font, outline: "none" }} />
            <DongPicker value={jobDong} onChange={setJobDong} accent={C.company} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px 22px" }}>
            {TRAITS.map(({ key, name }) => (
              <div key={key}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>
                  <span>{name}</span><span style={{ color: C.company }}>{jobReq[key]}</span>
                </div>
                <input type="range" min={0} max={100} value={jobReq[key]}
                  onChange={e => setJobReq({ ...jobReq, [key]: Number(e.target.value) })}
                  style={{ width: "100%", accentColor: C.company }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 15, fontWeight: 800, margin: "6px 4px 10px" }}>「{jobTitle}」 · 📍 {jobDong} 기준 지원자</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rankedApplicants.map((a, i) => {
            const dt = distTone(a.walk);
            return (
              <div key={a.name} style={{ ...card, borderLeft: i === 0 ? `4px solid ${C.company}` : `1px solid ${C.line}` }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <ScoreDial score={a.total} label="종합" />
                    <ScoreDial score={a.fit} label="적성 핏" />
                  </div>
                  <div style={{ flex: "1 1 260px" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 16, fontWeight: 800 }}>{a.name}</span>
                      <span style={{ fontSize: 12.5, color: C.sub }}>{a.age}세 · 📍 {a.dong} · {a.exp}</span>
                      {i === 0 && <Chip bg={C.companySoft} color={C.company}>추천 1순위</Chip>}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "8px 0 10px" }}>
                      <Chip bg={dt.bg} color={dt.color}>{dt.label}</Chip>
                      <Chip bg={C.companySoft} color={C.company}>예상 근속 {tenureMonths(a.total)}개월</Chip>
                      {a.total >= 80 && <Chip bg={C.workerSoft} color={C.worker}>숙련 투자 회수 가능</Chip>}
                      {a.total < 60 && <Chip>조기 이탈 위험</Chip>}
                    </div>
                    <FitGauge user={a.traits} req={jobReq} leftColor={C.company} rightColor="#9AA3B0" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
