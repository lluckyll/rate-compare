// 금융감독원 금융상품통합비교공시 오픈API 중계
// /api/finlife?type=deposit|saving|mortgage|rent|credit
// 약관상 정보를 저장할 수 없으므로 캐시하지 않고 매번 실시간으로 받아 전달합니다.
const ENDPOINT = {
  deposit: "depositProductsSearch",
  saving: "savingProductsSearch",
  mortgage: "mortgageLoanProductsSearch",
  rent: "rentHouseLoanProductsSearch",
  credit: "creditLoanProductsSearch",
};

export default async function handler(req, res) {
  const key = process.env.FINLIFE_API_KEY;
  if (!key) return res.status(500).json({ error: "FINLIFE_API_KEY 환경변수가 없습니다." });
  const type = req.query.type;
  const group = req.query.group || "020000"; // 020000 은행, 030300 저축은행
  if (!ENDPOINT[type]) return res.status(400).json({ error: "type 값이 올바르지 않습니다." });

  const baseList = [], optionList = [];
  try {
    let page = 1, maxPage = 1;
    do {
      const url = `https://finlife.fss.or.kr/finlifeapi/${ENDPOINT[type]}.json?auth=${key}&topFinGrpNo=${group}&pageNo=${page}`;
      const r = await fetch(url);
      const j = await r.json();
      const result = j?.result;
      if (!result || result.err_cd !== "000") {
        return res.status(502).json({ error: "금감원 API 응답 오류", detail: result?.err_msg || j });
      }
      baseList.push(...(result.baseList || []));
      optionList.push(...(result.optionList || []));
      maxPage = Number(result.max_page_no) || 1;
      page++;
    } while (page <= maxPage && page <= 10);

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ baseList, optionList });
  } catch (e) {
    return res.status(502).json({ error: "금감원 API 연결 실패", detail: String(e) });
  }
}
