// frontend/src/features/diagnosis/Diagnosis.js
import React, { useEffect, useMemo, useState, useCallback } from "react";

const BASE = process.env.REACT_APP_API_BASE || "http://3.38.231.114:8090";  //2025.10.30 localhost -> 192.168.0.97
const API_PREFIX = process.env.REACT_APP_API_PREFIX || "";

/* ---------- 🔧 응답 정규화 유틸 ---------- */
function normalizePayload(raw) {
  if (!raw || typeof raw !== "object") return { raw };

  const images = raw.images || {};

  const pickNum = (...vals) => {
    for (const v of vals) {
      if (typeof v === "number" && Number.isFinite(v)) return v;
      if (v != null && !Number.isNaN(+v)) return +v;
    }
    return null;
  };

  const pickStr = (...vals) => {
    for (const v of vals) {
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return null;
  };

  // diagId/xrayId도 최대한 폭넓게 회수
  const diagId = pickNum(raw.diagId, raw?.result?.diagId, raw?.data?.diagId);
  const xrayId = pickNum(raw.xrayId, raw?.result?.xrayId, raw?.data?.xrayId);

  return {
    diagId,
    xrayId,
    pred: pickStr(
      raw.pred,
      raw.pred_label,
      raw.label,
      raw.aiResult,
      raw?.result?.pred
    ),
    prob: pickNum(
      raw.prob,
      raw.pred_prob,
      raw.confidence,
      raw.score,
      raw?.result?.prob
    ),
    overlayUrl:
      raw.overlayUrl ||
      images.overlay ||
      raw?.result?.overlayUrl ||
      raw?.result?.images?.overlay ||
      null,
    originalUrl:
      raw.originalUrl ||
      images.original ||
      raw?.result?.originalUrl ||
      raw?.result?.images?.original ||
      null,
    camLayer:
      raw.camLayer || raw.target_layer_used || raw?.result?.camLayer || null,
    threshold:
      pickNum(raw.threshold, raw.threshold_used, raw?.result?.threshold) ??
      null,
    raw,
  };
}

/* ---------- 🔍 컴포넌트 ---------- */
function Diagnosis({ xrayId, currentUser, onNavigate }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [result, setResult] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [llmSummary, setLlmSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusCd, setStatusCd] = useState(null); // 'D' or 'P'
  const [savedAiImpression, setSavedAiImpression] = useState(""); // ✅ COMPLETED일 때 과거 AI_IMPRESSION 표시용

  /* ---------- API 경로 ---------- */
  const API = useMemo(
    () => ({
      POST_ANALYZE_BY_ID: `${BASE}${API_PREFIX}/api/analyze/by-id`,
      GET_RESULT_BY_ID: (id) =>
        `${BASE}${API_PREFIX}/api/analyze/result?xrayId=${encodeURIComponent(
          id
        )}&ts=${Date.now()}`,
      POST_LLM_SUMMARY: "http://3.39.204.180:8000/api/llm-summarize",
      POST_SAVE_DIAGNOSIS: `${BASE}${API_PREFIX}/diagnosis/update`,
    }),
    []
  );

  const toAbsUrl = useCallback((u) => {
    if (!u) return null;
    if (/^https?:\/\//i.test(u)) return u;
    return `${BASE}${u.startsWith("/") ? "" : "/"}${u}`;
  }, []);

  /* ---------- 분석 호출 ---------- */
  const analyzeById = useCallback(
    async (id, signal) => {
      const res = await fetch(API.POST_ANALYZE_BY_ID, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xrayId: id }),
        signal,
        cache: "no-store",
      });

      const text = await res.text().catch(() => "");
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {}

      if (!res.ok || (json && json.ok === false)) {
        const msg =
          (json && (json.error || json.message)) ||
          text ||
          `POST /api/analyze/by-id failed (${res.status})`;
        throw new Error(msg);
      }

      // 백엔드가 바로 맵을 반환하므로 그것 자체를 normalize
      return normalizePayload(json?.result || json?.data || json || {});
    },
    [API]
  );

  /* ---------- 최신 저장 결과 로드 (의사 기록/상태 + AI_IMPRESSION 포함) ---------- */
  const loadLatest = useCallback(
    async (id, signal) => {
      const res = await fetch(API.GET_RESULT_BY_ID(id), {
        method: "GET",
        signal,
        cache: "no-store",
      });
      const text = await res.text().catch(() => "");
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {}
      if (!res.ok || !json) {
        // 저장 결과가 없을 수도 있으니 null 반환
        return null;
      }
      const payload = normalizePayload(
        json?.result || json?.data || json || {}
      );
      // 추가 필드 포함
      payload.doctorResult =
        json.doctorResult ?? json?.result?.doctorResult ?? null;
      payload.doctorImpression =
        json.doctorImpression ?? json?.result?.doctorImpression ?? null;
      payload.statusCd = json.statusCd ?? json?.result?.statusCd ?? null;
      payload.aiImpression =
        json.aiImpression ?? json?.result?.aiImpression ?? null; // ✅ 서버에서 내려주는 과거 AI 요약
      payload.diagId = payload.diagId ?? json.diagId ?? null;
      return payload;
    },
    [API]
  );

  /* ---------- 진입 시: 최신 기록 확인 -> 필요 시 분석 ---------- */
  useEffect(() => {
    if (!xrayId) return;
    let active = true;
    const ac = new AbortController();

    (async () => {
      try {
        setErr(null);
        setLoading(true);
        setSavedAiImpression(""); // 새 xrayId 진입 시 초기화

        // 1) 최신 저장본 우선 확인
        const latest = await loadLatest(xrayId, ac.signal);
        console.log("Latest saved diagnosis:", latest);
        if (!active) return;

        if (latest) {
          console.log("Found existing diagnosis record.");
          const normalized = {
            diagId: latest.diagId ?? latest.raw?.diagId ?? null,
            xrayId: latest.xrayId ?? xrayId,
            pred: latest.pred ?? "-",
            prob: typeof latest.prob === "number" ? latest.prob : null,
            overlayUrl: toAbsUrl(latest.overlayUrl),
            originalUrl: toAbsUrl(latest.originalUrl),
            camLayer: latest.camLayer ?? null,
            threshold: latest.threshold ?? null,
            raw: latest.raw,
          };
          setResult(normalized);
          setStatusCd(latest.statusCd || null);

          // COMPLETED(D)면 과거 기록 프리필 + AI_IMPRESSION 표시 + 분석 생략
          if ((latest.statusCd || "").toUpperCase() === "D") {
            if (latest.doctorResult) setDiagnosis(latest.doctorResult);
            if (latest.doctorImpression)
              setDoctorNotes(latest.doctorImpression);
            if (latest.aiImpression) setSavedAiImpression(latest.aiImpression); // ✅ 표시
            return; // 분석 호출 생략
          }
        }
        else {
          console.log("No existing diagnosis record found.");
          // 2) COMPLETED가 아니면(또는 기록 없음) 분석 호출하여 신규 결과 생성
          const analyzed = await analyzeById(xrayId, ac.signal);
          if (!active) return;
          const normalized2 = {
            diagId: analyzed.diagId ?? analyzed.raw?.diagId ?? null,
            xrayId: analyzed.xrayId ?? xrayId,
            pred: analyzed.pred ?? "-",
            prob: typeof analyzed.prob === "number" ? analyzed.prob : null,
            overlayUrl: toAbsUrl(analyzed.overlayUrl),
            originalUrl: toAbsUrl(analyzed.originalUrl),
            camLayer: analyzed.camLayer ?? null,
            threshold: analyzed.threshold ?? null,
            raw: analyzed.raw,
          };
          setResult(normalized2);
          // 초기 진단결과는 모델 판독으로 채움(수정 가능)
          const pctStr =
            typeof normalized2.prob === "number"
              ? ` (${(normalized2.prob * 100).toFixed(1)}%)`
              : "";
          setDiagnosis(`모델 판독: ${normalized2.pred ?? "-"}` + pctStr);
        }

      } catch (e) {
        if (e.name !== "AbortError") {
          setErr(e.message || "분석 요청 실패");
          setResult(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      ac.abort();
    };
  }, [xrayId, analyzeById, loadLatest, toAbsUrl]);

  /* ---------- LLM 요약 ---------- */
  const handleLLMSummarize = async () => {
    if (!result) {
      setErr("먼저 분석을 실행해 주세요.");
      return;
    }
    console.log("LLM 요약 요청 이미지 URL:", result.originalUrl);
    setLlmSummary("요약 생성 중...");
    try {
      const res = await fetch(API.POST_LLM_SUMMARY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pred_label: result.pred,
          pred_prob: result.prob,
          image_data_url: result.originalUrl,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok)
        throw new Error(data?.error || "요약 생성 실패");
      setLlmSummary(data.summary || "");
      setDoctorNotes(data.summary || "");
    } catch (e) {
      setErr(e.message);
      setLlmSummary("");
    }
  };

  /* ---------- 저장 ---------- */
  const handleSave = async () => {
    if (!diagnosis || !doctorNotes) {
      setErr("진단 결과와 의사 소견을 입력해 주세요.");
      return;
    }
    if (!result?.diagId && !result?.xrayId) {
      setErr("분석 결과가 없습니다. 먼저 분석을 실행해 주세요.");
      return;
    }

    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(API.POST_SAVE_DIAGNOSIS, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // diagId를 우선적으로 보낸다(정확한 행 업데이트)
          diagId: result?.diagId ?? null,
          xrayId: result?.xrayId ?? Number(xrayId),
          doctorId: currentUser?.userId || "SYSTEM",
          aiResult: result?.pred || null,
          aiImpression: llmSummary || null, // 새 요약을 덮어쓰려면 사용
          doctorResult: diagnosis,
          doctorImpression: doctorNotes,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || "저장 실패");
      alert("진단 내용이 성공적으로 저장되었습니다.");
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const goList = () => onNavigate?.("diagnosis-list");

  /* ---------- UI ---------- */
  return (
    <div className="text-white p-6">
      {/* 헤더 */}
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">X-ray 분석 및 LLM 요약</h1>
        <div className="flex gap-2">
          <button
            onClick={goList}
            className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600"
          >
            목록으로
          </button>
          {process.env.NODE_ENV === "development" && (
          <button
            onClick={() => setShowDebug((s) => !s)}
            className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600"
          >
            디버그 {showDebug ? "▲" : "▼"}
            </button>
          )}
        </div>
      </div>

      {/* 상태 알림 */}
      {err && (
        <div className="p-3 mb-4 rounded bg-red-900/40 text-red-300">{err}</div>
      )}
      {loading && <div className="text-gray-400 mb-4">분석 중…</div>}

      {/* 상단: 원본(좌) / CAM(우) */}
      {result ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 원본 이미지 (좌) */}
            <div className="p-4 rounded-xl bg-gray-800/60">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm text-gray-300 font-medium">
                  원본 이미지
                </div>
                <div className="text-xs text-gray-500">
                  {result.threshold != null && (
                    <span>th: {String(result.threshold)}</span>
                  )}
                </div>
              </div>
              {result.originalUrl ? (
                <img
                  src={result.originalUrl}
                  alt="original"
                  className="rounded-lg w-full max-h-[580px] object-contain bg-black"
                />
              ) : (
                <div className="text-gray-500 text-sm">
                  원본 이미지가 없습니다.
                </div>
              )}
            </div>

            {/* Grad-CAM (우) */}
            <div className="p-4 rounded-xl bg-gray-800/60">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm text-gray-300 font-medium">
                  Grad-CAM Overlay
                </div>
                <div className="text-xs text-gray-500">
                  {result.camLayer && `CAM: ${result.camLayer}`}
                </div>
              </div>
              {result.overlayUrl ? (
                <img
                  src={result.overlayUrl}
                  alt="overlay"
                  className="rounded-lg w-full max-h-[580px] object-contain bg-black"
                />
              ) : (
                <div className="text-gray-500 text-sm">
                  오버레이 이미지가 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* 하단: 예측 카드 + 의사 입력 */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 예측 요약 카드 */}
            <div className="lg:col-span-1 p-4 rounded-xl bg-gray-800/60">
              <div className="text-gray-400 text-sm mb-1">예측 요약</div>
              <div className="text-xl font-semibold">
                {result.pred}{" "}
                {typeof result.prob === "number" && (
                  <span className="text-gray-400 ml-2">
                    ({(result.prob * 100).toFixed(1)}%)
                  </span>
                )}
              </div>
              <div className="mt-3 text-xs text-gray-400 space-y-1">
                <div>이미지: #{result.xrayId}</div>
                {result.diagId != null && (
                  <div>진단 건: DIAG_ID #{result.diagId}</div>
                )}
                {statusCd && (
                  <div>
                    상태:{" "}
                    <span
                      className={
                        statusCd.toUpperCase() === "D"
                          ? "text-green-400"
                          : "text-yellow-300"
                      }
                    >
                      {statusCd.toUpperCase() === "D" ? "COMPLETED" : "PENDING"}
                    </span>
                  </div>
                )}
                {result.camLayer && <div>CAM Layer: {result.camLayer}</div>}
                {result.threshold != null && (
                  <div>Threshold: {String(result.threshold)}</div>
                )}
              </div>
            </div>

            {/* 진단 결과 입력 */}
            <div className="lg:col-span-1 p-4 rounded-xl bg-gray-800/60">
              <label className="block text-sm text-gray-300 mb-2">
                진단 결과
              </label>
              <input
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                placeholder="예) 모델 판독: PNEUMONIA (85.2%)"
              />
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold disabled:opacity-60"
                >
                  {saving ? "저장 중…" : "저장하기"}
                </button>
              </div>
            </div>

            {/* 의사 소견 + LLM 요약 */}
            <div className="lg:col-span-1 p-4 rounded-xl bg-gray-800/60">
              {/* ✅ COMPLETED(D)일 때 저장된 과거 AI 요약(읽기 전용) 표시 */}
              {savedAiImpression && (
                <div className="mb-3">
                  <div className="text-xs text-gray-400 mb-1">
                    저장된 AI 요약(읽기 전용)
                  </div>
                  <div className="text-xs text-gray-300 bg-gray-900 p-3 rounded whitespace-pre-wrap">
                    {savedAiImpression}
                  </div>
                  <hr className="my-3 border-gray-700" />
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-300">의사 소견</label>
                <button
                  onClick={handleLLMSummarize}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded"
                  disabled={
                    (statusCd || "").toUpperCase() === "D" &&
                    !!savedAiImpression
                  }
                  title={
                    (statusCd || "").toUpperCase() === "D" &&
                    !!savedAiImpression
                      ? "COMPLETED: 저장된 AI 요약이 있습니다"
                      : undefined
                  }
                >
                  LLM 요약 만들기
                </button>
              </div>
              {llmSummary && (
                <div className="text-xs text-gray-300 bg-gray-900 p-3 rounded mb-2 whitespace-pre-wrap">
                  {llmSummary}
                </div>
              )}
              <textarea
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                rows="6"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                placeholder="LLM 초안을 수정하거나 직접 작성"
              />
            </div>
          </div>

          {showDebug && (
            <pre className="mt-6 p-3 rounded bg-gray-900/60 text-xs overflow-x-auto">
              {JSON.stringify(result.raw || result, null, 2)}
            </pre>
          )}
        </>
      ) : (
        <div className="text-gray-400">분석 결과가 아직 없습니다.</div>
      )}
    </div>
  );
}

export default Diagnosis;
