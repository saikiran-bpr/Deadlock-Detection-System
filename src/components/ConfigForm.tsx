"use client";

import { useState, useEffect, useRef } from "react";
import { SystemState } from "@/types";

interface ConfigFormProps {
    onDetect: (state: SystemState) => void;
    onReset: () => void;
    hasResult: boolean;
    externalState?: SystemState | null;
    showToast?: (message: string, type: "success" | "error" | "info") => void;
}

export default function ConfigForm({ onDetect, onReset, hasResult, externalState, showToast }: ConfigFormProps) {
    const [numProcesses, setNumProcesses] = useState<number>(3);
    const [numResources, setNumResources] = useState<number>(3);

    const [available, setAvailable] = useState<number[]>([]);
    const [allocation, setAllocation] = useState<number[][]>([]);
    const [request, setRequest] = useState<number[][]>([]);

    const [tablesGenerated, setTablesGenerated] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());

    // Track the last loaded external state to avoid infinite loops
    const lastExternalRef = useRef<SystemState | null>(null);

    useEffect(() => {
        if (externalState && externalState !== lastExternalRef.current) {
            lastExternalRef.current = externalState;
            setNumProcesses(externalState.numProcesses);
            setNumResources(externalState.numResources);
            setAvailable([...externalState.available]);
            setAllocation(externalState.allocation.map((r) => [...r]));
            setRequest(externalState.request.map((r) => [...r]));
            setTablesGenerated(true);
        }
    }, [externalState]);

    /* -------- handlers -------- */

    const handleGenerateTables = () => {
        setAvailable(Array(numResources).fill(0));
        setAllocation(
            Array.from({ length: numProcesses }, () => Array(numResources).fill(0))
        );
        setRequest(
            Array.from({ length: numProcesses }, () => Array(numResources).fill(0))
        );
        setTablesGenerated(true);
        onReset(); // clear any previous result when tables are regenerated
    };

    const validateInputs = (): boolean => {
        const errors = new Set<string>();

        if (numProcesses < 1) errors.add("numProcesses");
        if (numResources < 1) errors.add("numResources");

        for (let j = 0; j < available.length; j++) {
            if (available[j] < 0 || !Number.isInteger(available[j])) {
                errors.add(`avail-${j}`);
            }
        }

        for (let i = 0; i < allocation.length; i++) {
            for (let j = 0; j < allocation[i].length; j++) {
                if (allocation[i][j] < 0 || !Number.isInteger(allocation[i][j])) {
                    errors.add(`alloc-${i}-${j}`);
                }
                if (request[i][j] < 0 || !Number.isInteger(request[i][j])) {
                    errors.add(`req-${i}-${j}`);
                }
            }
        }

        setValidationErrors(errors);
        return errors.size === 0;
    };

    const handleDetect = () => {
        if (!validateInputs()) {
            showToast?.("Fix invalid inputs (highlighted in red) before detecting.", "error");
            return;
        }
        setValidationErrors(new Set());

        const state: SystemState = {
            numProcesses,
            numResources,
            available,
            allocation,
            request,
        };
        onDetect(state);
        showToast?.("Detection complete!", "success");
    };

    const handleResetAll = () => {
        setNumProcesses(3);
        setNumResources(3);
        setAvailable([]);
        setAllocation([]);
        setRequest([]);
        setTablesGenerated(false);
        lastExternalRef.current = null;
        onReset();
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
                       transition-all active:scale-95 shadow-lg shadow-accent/20 cursor-pointer btn-glow"
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
                                                    className={`w-16 px-2 py-1.5 rounded-md bg-background border text-foreground text-center font-mono
                                     focus:outline-none focus:ring-2 focus:ring-accent/60 transition-all
                                     ${validationErrors.has(`avail-${i}`) ? "border-error ring-1 ring-error/40" : "border-surface-border"}`}
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
                        validationErrors={validationErrors}
                    />

                    {/* --- Request Matrix --- */}
                    <MatrixTable
                        title="Request Matrix"
                        stepNum={4}
                        matrix={request}
                        idPrefix="req"
                        onUpdate={updateRequest}
                        validationErrors={validationErrors}
                    />

                    {/* --- Action buttons --- */}
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                        <button
                            id="detectBtn"
                            onClick={handleDetect}
                            className="px-8 py-3 rounded-lg bg-accent hover:bg-accent-hover text-foreground font-semibold text-base
                         transition-all active:scale-95 shadow-lg shadow-accent/25 cursor-pointer
                         flex items-center gap-2 btn-glow"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                            Detect Deadlock
                        </button>

                        <button
                            id="resetBtn"
                            onClick={handleResetAll}
                            className="px-6 py-3 rounded-lg bg-surface border border-surface-border text-foreground/70 hover:text-foreground
                         font-medium text-base transition-all active:scale-95 cursor-pointer
                         flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                            </svg>
                            Reset All
                        </button>

                        {hasResult && (
                            <span className="text-sm text-foreground/40 ml-2">
                                ↓ Scroll down to see results
                            </span>
                        )}
                    </div>
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
    validationErrors,
}: {
    title: string;
    stepNum: number;
    matrix: number[][];
    idPrefix: string;
    onUpdate: (row: number, col: number, value: number) => void;
    validationErrors: Set<string>;
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
                                            className={`w-16 px-2 py-1.5 rounded-md bg-background border text-foreground text-center font-mono
                                 focus:outline-none focus:ring-2 focus:ring-accent/60 transition-all
                                 ${validationErrors.has(`${idPrefix}-${ri}-${ci}`) ? "border-error ring-1 ring-error/40" : "border-surface-border"}`}
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
