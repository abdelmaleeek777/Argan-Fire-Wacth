import React, { useState, useEffect } from "react";
import axios from "axios";
import { FileText, Loader2, Link as LinkIcon, CheckCircle2 } from "lucide-react";

export default function AdminLogs() {
  const [logsInfo, setLogsInfo] = useState({ logs: [], integrity_status: "Checking..." });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/admin/logs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogsInfo(res.data);
    } catch (err) {
      console.error("Error fetching logs", err);
      setLogsInfo({ logs: [], integrity_status: "Error fetching data" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-[700] text-[#1F2A22] tracking-tight flex items-center gap-3">
            <div className="w-[48px] h-[48px] rounded-[14px] bg-[#DCE3D6] flex items-center justify-center border border-[#4F5C4A]/[0.10]">
              <FileText className="w-6 h-6 text-[#4E6B4A]" />
            </div>
            Fire Security Logs
          </h1>
          <p className="text-[#6B7468] text-[14px] mt-1 font-medium">
            Immutable fire event log with SHA-256 hash chain integrity verification.
          </p>
        </div>
        
        <div className="bg-[#4E6B4A]/12 border border-[#4E6B4A]/20 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-[#4E6B4A]" />
          <span className="text-[11px] font-[800] text-[#2F4A36] uppercase tracking-widest">
            Integrity: {logsInfo.integrity_status}
          </span>
        </div>
      </div>

      <div className="bg-[#F8F7F2] rounded-[2rem] border border-[#4F5C4A]/[0.10] shadow-[0_8px_24px_rgba(31,42,33,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#DCE3D6]/40 border-b border-[#4F5C4A]/[0.10] text-[#6B7468] text-[11px] uppercase tracking-widest font-[800]">
                <th className="p-6">Event ID</th>
                <th className="p-6">Event Type</th>
                <th className="p-6">Details</th>
                <th className="p-6 font-mono">Blockchain Hash</th>
                <th className="p-6 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#4F5C4A]/[0.05]">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-20 text-center text-[#6B7468] font-[700]">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#4E6B4A]" />
                    Verifying and fetching ledger entries...
                  </td>
                </tr>
              ) : logsInfo.logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-20 text-center text-[#6B7468] font-bold text-[14px]">
                    No log events recorded yet.
                  </td>
                </tr>
              ) : (
                logsInfo.logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-[#DCE3D6]/30 transition-colors group">
                    <td className="p-6 text-[14px] font-[700] text-[#1F2A22]">
                      #{log.id}
                    </td>
                    <td className="p-6">
                      <span className="px-2.5 py-1 bg-[#DCE3D6] text-[#2F4A36] text-[10px] uppercase font-[800] rounded-md border border-[#4F5C4A]/[0.10]">
                        {log.event_type}
                      </span>
                    </td>
                    <td className="p-6 text-[14px] text-[#1F2A22] font-medium">
                      {log.details || "No extra details attached."}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-3.5 h-3.5 text-[#B88A44]" />
                        <span className="font-mono text-[11px] text-[#6B7468] bg-[#DCE3D6]/50 px-2 py-1 rounded border border-[#4F5C4A]/[0.05] group-hover:text-[#4E6B4A] group-hover:border-[#4E6B4A]/20 transition-colors cursor-help truncate max-w-[180px]" title={log.hash}>
                          {log.hash}
                        </span>
                      </div>
                    </td>
                    <td className="p-6 text-right text-[12px] font-bold text-[#6B7468]">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
