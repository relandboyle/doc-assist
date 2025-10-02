'use client'

import React, { useMemo, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import type { ColDef, GridApi, ValueGetterParams, GridReadyEvent } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css"; // or alpine
import ExpanderCellRenderer, { Row, ChildRow, DetailRow, DetailFullWidthRenderer } from "./renderer";

// Ensure AG Grid modules are registered on the client
import { useEffect } from "react";
function useRegisterAgModules() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      ModuleRegistry.registerModules([AllCommunityModule]);
    }
  }, []);
}

const AgGridReactNoSSR = dynamic(async () => (await import("ag-grid-react")).AgGridReact, {
  ssr: false,
}) as unknown as typeof import("ag-grid-react").AgGridReact;

export default function ParentGrid() {
  useRegisterAgModules();
  const gridApiRef = useRef<GridApi | null>(null);
  // ColumnApi was removed in v33; derive from GridApi when needed

  // demo data
  const [parents] = useState<Row[]>([
    { id: "A-1001", name: "Acme Corp", status: "Open", amount: 12345 },
    { id: "B-1002", name: "Beta LLC", status: "Pending", amount: 6789 },
    { id: "C-1003", name: "Cobalt Inc", status: "Closed", amount: 2222 },
  ]);

  // expansion state lives in parent to keep single source of truth
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // keep first column spanning across all columns while expanded OR collapsing to avoid UI shift
  const [spanning, setSpanning] = useState<Set<string>>(new Set());
  const ANIM_MS = 260;

  const isExpanded = useCallback((id: string) => expanded.has(id), [expanded]);

  const toggleExpand = useCallback((id: string) => {
    const isOpenNow = expanded.has(id);
    if (isOpenNow) {
      // Start collapse: keep spanning so hidden columns don't snap back yet
      setExpanded((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      // After animation, remove spanning and normalize heights
      setTimeout(() => {
        setSpanning((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        gridApiRef.current?.resetRowHeights();
      }, ANIM_MS);
    } else {
      // Start expand: add spanning immediately, then mark expanded
      setSpanning((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      setExpanded((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      // measure after DOM updates
      setTimeout(() => gridApiRef.current?.resetRowHeights(), 0);
    }
  }, [expanded]);

  const getChildRows = useCallback((id: string): ChildRow[] => {
    // Replace with your real fetch/derive logic per parent id
    const base = id.slice(0, 1);
    return [
      { lineId: `${id}-01`, item: `${base} - Widget`, qty: 2, price: 199.99 },
      { lineId: `${id}-02`, item: `${base} - Adapter`, qty: 1, price: 49.5 },
      { lineId: `${id}-03`, item: `${base} - Cables`, qty: 3, price: 9.99 },
    ];
  }, []);

  const getDisplayedColCount = useCallback(() => {
    const defs = gridApiRef.current?.getColumnDefs() ?? [];
    return Array.isArray(defs) ? defs.length : 1;
  }, []);

  // interleave detail rows after expanded parents
  const rowData = useMemo<(Row | DetailRow)[]>(() => {
    const out: (Row | DetailRow)[] = [];
    for (const p of parents) {
      out.push(p);
      if (expanded.has(p.id)) out.push({ kind: "detail", parent: p });
    }
    return out;
  }, [parents, expanded]);

  const columnDefs = useMemo<ColDef<any>[]>(() => {
    return [
      {
        headerName: "",
        field: "name",
        flex: 1,
        minWidth: 260,
        autoHeight: true,
        cellRenderer: (params: any) => {
          const d = params.data as Row | DetailRow;
          if ((d as any)?.kind === "detail") return null;
          return ExpanderCellRenderer({
            ...(params as any),
            isExpanded,
            toggleExpand,
            getChildRows,
            getDisplayedColCount,
          } as any);
        },
      },
      {
        headerName: "Status",
        field: "status",
        width: 140,
        valueGetter: (p: ValueGetterParams<Row>) => p.data?.status ?? "",
      },
      {
        headerName: "Amount",
        field: "amount",
        width: 140,
        type: "rightAligned",
        valueFormatter: (p) =>
          p.value != null ? p.value.toLocaleString(undefined, { style: "currency", currency: "USD" }) : "",
      },
    ];
  }, [getChildRows, getDisplayedColCount, isExpanded, toggleExpand]);

  const defaultColDef = useMemo<ColDef>(() => {
    return {
      sortable: true,
      resizable: true,
    };
  }, []);

  return (
    <div className="ag-theme-quartz" style={{ height: '100svh', width: "100%", padding: '25px' }}>
      <AgGridReactNoSSR<any>
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={(e: GridReadyEvent<Row>) => {
          gridApiRef.current = e.api;
        }}
        headerHeight={40}
        rowHeight={44} // base height when collapsed; expanded rows auto-grow via autoHeight on first column
        suppressRowClickSelection
        suppressCellFocus
        animateRows={false}
        isFullWidthRow={(p) => (p as any)?.rowNode?.data?.kind === "detail"}
        fullWidthCellRenderer={(params: any) =>
          DetailFullWidthRenderer({
            ...(params as any),
            getChildRows,
            toggleExpand,
          } as any)
        }
        // domLayout can stay "normal"; no need for "autoHeight" on the whole grid
      />
    </div>
  );
}