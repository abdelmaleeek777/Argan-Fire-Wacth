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
      const res = await axios.get("http://localhost:5000/admin/logs", {
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-500" />
            Fire Security Logs
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Immutable fire event log with SHA-256 hash chain integrity verification.
          </p>
        </div>
        
        <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
            Integrity: {logsInfo.integrity_status}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400">
                <th className="p-5 font-bold">Event ID</th>
                <th className="p-5 font-bold">Event Type</th>
                <th className="p-5 font-bold">Details</th>
                <th className="p-5 font-bold font-mono">Blockchain Hash</th>
                <th className="p-5 font-bold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    Verifying and fetching logs...
                  </td>
                </tr>
              ) : logsInfo.logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-slate-400 font-medium">
                    No log events recorded yet.
                  </td>
                </tr>
              ) : (
                logsInfo.logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-5 text-sm font-semibold text-slate-700">
                      {log.id}
                    </td>
                    <td className="p-5">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] uppercase font-bold rounded-md">
                        {log.event_type}
                      </span>
                    </td>
                    <td className="p-5 text-sm text-slate-600">
                      {log.details || "No extra details attached."}
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-3 h-3 text-slate-300" />
                        <span className="font-mono text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-colors cursor-help" title={log.hash}>
                          {log.hash}
                        </span>
                      </div>
                    </td>
                    <td className="p-5 text-right text-xs font-medium text-slate-500">
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
