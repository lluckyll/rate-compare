// 한국은행 ECOS: 기준금리(통계표 722Y001, 항목 0101000) 월별 최근 3년
export default async function handler(req, res) {
  const key = process.env.ECOS_API_KEY;
  if (!key) return res.status(500).json({ error: "ECOS_API_KEY 환경변수가 없습니다." });

  const now = new Date(Date.now() + 9 * 3600 * 1000); // 한국 시간
  const ym = d => `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const end = ym(now);
  const startDate = new Date(Date.UTC(now.getUTCFullYear() - 3, now.getUTCMonth(), 1));
  const start = ym(startDate);

  const url = `https://ecos.bok.or.kr/api/StatisticSearch/${key}/json/kr/1/100/722Y001/M/${start}/${end}/0101000`;
  try {
    const r = await fetch(url);
    const j = await r.json();
    const rows = j?.StatisticSearch?.row;
    if (!rows) return res.status(502).json({ error: "ECOS 응답 오류", detail: j?.RESULT || j });
    const history = rows.map(x => [`${x.TIME.slice(0, 4)}-${x.TIME.slice(4, 6)}`, Number(x.DATA_VALUE)]);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ history });
  } catch (e) {
    return res.status(502).json({ error: "ECOS 연결 실패", detail: String(e) });
  }
}
