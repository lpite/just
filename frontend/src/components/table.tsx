import { TableContainer } from "@mui/material";
import Button from "@mui/material/Button";
import Icon from "@mui/material/Icon";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import {
  Cell,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  Row,
  useReactTable,
} from "@tanstack/react-table";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as KeyboardEventReact,
  type MouseEvent as MouseEventReact,
} from "react";

type TableButton =
  | {
      icon: true;
      text?: false;
    }
  | {
      icon?: false;
      text: true;
    }
  | {
      icon: true;
      text: true;
    };

interface TableButtons {
  add?: TableButton & { event: () => void };
  remove?: TableButton;
  changeOrder?: TableButton;
}

interface TableProps {
  data?: any[];
  changeData?: (data: any[]) => void;
  columns: ColumnDef<any, any>[];
  buttons?: TableButtons;
  onRowClick?: (row: Row<any>) => any;
  onRowDoubleClick?: (row: Row<any>) => any;
  disabled?: boolean;
}

const emptyArray: any[] = [];

export function MyTable({
  data,
  changeData,
  columns,
  buttons,
  onRowClick: onRowClickHandler,
  onRowDoubleClick: onRowDoubleClickHander,
  disabled,
}: TableProps) {
  const table = useReactTable({
    data: data ?? emptyArray,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [editCell, setEditCell] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function onRowClick(row: Row<any>) {
    setSelectedRow(row.index);
    if (onRowClickHandler) {
      onRowClickHandler(row);
    }
  }

  function onRowDoubleClick(row: Row<any>) {
    if (onRowDoubleClickHander) {
      onRowDoubleClickHander(row);
    }
  }

  function onCellClick(cell: Cell<any, any>, e?: MouseEventReact) {
    setSelectedRow(cell.row.index);
    setSelectedCell(cell.column.id);
    if ((e?.target as HTMLElement)?.tagName === "INPUT") {
      return;
    }
    document.querySelectorAll("input").forEach((el) => el.blur());
  }

  function onCellDoubleClick(cell: Cell<any, any>) {
    // @ts-ignore - meta properties are custom extensions
    if (disabled || !cell.column.columnDef.meta?.editable) {
      return;
    }
    setSelectedRow(cell.row.index);
    setSelectedCell(cell.column.id);
    setEditCell(true);
  }

  function moveRowUp() {
    if (!selectedRow || !data || !changeData) {
      return;
    }
    const newData = [...data];
    const tempItem = newData[selectedRow - 1];
    newData[selectedRow - 1] = newData[selectedRow];
    newData[selectedRow] = tempItem;
    changeData(newData);
    setSelectedRow(selectedRow - 1);
  }

  function moveRowDown() {
    if (
      selectedRow === null ||
      !data?.length ||
      selectedRow === data?.length - 1 ||
      !changeData
    ) {
      return;
    }
    const newData = [...data];
    const tempItem = newData[selectedRow + 1];
    newData[selectedRow + 1] = newData[selectedRow];
    newData[selectedRow] = tempItem;
    changeData(newData);
    setSelectedRow(selectedRow + 1);
  }

  useEffect(() => {
    function keyBoardListener(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;

      const rows = table.getRowModel().rows;
      const index = rows.findIndex((r) => r.index === selectedRow);

      if (index === -1) return;

      if (e.key === "ArrowDown" && index < rows.length - 1) {
        setSelectedRow(index + 1);
        setEditCell(false);
        containerRef.current
          ?.querySelectorAll("tbody tr")
          [index + 1]?.scrollIntoView({ block: "nearest" });
      }

      if (e.key === "ArrowUp" && index > 0) {
        setSelectedRow(index - 1);
        setEditCell(false);
        containerRef.current
          ?.querySelectorAll("tbody tr")
          [index - 1]?.scrollIntoView({ block: "nearest" });
      }

      if (e.key === "ArrowLeft") {
        if (!selectedCell) {
          return;
        }
        const columnIds = table.getAllColumns().map((el) => el.id);
        const currentColumnIndex = columnIds.indexOf(selectedCell);
        if (currentColumnIndex === 0) {
          return;
        }

        setEditCell(false);
        setSelectedCell(columnIds[currentColumnIndex - 1]);
      }
      if (e.key === "ArrowRight") {
        if (!selectedCell) {
          return;
        }
        const columnIds = table.getAllColumns().map((el) => el.id);
        const currentColumnIndex = columnIds.indexOf(selectedCell);
        if (currentColumnIndex + 1 === columnIds.length) {
          return;
        }

        setEditCell(false);
        setSelectedCell(columnIds[currentColumnIndex + 1]);
      }
      if (e.key === "Enter") {
        if (!selectedCell || disabled) {
          return;
        }
        const columnIds = table.getVisibleFlatColumns().map((el) => el.id);
        const currentColumnIndex = columnIds.indexOf(selectedCell);
        const column = table.getVisibleFlatColumns()[currentColumnIndex];
        // @ts-ignore - meta properties are custom extensions
        if (column.columnDef.meta?.editable) {
          setEditCell(true);
        }
      }
    }

    function onCopy(e: ClipboardEvent) {
      console.log(e);
    }

    window.addEventListener("keydown", keyBoardListener);
    window.addEventListener("copy", onCopy);
    return () => {
      window.removeEventListener("keydown", keyBoardListener);
      window.removeEventListener("copy", onCopy);
    };
  }, [selectedRow, selectedCell]);

  return (
    <div className="pt-2 flex flex-col">
      {buttons ? (
        <div className="pb-2 flex gap-1">
          {buttons?.add?.icon || buttons?.add?.text ? (
            <Button
              variant="contained"
              color="success"
              size="small"
              onClick={buttons.add.event}
              disabled={disabled}
            >
              {buttons.add.icon ? <Icon>add</Icon> : null}
              {buttons.add.text ? "Додати" : null}
            </Button>
          ) : null}
          {buttons?.remove?.icon || buttons?.remove?.text ? (
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={() => {
                if (!changeData) {
                  return;
                }
                changeData(
                  data?.filter((_, i) => i !== Number(selectedRow)) || [],
                );
              }}
              disabled={disabled}
            >
              {buttons.remove.icon ? <Icon>cross</Icon> : null}
              {buttons.remove.text ? "remove" : null}
            </Button>
          ) : null}
          {buttons.changeOrder ? (
            <>
              <Button
                size="small"
                disabled={disabled}
                className="w-10"
                onClick={moveRowUp}
              >
                <Icon>arrow_upward</Icon>
              </Button>
              <Button
                size="small"
                disabled={disabled}
                className="w-10"
                onClick={moveRowDown}
              >
                <Icon>arrow_downward</Icon>
              </Button>
            </>
          ) : null}
        </div>
      ) : null}
      <TableContainer ref={containerRef} className="">
        <Table
          style={{
            borderCollapse: "collapse",
            border: "1px solid #ccc",
          }}
          size="small"
          stickyHeader={true}
        >
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell
                    key={header.id}
                    className="text-start border-x border-gray-300"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <MyRow
                key={row.id}
                row={row}
                editCell={editCell}
                setEditCell={setEditCell}
                onCellClick={onCellClick}
                onCellDoubleClick={onCellDoubleClick}
                onRowClick={onRowClick}
                onRowDoubleClick={onRowDoubleClick}
                selectedCell={selectedCell}
                selectedRow={selectedRow}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

function MyRow({
  row,
  selectedRow,
  onRowClick,
  onRowDoubleClick,
  onCellClick,
  onCellDoubleClick,
  selectedCell,
  editCell,
  setEditCell,
}: {
  row: Row<any>;
  selectedRow: number | null;
  onRowClick: any;
  onRowDoubleClick: any;
  onCellClick: any;
  onCellDoubleClick: any;
  selectedCell: any;
  editCell: any;
  setEditCell: any;
}) {
  return (
    <TableRow
      style={{
        background: selectedRow === row.index ? "#e6f7ff" : "transparent",
      }}
      onClick={() => onRowClick(row)}
      onDoubleClick={() => onRowDoubleClick(row)}
      key={row.id}
    >
      {row.getVisibleCells().map((cell) => {
        return (
          <MyCell
            key={row.id + "_" + cell.id}
            cell={cell}
            row={row}
            editCell={editCell}
            setEditCell={setEditCell}
            onCellClick={onCellClick}
            onCellDoubleClick={onCellDoubleClick}
            selectedCell={selectedCell}
            selectedRow={selectedRow}
          />
        );
      })}
    </TableRow>
  );
}

type MyCellProps = {
  selectedCell: string;
  selectedRow: number | null;
  cell: Cell<any, unknown>;
  row: Row<any>;
  editCell: boolean;
  setEditCell: any;
  onCellClick: any;
  onCellDoubleClick: any;
};

function MyCell({
  selectedCell,
  row,
  cell,
  selectedRow,
  editCell,
  setEditCell,
  onCellClick,
  onCellDoubleClick,
}: MyCellProps) {
  // @ts-ignore - meta properties are custom extensions
  const onChangeHandler = cell.column.columnDef.meta?.onChange;
  // @ts-ignore - meta properties are custom extensions
  const editable = cell.column.columnDef.meta?.editable;

  const [cellValue, setCellValue] = useState(cell.getValue() as string);
  function onKeyDown(e: KeyboardEventReact<HTMLInputElement>) {
    e.stopPropagation();

    if (e.key === "Enter") {
      onChangeHandler(row.index, cellValue);
      setEditCell(false);
    }
  }

  useEffect(() => {
    setCellValue(String(cell.getValue() ?? ""));
  }, [cell.getValue()]);

  const isEditing =
    selectedCell === cell.column.id && row.index === selectedRow && editCell;

  return (
    <TableCell
      style={{
        position: "relative",
        background:
          selectedCell === cell.column.id && row.index === selectedRow
            ? "#8cceed"
            : "transparent",
      }}
      onClick={(e) => onCellClick(cell, e)}
      onDoubleClick={(e) => {
        if (editable) {
          e.stopPropagation();
          onCellDoubleClick(cell);
        }
      }}
      className="text-start border-x border-gray-300 p-0 select-none"
    >
      {isEditing ? (
        <>
          <span className="invisible block px-1">
            {String(cell.getValue() ?? "") || "\u00A0"}
          </span>
          <input
            autoFocus
            onKeyDown={onKeyDown}
            value={cellValue}
            onBlur={() => {
              onChangeHandler(row.index, cellValue);
              setEditCell(false);
            }}
            onChange={(e) => setCellValue(e.target.value)}
            className="absolute inset-0 box-border w-full px-1"
          />
        </>
      ) : editable ? (
        <span className="block px-1">{cellValue}</span>
      ) : (
        flexRender(cell.column.columnDef.cell, cell.getContext())
      )}
    </TableCell>
  );
}
