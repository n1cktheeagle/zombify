"use client";

import { useState } from "react";
import { analyzeImage, type AnalyzeModes, type PerceptionJson } from "@/lib/perceptionClient";
import { buildFactsAdapter } from "@/lib/factsAdapter";

export default function PerceptionDevPage() {
  const [url, setUrl] = useState("");
  const [modes, setModes] = useState<AnalyzeModes>(["ocr", "geometry", "contrast", "palette"]);
  const [data, setData] = useState<PerceptionJson | null>(null);
  const [facts, setFacts] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const onRun = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await analyzeImage(url, modes);
      setData(res);
      const fa = buildFactsAdapter(res);
      setFacts(fa.text);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Perception Dev</h1>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Paste signed screenshot URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button className="border rounded px-4 py-2" onClick={onRun} disabled={!url || loading}>
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="font-medium mb-2">Perception JSON</h2>
            <pre className="text-xs bg-black text-green-300 p-3 rounded overflow-auto" style={{ maxHeight: 480 }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
          <div>
            <h2 className="font-medium mb-2">Facts Text</h2>
            <pre className="text-xs bg-black text-blue-300 p-3 rounded overflow-auto" style={{ maxHeight: 480 }}>
              {facts}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
