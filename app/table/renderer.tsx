"use client";

import React, { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AnimatePresence, motion } from "framer-motion";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import { useEffect } from "react";
function useRegisterAgModules() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      ModuleRegistry.registerModules([AllCommunityModule]);
    }
  }, []);
}

export type Row = {
  id: string;
  name: string;
  status: string;
  amount: number;
};

export type DetailRow = {
  kind: "detail";
  parent: Row;
};

export type ChildRow = {
  lineId: string;
  item: string;
  qty: number;
  price: number;
};

type ExtraParams = {
  isExpanded: (id: string) => boolean;
  toggleExpand: (id: string) => void;
  getChildRows: (id: string) => ChildRow[];
  getDisplayedColCount: () => number;
  detailHeight?: number;
};

export function ExpanderCellRenderer(
  props: ICellRendererParams<Row> & ExtraParams
) {
  useRegisterAgModules();
  const { data } = props;
  if (!data) return null;

  const expanded = props.isExpanded(data.id);
  const childRows = expanded ? props.getChildRows(data.id) : [];

  const childColDefs = useMemo<ColDef<ChildRow>[]>(
    () => [
      { headerName: "Line", field: "lineId", width: 120 },
      { headerName: "Item", field: "item", flex: 1, minWidth: 180 },
      { headerName: "Qty", field: "qty", width: 90, type: "rightAligned" },
      {
        headerName: "Price",
        field: "price",
        width: 120,
        type: "rightAligned",
        valueFormatter: (p) =>
          p.value != null
            ? p.value.toLocaleString(undefined, {
                style: "currency",
                currency: "USD",
              })
            : "",
      },
    ],
    []
  );

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 4px",
        }}
      >
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => props.toggleExpand(data.id)}
          className="cursor-pointer"
          style={{
            width: 28,
            height: 28,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6,
            border: "1px solid var(--gray-5, #d1d5db)",
            background: "transparent",
            fontWeight: 600,
          }}
        >
          {expanded ? "−" : "+"}
        </button>
        <div style={{ fontWeight: 600 }}>{data.name}</div>
        <div style={{ color: "#6b7280" }}>{data.id}</div>
      </div>

      <AnimatePresence initial={false} mode="wait">
        {expanded && (
          <motion.div
            key={data.id}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
            style={{
              overflow: "hidden",
              transformOrigin: "top",
              willChange: "transform, opacity",
              contain: "layout paint",
            }}
          >
            <div style={{ padding: "4px 0" }}>
              <div className="ag-theme-quartz" style={{ width: "100%" }}>
              <AgGridReact<ChildRow>
                rowData={childRows}
                columnDefs={childColDefs}
                defaultColDef={{ resizable: true, sortable: true }}
                headerHeight={32}
                rowHeight={36}
                suppressCellFocus
                suppressRowClickSelection
                animateRows={false}
                domLayout="autoHeight"
              />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ExpanderCellRenderer;

// Simple toggle-only cell renderer (parent rows)
export function ExpanderToggleCell(
  props: ICellRendererParams<Row> & { isExpanded: (id: string) => boolean; toggleExpand: (id: string) => void }
) {
  const data = props.data as Row | undefined;
  if (!data) return null;
  const expanded = props.isExpanded(data.id);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 4px" }}>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          props.toggleExpand(data.id);
        }}
        className="cursor-pointer"
        style={{
          width: 28,
          height: 28,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 6,
          border: "1px solid var(--gray-5, #d1d5db)",
          background: "transparent",
          fontWeight: 600,
        }}
      >
        {expanded ? "−" : "+"}
      </button>
      <div style={{ fontWeight: 600 }}>{data.name}</div>
      <div style={{ color: "#6b7280" }}>{data.id}</div>
    </div>
  );
}

// Full-width detail renderer (detail rows)
export function DetailFullWidthRenderer(
  props: ICellRendererParams<DetailRow> & { getChildRows: (id: string) => ChildRow[]; toggleExpand: (id: string) => void }
) {
  useRegisterAgModules();
  const d = props.data as DetailRow | undefined;
  if (!d) return null;
  const parent = d.parent;
  const childRows = props.getChildRows(parent.id);

  const childColDefs = useMemo<ColDef<ChildRow>[]>(
    () => [
      { headerName: "Line", field: "lineId", width: 120 },
      { headerName: "Item", field: "item", flex: 1, minWidth: 180 },
      { headerName: "Qty", field: "qty", width: 90, type: "rightAligned" },
      {
        headerName: "Price",
        field: "price",
        width: 120,
        type: "rightAligned",
        valueFormatter: (p) =>
          p.value != null ? p.value.toLocaleString(undefined, { style: "currency", currency: "USD" }) : "",
      },
    ],
    []
  );

  return (
    <div style={{ width: "100%", padding: "6px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            props.toggleExpand(parent.id);
          }}
          className="cursor-pointer"
          style={{
            width: 24,
            height: 24,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6,
            border: "1px solid var(--gray-5, #d1d5db)",
            background: "transparent",
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          −
        </button>
        <strong>{parent.name}</strong>
        <span style={{ color: "#6b7280" }}>{parent.id}</span>
      </div>

      <div className="ag-theme-quartz" style={{ width: "100%" }}>
        <AgGridReact<ChildRow>
          rowData={childRows}
          columnDefs={childColDefs}
          defaultColDef={{ resizable: true, sortable: true }}
          headerHeight={32}
          rowHeight={36}
          suppressCellFocus
          suppressRowClickSelection
          animateRows={false}
          domLayout="autoHeight"
        />
      </div>
    </div>
  );
}

// Lightweight expander toggle cell for parent rows (keeps columns visible)