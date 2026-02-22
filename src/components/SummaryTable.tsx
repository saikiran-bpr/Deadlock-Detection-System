"use client";

import { SystemState, DetectionResult } from "@/types";
import { StepState } from "@/components/RAGGraph";

interface SummaryTableProps {
    state: SystemState;
    result: DetectionResult | null;
    stepState?: StepState | null;
}

export default function SummaryTable({ state, result, stepState }: SummaryTableProps) {
    const formatArray = (arr: number[]) => `[${arr.join(", ")}]`;

    const getProcessStatus = (i: number): "Deadlocked" | "Waiting" | "Running" | "Completed" => {
        // step-by-step completed overrides
        if (stepState?.finishedProcesses[i]) {
            return "Completed";
        }

        if (result?.isDeadlocked && result.deadlockedProcesses.includes(i)) {
            return "Deadlocked";
        }

        const hasRequests = state.request[i].some((r) => r > 0);
        if (hasRequests) return "Waiting";

        return "Running";
    };

    const getStatusBadgeClass = (status: ReturnType<typeof getProcessStatus>) => {
        switch (status) {
            case "Deadlocked":
                return "bg-error/20 text-error border border-error/50";
            case "Waiting":
                return "bg-yellow-500/20 text-yellow-500 border border-yellow-500/50";
            case "Running":
                return "bg-success/20 text-success border border-success/50";
            case "Completed":
                return "bg-gray-500/20 text-gray-400 border border-gray-500/50";
        }
    };

    const getRowClass = (i: number) => {
        if (!stepState) return "hover:bg-surface-border/20 transition-colors";

        if (stepState.currentProcess === i) {
            return "bg-accent/15 border-l-2 border-l-accent transition-colors";
        }
        if (stepState.finishedProcesses[i]) {
            return "opacity-50 transition-colors";
        }
        return "hover:bg-surface-border/20 transition-colors";
    };

    return (
        <div className="bg-surface border border-surface-border rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-surface-border/50 text-foreground">
                            <th className="px-4 py-3 font-semibold text-sm border-b border-surface-border">Process</th>
                            <th className="px-4 py-3 font-semibold text-sm border-b border-surface-border">Allocated Resources</th>
                            <th className="px-4 py-3 font-semibold text-sm border-b border-surface-border">Requested Resources</th>
                            <th className="px-4 py-3 font-semibold text-sm border-b border-surface-border">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                        {state.allocation.map((alloc, i) => {
                            const req = state.request[i];
                            const status = getProcessStatus(i);

                            return (
                                <tr key={i} className={getRowClass(i)}>
                                    <td className="px-4 py-3 text-sm font-medium">P{i}</td>
                                    <td className="px-4 py-3 text-sm text-foreground/80 font-mono tracking-wider">
                                        {formatArray(alloc)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-foreground/80 font-mono tracking-wider">
                                        {formatArray(req)}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(status)}`}>
                                            {status}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
