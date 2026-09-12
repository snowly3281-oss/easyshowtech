import Papa from "papaparse";

export const TABLE_IMPORT_LIMITS = {
  maxCellLength: 2_000,
  maxColumns: 30,
  maxFileBytes: 8 * 1024 * 1024,
  maxRows: 300,
} as const;

export type ImportGrid = unknown[][];

export interface NormalizedTable {
  columns: string[];
  rows: string[][];
  sourceColumnCount: number;
  sourceRowCount: number;
  warnings: string[];
}

export interface NormalizeTableOptions {
  firstRowIsHeader: boolean;
}

const GOOGLE_SHEET_HOSTS = new Set([
  "docs.google.com",
  "spreadsheets.google.com",
]);

function dateToText(value: Date): string {
  if (Number.isNaN(value.getTime())) return "";
  const iso = value.toISOString();
  return iso.endsWith("T00:00:00.000Z")
    ? iso.slice(0, 10)
    : iso.replace(".000Z", "Z");
}

export function cellToText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return dateToText(value);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }
  return String(value).trim();
}

function isBlankRow(row: unknown[]): boolean {
  return row.every((cell) => cellToText(cell) === "");
}

function trimBlankEdges(grid: ImportGrid): ImportGrid {
  const rows = grid.map((row) => (Array.isArray(row) ? row : []));
  let start = 0;
  let end = rows.length;
  while (start < end && isBlankRow(rows[start])) start += 1;
  while (end > start && isBlankRow(rows[end - 1])) end -= 1;
  return rows.slice(start, end);
}

function uniqueColumnTitles(values: unknown[], width: number): string[] {
  const used = new Set<string>();

  return Array.from({length: width}, (_, index) => {
    const raw = cellToText(values[index]);
    const base = raw || `列 ${index + 1}`;
    let title = base;
    let duplicate = 2;

    while (used.has(title.toLocaleLowerCase())) {
      title = `${base} (${duplicate})`;
      duplicate += 1;
    }

    used.add(title.toLocaleLowerCase());
    return title;
  });
}

function limitCell(value: unknown, warnings: Set<string>): string {
  const text = cellToText(value);
  if (text.length <= TABLE_IMPORT_LIMITS.maxCellLength) return text;
  warnings.add(
    `部分单元格超过 ${TABLE_IMPORT_LIMITS.maxCellLength} 个字符，已自动截断。`,
  );
  return text.slice(0, TABLE_IMPORT_LIMITS.maxCellLength);
}

export function normalizeTable(
  input: ImportGrid,
  options: NormalizeTableOptions,
): NormalizedTable {
  const warnings = new Set<string>();
  const trimmed = trimBlankEdges(input);

  if (trimmed.length === 0) {
    throw new Error("没有读取到可导入的表格内容。");
  }

  const sourceColumnCount = trimmed.reduce(
    (maximum, row) => Math.max(maximum, row.length),
    0,
  );
  const sourceRowCount = trimmed.length;

  if (sourceColumnCount < 2) {
    throw new Error("表格至少需要两列。请检查分隔符或选择正确的工作表。");
  }

  const width = Math.min(
    sourceColumnCount,
    TABLE_IMPORT_LIMITS.maxColumns,
  );
  if (sourceColumnCount > TABLE_IMPORT_LIMITS.maxColumns) {
    warnings.add(
      `源表共有 ${sourceColumnCount} 列，仅导入前 ${TABLE_IMPORT_LIMITS.maxColumns} 列。`,
    );
  }

  const header = options.firstRowIsHeader ? trimmed[0] : [];
  const dataStart = options.firstRowIsHeader ? 1 : 0;
  const columns = uniqueColumnTitles(header, width);
  const availableRows = trimmed
    .slice(dataStart)
    .filter((row) => !isBlankRow(row));
  const dataRows = availableRows.slice(0, TABLE_IMPORT_LIMITS.maxRows);

  if (availableRows.length > TABLE_IMPORT_LIMITS.maxRows) {
    warnings.add(
      `源表共有 ${availableRows.length} 行数据，仅导入前 ${TABLE_IMPORT_LIMITS.maxRows} 行。`,
    );
  }

  const rows = dataRows.map((row) =>
    Array.from({length: width}, (_, index) =>
      limitCell(row[index], warnings),
    ),
  );

  return {
    columns,
    rows,
    sourceColumnCount,
    sourceRowCount,
    warnings: Array.from(warnings),
  };
}

export function parseDelimitedText(text: string): ImportGrid {
  const source = text.replace(/^\uFEFF/, "").trim();
  if (!source) throw new Error("请先粘贴表格内容或选择一个文件。");

  const result = Papa.parse<string[]>(source, {
    delimiter: "",
    skipEmptyLines: "greedy",
  });

  const blockingErrors = result.errors.filter(
    (error) => error.code !== "UndetectableDelimiter",
  );
  if (blockingErrors.length > 0) {
    const summary = blockingErrors
      .slice(0, 3)
      .map((error) => `第 ${(error.row ?? 0) + 1} 行：${error.message}`)
      .join("；");
    throw new Error(`表格格式无法解析。${summary}`);
  }

  return result.data;
}

export function extractGoogleSheetId(input: string): string {
  const value = input.trim();
  if (!value) throw new Error("请粘贴 Google Sheets 共享链接。");

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Google Sheets 链接格式不正确。");
  }

  if (!GOOGLE_SHEET_HOSTS.has(url.hostname)) {
    throw new Error("请使用 docs.google.com 的 Google Sheets 共享链接。");
  }

  const match = url.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match?.[1]) {
    throw new Error("链接中没有找到 Google Sheets 文件 ID。");
  }
  return match[1];
}

export function googleSheetExportUrl(input: string): string {
  const id = extractGoogleSheetId(input);
  return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(id)}/export?format=xlsx`;
}

export function isSupportedTableFile(file: File): boolean {
  return /\.(csv|tsv|xlsx)$/i.test(file.name);
}
