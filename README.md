# Deadlock Detection System

An interactive web-based system for detecting, analyzing, and preventing deadlocks in operating systems. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

### Detection Algorithms
- **Banker's Safety Algorithm** — Multi-instance resource deadlock detection with step-by-step visualization
- **Wait-For Graph (DFS Cycle Detection)** — Single-instance deadlock detection using WHITE-GRAY-BLACK coloring
- **Auto-Detection** — Automatically selects the appropriate algorithm based on resource instance counts

### Visualizations
- **Resource Allocation Graph (RAG)** — Interactive bipartite graph with animated edge flows, hover-to-highlight, and allocated/available instance indicators
- **Wait-For Graph** — Circular directed graph showing process dependencies with animated cycle highlighting
- **Process Timeline** — Gantt-style chart showing resource acquisition and blocking events over time
- **Step-by-Step Walkthrough** — Auto-play simulation of Banker's algorithm with speed control (0.5x to 4x)

### Analytics Dashboard
- Resource utilization gauges per resource type
- System load, safety margin, and deadlock probability metrics
- Contention index and process wait depth bar charts
- Risk level assessment (LOW / MEDIUM / HIGH)

### Deadlock Prevention Strategies
- **Wait-Die** — Non-preemptive timestamp-based scheme (older waits, younger dies)
- **Wound-Wait** — Preemptive timestamp-based scheme (older wounds, younger waits)
- **Resource Ordering** — Total ordering on resources to prevent circular wait
- Side-by-side comparison of all three strategies for any resource conflict

### Additional Features
- Deadlock resolution via victim process termination (auto or manual selection)
- Resource request simulation (Banker's Resource-Request Algorithm)
- Import/Export system state as JSON
- 6 pre-built sample scenarios including Dining Philosophers
- Dark/Light theme toggle
- Fully responsive design

## Tech Stack

- **Framework:** Next.js 16 (React 19)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Rendering:** Client-side (all algorithms run in the browser)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Sample Scenarios

| Scenario | Processes | Resources | Result |
|---|---|---|---|
| Safe System | 5 | 3 | Safe sequence exists |
| Multi-Instance Deadlock | 4 | 3 | Circular wait, no available |
| Single-Instance Deadlock | 3 | 3 | Perfect cycle (P0 → P1 → P2 → P0) |
| Dining Philosophers | 5 | 5 | Classic circular wait |
| High Contention | 6 | 4 | Heavy resource competition |
| Near-Deadlock (Safe) | 4 | 3 | Tight margins but resolvable |

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main application page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Theming and animations
├── components/
│   ├── RAGGraph.tsx          # Resource Allocation Graph (interactive SVG)
│   ├── WaitForGraph.tsx      # Wait-For Graph (circular layout)
│   ├── AnalyticsDashboard.tsx # System metrics, gauges, bar charts
│   ├── ProcessTimeline.tsx   # Gantt-style timeline
│   ├── DeadlockPrevention.tsx # Wait-Die / Wound-Wait / Resource Ordering
│   ├── StepByStep.tsx        # Algorithm walkthrough with auto-play
│   ├── ConfigForm.tsx        # System state input form
│   ├── ResultDisplay.tsx     # Detection result banner
│   ├── SummaryTable.tsx      # Process status table
│   ├── ResolvePanel.tsx      # Deadlock resolution controls
│   ├── SimulateRequest.tsx   # Resource request simulation
│   ├── SampleLoader.tsx      # Pre-built scenario loader
│   ├── ImportExport.tsx      # JSON import/export
│   ├── Navbar.tsx            # Navigation with section tracking
│   ├── ThemeToggle.tsx       # Dark/Light mode
│   ├── Toast.tsx             # Notification system
│   └── FadeInSection.tsx     # Scroll animation wrapper
├── lib/
│   ├── deadlockDetector.ts   # Detection, resolution, simulation algorithms
│   ├── analytics.ts          # System metrics and Wait-For Graph analysis
│   ├── prevention.ts         # Prevention strategies and timeline generation
│   ├── graphBuilder.ts       # RAG node/edge construction
│   └── sampleScenarios.ts    # Pre-configured test cases
├── hooks/
│   └── useToast.ts           # Toast notification hook
└── types/
    └── index.ts              # TypeScript interfaces
```

## Algorithms

### Banker's Safety Algorithm
Iteratively finds processes whose resource requests can be satisfied with currently available resources. Processes that complete release their allocated resources, potentially enabling other processes to finish. Unfinished processes are deadlocked.

### DFS Cycle Detection (Wait-For Graph)
Constructs a directed graph where P_i → P_j if process i waits for a resource held by process j. Uses depth-first search with WHITE-GRAY-BLACK coloring to detect cycles — a cycle indicates deadlock.

### Prevention Schemes
- **Wait-Die / Wound-Wait:** Timestamp-based schemes that impose ordering on process-resource access to prevent circular wait conditions
- **Resource Ordering:** Assigns a total order to resources; processes must request resources in increasing order only
