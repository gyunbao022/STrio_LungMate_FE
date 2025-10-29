import React, { useState } from "react";

// 예시 데이터 (실서비스에서는 API 데이터로 대체)
const initialDiagnosisData = [
  {
    xrayId: "1",
    patientId: "10001",
    uploader: "xray01",
    registrationDate: "2025-09-30",
    status: "PENDING",
  },
  {
    xrayId: "2",
    patientId: "10002",
    uploader: "xray02",
    registrationDate: "2025-09-30",
    status: "PENDING",
  },
  {
    xrayId: "3",
    patientId: "10003",
    uploader: "xray01",
    registrationDate: "2025-10-01",
    status: "COMPLETED",
  },
];

function DiagnosisList({ onNavigate }) {
  const [diagnosisData] = useState(initialDiagnosisData);
  const [patientIdFilter, setPatientIdFilter] = useState("");
  const [uploaderFilter, setUploaderFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const getStatusChip = (status) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="bg-yellow-900 text-yellow-300 text-xs font-semibold px-3 py-1 rounded-full">
            PENDING
          </span>
        );
      case "COMPLETED":
        return (
          <span className="bg-green-900 text-green-300 text-xs font-semibold px-3 py-1 rounded-full">
            COMPLETED
          </span>
        );
      default:
        return (
          <span className="bg-gray-700 text-gray-300 text-xs font-semibold px-3 py-1 rounded-full">
            {status}
          </span>
        );
    }
  };

  const getStatusButtonClass = (filterName) =>
    `px-4 py-2 rounded-lg font-semibold transition-colors duration-200 w-full ${
      statusFilter === filterName
        ? "bg-blue-600 text-white"
        : "bg-gray-700 hover:bg-gray-600 text-gray-300"
    }`;

  const filteredData = diagnosisData
    .filter((i) =>
      i.patientId.toLowerCase().includes(patientIdFilter.toLowerCase())
    )
    .filter((i) =>
      i.uploader.toLowerCase().includes(uploaderFilter.toLowerCase())
    )
    .filter((i) => i.registrationDate.includes(dateFilter))
    .filter((i) => (statusFilter === "ALL" ? true : i.status === statusFilter));

  return (
    <div className="bg-[#1a202c] text-white p-8 rounded-lg min-h-screen">
      <h1 className="text-2xl font-bold mb-6">판독 리스트</h1>

      {/* 필터 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-800/50 rounded-lg">
        <div>
          <label
            htmlFor="patientId"
            className="block text-sm font-medium text-gray-400 mb-1"
          >
            환자 ID
          </label>
          <input
            id="patientId"
            type="text"
            placeholder="환자 ID로 검색..."
            className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-blue-200 focus:ring-opacity-50"
            value={patientIdFilter}
            onChange={(e) => setPatientIdFilter(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="uploader"
            className="block text-sm font-medium text-gray-400 mb-1"
          >
            업로더
          </label>
          <input
            id="uploader"
            type="text"
            placeholder="업로더로 검색..."
            className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-blue-200 focus:ring-opacity-50"
            value={uploaderFilter}
            onChange={(e) => setUploaderFilter(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="regDate"
            className="block text-sm font-medium text-gray-400 mb-1"
          >
            등록일
          </label>
          <input
            id="regDate"
            type="date"
            className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-blue-200 focus:ring-opacity-50 text-white"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-400 mb-1">
            상태
          </label>
          <div className="flex items-center justify-around space-x-2 bg-gray-700 p-1 rounded-lg h-full">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={getStatusButtonClass("ALL")}
            >
              전체
            </button>
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={getStatusButtonClass("PENDING")}
            >
              PENDING
            </button>
            <button
              onClick={() => setStatusFilter("COMPLETED")}
              className={getStatusButtonClass("COMPLETED")}
            >
              COMPLETED
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="border-b border-gray-600">
            <tr>
              <th className="p-4">X-ray ID</th>
              <th className="p-4">환자ID</th>
              <th className="p-4">업로더</th>
              <th className="p-4">등록일</th>
              <th className="p-4">상태</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-8 text-gray-500">
                  검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr
                  key={item.xrayId}
                  className="border-b border-gray-700 hover:bg-gray-800 transition-colors duration-200"
                >
                  <td className="p-4">{item.xrayId}</td>
                  <td className="p-4">{item.patientId}</td>
                  <td className="p-4">{item.uploader}</td>
                  <td className="p-4">{item.registrationDate}</td>
                  <td className="p-4">{getStatusChip(item.status)}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() =>
                        onNavigate("view-diagnosis", { xrayId: item.xrayId })
                      }
                      className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-5 rounded"
                    >
                      열기
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DiagnosisList;
