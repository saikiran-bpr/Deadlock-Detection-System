"use client";

import { useState } from "react";

export default function ConfigForm() {
  const [numProcesses, setNumProcesses] = useState<number>(3);
  const [numResources, setNumResources] = useState<number>(3);

  const [available, setAvailable] = useState<number[]>([]);
  const [allocation, setAllocation] = useState<number[][]>([]);
  const [request, setRequest] = useState<number[][]>([]);

  const [tablesGenerated, setTablesGenerated] = useState(false);

  /* -------- handlers -------- */

  const handleGenerateTables = () => {
    setAvailable(Array(numResources).fill(0));
    setAllocation(
      Array.from({ length: numProcesses }, () =>
        Array(numResources).fill(0)
      )
    );
    setRequest(
      Array.from({ length: numProcesses }, () =>
        Array(numResources).fill(0)
      )
    );
    setTablesGenerated(true);
  };

  const updateAvailable = (idx: number, value: number) => {
    setAvailable((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const updateAllocation = (row: number, col: number, value: number) => {
    setAllocation((prev) =>
      prev.map((r, ri) =>
        ri === row ? r.map((c, ci) => (ci === col ? value : c)) : r
      )
    );
  };

  const updateRequest = (row: number, col: number, value: number) => {
    setRequest((prev) =>
      prev.map((r, ri) =>
        ri === row ? r.map((c, ci) => (ci === col ? value : c)) : r
      )
    );
  };

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  /* -------- sub-components -------- */

  const NumberField = ({
    id,
    label,
    value,
    onChange,
    min = 0,
    max = 99,
  }: {
    id: string;
    label: string;
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
  }) => (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground/70">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value), min, max))}
        className="w-28 px-3 py-2 rounded-lg bg-surface border border-surface-border text-foreground text-center text-base font-mono
                   focus:outline-none focus:ring-2 focus:ring-accent/60 transition-all"
      />
    </div>
  );

  /* -------- render -------- */

  return (
    <section className="w-full max-w-5xl mx-auto space-y-10">
      {/* ===== Step 1: Dimensions ===== */}
      <div className="bg-surface/60 backdrop-blur-md border border-surface-border rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
        <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent/20 text-accent text-sm font-bold">
            1
          </span>
          System Configuration
        </h2>

        <div className="flex flex-wrap items-end gap-6">
          <NumberField
            id="numProcesses"
            label="Number of Processes"
            value={numProcesses}
            onChange={(v) => setNumProcesses(v)}
            min={1}
            max={10}
          />
          <NumberField
            id="numResources"
            label="Number of Resources"
            value={numResources}
            onChange={(v) => setNumResources(v)}
            min={1}
            max={10}
          />

          <button
            id="generateTablesBtn"
            onClick={handleGenerateTables}
            className="px-6 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-foreground font-medium text-sm
                       transition-all active:scale-95 shadow-lg shadow-accent/20 cursor-pointer"
          >
            Generate Tables
          </button>
        </div>
      </div>

      {/* ===== Step 2: Matrices (shown after Generate) ===== */}
      {tablesGenerated && (
        <div className="space-y-8 animate-[fadeSlideIn_0.4s_ease-out]">
          {/* --- Available Instances --- */}
          <div className="bg-surface/60 backdrop-blur-md border border-surface-border rounded-2xl p-6 md:p-8 space-y-4 shadow-xl">
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent/20 text-accent text-sm font-bold">
                2
              </span>
              Available Instances
            </h2>

            <div className="overflow-x-auto">
              <table className="border-collapse">
                <thead>
                  <tr>
                    {available.map((_, i) => (
                      <th
                        key={i}
                        className="px-4 py-2 text-xs font-semibold text-accent tracking-wider uppercase"
                      >
                        R{i}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {available.map((val, i) => (
                      <td key={i} className="px-2 py-2">
                        <input
                          id={`avail-${i}`}
                          type="number"
                          min={0}
                          value={val}
                          onChange={(e) =>
                            updateAvailable(i, Math.max(0, Number(e.target.value)))
                          }
                          className="w-16 px-2 py-1.5 rounded-md bg-background border border-surface-border text-foreground text-center font-mono
                                     focus:outline-none focus:ring-2 focus:ring-accent/60 transition-all"
                        />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* --- Allocation Matrix --- */}
          <MatrixTable
            title="Allocation Matrix"
            stepNum={3}
            matrix={allocation}
            idPrefix="alloc"
            onUpdate={updateAllocation}
          />

          {/* --- Request Matrix --- */}
          <MatrixTable
            title="Request Matrix"
            stepNum={4}
            matrix={request}
            idPrefix="req"
            onUpdate={updateRequest}
          />
        </div>
      )}
    </section>
  );
}

/* ============================================================
   Reusable Matrix Table
   ============================================================ */

function MatrixTable({
  title,
  stepNum,
  matrix,
  idPrefix,
  onUpdate,
}: {
  title: string;
  stepNum: number;
  matrix: number[][];
  idPrefix: string;
  onUpdate: (row: number, col: number, value: number) => void;
}) {
  if (matrix.length === 0) return null;

  const numCols = matrix[0].length;

  return (
    <div className="bg-surface/60 backdrop-blur-md border border-surface-border rounded-2xl p-6 md:p-8 space-y-4 shadow-xl">
      <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent/20 text-accent text-sm font-bold">
          {stepNum}
        </span>
        {title}
      </h2>

      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              {/* empty corner cell */}
              <th className="px-4 py-2" />
              {Array.from({ length: numCols }, (_, i) => (
                <th
                  key={i}
                  className="px-4 py-2 text-xs font-semibold text-accent tracking-wider uppercase"
                >
                  R{i}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, ri) => (
              <tr key={ri}>
                <td className="px-4 py-2 text-sm font-semibold text-foreground/70 whitespace-nowrap">
                  P{ri}
                </td>
                {row.map((val, ci) => (
                  <td key={ci} className="px-2 py-2">
                    <input
                      id={`${idPrefix}-${ri}-${ci}`}
                      type="number"
                      min={0}
                      value={val}
                      onChange={(e) =>
                        onUpdate(ri, ci, Math.max(0, Number(e.target.value)))
                      }
                      className="w-16 px-2 py-1.5 rounded-md bg-background border border-surface-border text-foreground text-center font-mono
                                 focus:outline-none focus:ring-2 focus:ring-accent/60 transition-all"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
