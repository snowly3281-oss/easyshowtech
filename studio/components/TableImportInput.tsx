import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {createPortal} from "react-dom";
import {
  AddIcon,
  CheckmarkIcon,
  CloseIcon,
  DocumentIcon,
  InsertAboveIcon,
  LaunchIcon,
  ResetIcon,
  TrashIcon,
  UploadIcon,
} from "@sanity/icons";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Spinner,
  Stack,
  Text,
  TextArea,
  TextInput,
} from "@sanity/ui";
import readExcelFile, {
  type Sheet,
  type SheetData,
} from "read-excel-file/browser";
import {
  PatchEvent,
  set,
  unset,
  type ObjectInputProps,
} from "sanity";
import styled from "styled-components";
import {
  TABLE_IMPORT_LIMITS,
  googleSheetExportUrl,
  isSupportedTableFile,
  normalizeTable,
  parseDelimitedText,
  type ImportGrid,
  type NormalizedTable,
} from "../lib/tableImport";

type ImportMode = "paste" | "file" | "google";
type ImportAction = "replace" | "append";

interface TableRowValue {
  _key: string;
  _type: "postTableRow";
  cells: string[];
}

interface TableImportMeta {
  sourceLabel?: string;
  sourceType?: ImportMode;
  sourceUrl?: string;
  sheetName?: string;
  importedAt?: string;
}

interface TableBlockValue {
  _key?: string;
  _type?: "postTableBlock";
  heading?: string;
  columns?: string[];
  rows?: TableRowValue[];
  caption?: string;
  importMeta?: TableImportMeta;
}

interface ParsedSource {
  label: string;
  sheets: Array<{
    name: string;
    data: ImportGrid;
  }>;
  sourceType: ImportMode;
  sourceUrl?: string;
}

const Overlay = styled.div`
  align-items: center;
  background: rgba(15, 18, 25, 0.56);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 16px;
  position: fixed;
  z-index: 2100000;
`;

const Modal = styled(Card)`
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - 32px);
  overflow: hidden;
  width: min(1080px, calc(100vw - 32px));
`;

const ModalBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 24px;
`;

const SourceTabs = styled.div`
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(3, minmax(0, 1fr));

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const SourceTab = styled(Card)<{$active: boolean}>`
  appearance: none;
  border: 1px solid
    ${({$active}) => ($active ? "var(--card-focus-ring-color)" : "transparent")};
  cursor: pointer;
  display: block;
  font: inherit;
  min-height: 68px;
  text-align: left;
  width: 100%;

  &:focus-visible {
    outline: 2px solid var(--card-focus-ring-color);
    outline-offset: 2px;
  }
`;

const NativeSelect = styled.select`
  appearance: none;
  background: var(--card-bg-color);
  border: 1px solid var(--card-border-color);
  border-radius: 3px;
  color: inherit;
  font: inherit;
  min-height: 36px;
  padding: 0 36px 0 12px;
  width: 100%;
`;

const FileDrop = styled(Card)`
  appearance: none;
  border-style: dashed;
  cursor: pointer;
  display: block;
  font: inherit;
  text-align: center;
  width: 100%;

  &:focus-visible {
    outline: 2px solid var(--card-focus-ring-color);
    outline-offset: 2px;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const OptionRow = styled.label`
  align-items: flex-start;
  cursor: pointer;
  display: flex;
  gap: 10px;
`;

const PreviewScroller = styled.div`
  border: 1px solid var(--card-border-color);
  border-radius: 3px;
  max-height: 360px;
  overflow: auto;
`;

const PreviewTable = styled.table`
  border-collapse: collapse;
  font-size: 13px;
  min-width: 100%;

  th,
  td {
    border-bottom: 1px solid var(--card-border-color);
    border-right: 1px solid var(--card-border-color);
    max-width: 260px;
    min-width: 120px;
    overflow: hidden;
    padding: 10px 12px;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  th {
    background: var(--card-bg2-color, var(--card-bg-color));
    font-weight: 600;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  tr:last-child td {
    border-bottom: 0;
  }
`;

const ImportHeader = styled(Card)`
  position: relative;
`;

function makeKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replaceAll("-", "").slice(0, 16);
  }
  return Math.random().toString(36).slice(2, 14);
}

function toSanityRows(rows: string[][]): TableRowValue[] {
  return rows.map((cells) => ({
    _key: makeKey(),
    _type: "postTableRow",
    cells,
  }));
}

function sheetDataToGrid(data: SheetData): ImportGrid {
  return data.map((row) => Array.from(row));
}

function excelSheetsToSource(
  sheets: Sheet[],
  source: Omit<ParsedSource, "sheets">,
): ParsedSource {
  if (sheets.length === 0) {
    throw new Error("Excel 文件中没有可读取的工作表。");
  }
  return {
    ...source,
    sheets: sheets.map((sheet) => ({
      name: sheet.sheet,
      data: sheetDataToGrid(sheet.data),
    })),
  };
}

function modeLabel(mode: ImportMode): string {
  if (mode === "file") return "本地文件";
  if (mode === "google") return "Google Sheets";
  return "复制粘贴";
}

function sourceDescription(mode: ImportMode): string {
  if (mode === "file") return "支持 .xlsx、.csv 和 .tsv，文件不会上传到媒体库。";
  if (mode === "google") {
    return "读取可公开查看的共享链接；私有表格不会绕过 Google 权限。";
  }
  return "可直接从 Excel、Google Sheets 或 Numbers 复制一片单元格。";
}

export function TableImportInput(
  props: ObjectInputProps<TableBlockValue>,
) {
  const value = props.value ?? {};
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ImportMode>("paste");
  const [pasteValue, setPasteValue] = useState("");
  const [googleUrl, setGoogleUrl] = useState("");
  const [parsedSource, setParsedSource] = useState<ParsedSource | null>(null);
  const [selectedSheet, setSelectedSheet] = useState(0);
  const [firstRowIsHeader, setFirstRowIsHeader] = useState(true);
  const [action, setAction] = useState<ImportAction>("replace");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetParsedSource = useCallback(() => {
    setParsedSource(null);
    setSelectedSheet(0);
    setError("");
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setLoading(false);
    setError("");
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  const normalizedResult = useMemo<{
    error: string;
    table: NormalizedTable | null;
  }>(() => {
    if (!parsedSource) return {error: "", table: null};
    const sheet = parsedSource.sheets[selectedSheet];
    if (!sheet) return {error: "没有找到所选工作表。", table: null};
    try {
      return {
        error: "",
        table: normalizeTable(sheet.data, {firstRowIsHeader}),
      };
    } catch (reason) {
      return {
        error:
          reason instanceof Error ? reason.message : "表格内容无法生成预览。",
        table: null,
      };
    }
  }, [firstRowIsHeader, parsedSource, selectedSheet]);
  const normalized = normalizedResult.table;

  const setModeAndReset = (nextMode: ImportMode) => {
    setMode(nextMode);
    resetParsedSource();
  };

  const parsePaste = () => {
    setError("");
    try {
      const data = parseDelimitedText(pasteValue);
      setParsedSource({
        label: "粘贴的表格",
        sheets: [{name: "粘贴内容", data}],
        sourceType: "paste",
      });
      setSelectedSheet(0);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "无法解析粘贴内容。");
    }
  };

  const readWorkbook = async (
    file: Blob,
    source: Omit<ParsedSource, "sheets">,
  ) => {
    const sheets = await readExcelFile(file);
    setParsedSource(excelSheetsToSource(sheets, source));
    setSelectedSheet(0);
  };

  const parseFile = async (file: File) => {
    setError("");
    resetParsedSource();
    if (!isSupportedTableFile(file)) {
      setError("仅支持 .xlsx、.csv 和 .tsv 文件。旧版 .xls 请先另存为 .xlsx。");
      return;
    }
    if (file.size > TABLE_IMPORT_LIMITS.maxFileBytes) {
      setError("文件超过 8 MB，请精简表格后重试。");
      return;
    }

    setLoading(true);
    try {
      if (/\.(csv|tsv)$/i.test(file.name)) {
        const data = parseDelimitedText(await file.text());
        setParsedSource({
          label: file.name,
          sheets: [{name: file.name, data}],
          sourceType: "file",
        });
      } else {
        await readWorkbook(file, {
          label: file.name,
          sourceType: "file",
        });
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "文件读取失败。");
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (file) await parseFile(file);
  };

  const parseGoogleSheet = async () => {
    setError("");
    resetParsedSource();
    setLoading(true);
    try {
      const exportUrl = googleSheetExportUrl(googleUrl);
      const response = await fetch(exportUrl, {
        credentials: "omit",
        redirect: "follow",
      });
      if (!response.ok) {
        throw new Error(
          "Google Sheets 无法读取。请确认共享权限为“知道链接的任何人可查看”。",
        );
      }
      const blob = await response.blob();
      if (blob.size > TABLE_IMPORT_LIMITS.maxFileBytes) {
        throw new Error("Google Sheets 导出文件超过 8 MB，请精简后重试。");
      }
      if (blob.size === 0 || !response.headers.get("content-type")?.includes("spreadsheet")) {
        throw new Error(
          "Google 返回的不是可读取表格。请检查链接与共享权限。",
        );
      }
      await readWorkbook(blob, {
        label: "Google Sheets",
        sourceType: "google",
        sourceUrl: googleUrl.trim(),
      });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Google Sheets 读取失败。",
      );
    } finally {
      setLoading(false);
    }
  };

  const importTable = () => {
    if (!normalized || !parsedSource) return;
    const sheet = parsedSource.sheets[selectedSheet];
    const existingColumns = Array.isArray(value.columns) ? value.columns : [];
    const existingRows = Array.isArray(value.rows) ? value.rows : [];
    let columns = normalized.columns;
    let rows = toSanityRows(normalized.rows);

    if (action === "append" && existingColumns.length > 0) {
      if (existingColumns.length !== normalized.columns.length) {
        setError(
          `无法追加：现有表格为 ${existingColumns.length} 列，导入内容为 ${normalized.columns.length} 列。`,
        );
        return;
      }
      columns = existingColumns;
      rows = [...existingRows, ...rows];
    }

    const importMeta: TableImportMeta = {
      importedAt: new Date().toISOString(),
      sheetName: sheet.name,
      sourceLabel: parsedSource.label,
      sourceType: parsedSource.sourceType,
      ...(parsedSource.sourceUrl
        ? {sourceUrl: parsedSource.sourceUrl}
        : {}),
    };

    props.onChange(
      PatchEvent.from([
        set(columns, ["columns"]),
        set(rows, ["rows"]),
        set(importMeta, ["importMeta"]),
      ]),
    );
    close();
  };

  const currentImport = value.importMeta;
  const canAppend = Array.isArray(value.columns) && value.columns.length > 0;
  const previewRows = normalized?.rows.slice(0, 12) ?? [];

  return (
    <Stack space={4}>
      <ImportHeader border padding={4} radius={2} tone="primary">
        <Stack space={4}>
          <Flex align="flex-start" gap={4} justify="space-between" wrap="wrap">
            <Stack space={2}>
              <Flex align="center" gap={2}>
                <DocumentIcon />
                <Heading as="h3" size={1}>
                  电子表格快速导入
                </Heading>
              </Flex>
              <Text muted size={1}>
                从 Excel、CSV、Google Sheets 或复制的单元格生成表格，导入后仍可逐项编辑。
              </Text>
            </Stack>
            <Flex align="center" gap={2} wrap="wrap">
              <Button
                disabled={props.readOnly}
                icon={AddIcon}
                mode="ghost"
                onClick={() => setOpen(true)}
                text="导入表格"
                tone="primary"
              />
              <Button
                disabled={props.readOnly}
                icon={TrashIcon}
                mode="ghost"
                onClick={() => {
                  if (window.confirm("确定从文章中删除整个表格吗？")) {
                    props.onChange(PatchEvent.from(unset()));
                  }
                }}
                text="删除整个表格"
                tone="critical"
              />
            </Flex>
          </Flex>

          {currentImport?.importedAt && (
            <Flex align="center" gap={2} wrap="wrap">
              <Badge mode="outline" tone="positive">
                已导入
              </Badge>
              <Text muted size={1}>
                {currentImport.sourceLabel || modeLabel(currentImport.sourceType || "file")}
                {currentImport.sheetName ? ` · ${currentImport.sheetName}` : ""}
                {" · "}
                {new Date(currentImport.importedAt).toLocaleString("zh-CN")}
              </Text>
              {currentImport.sourceUrl && (
                <Button
                  as="a"
                  fontSize={1}
                  href={currentImport.sourceUrl}
                  icon={LaunchIcon}
                  mode="bleed"
                  target="_blank"
                  text="查看源表"
                />
              )}
            </Flex>
          )}

          <Text muted size={1}>
            完成表格编辑后关闭当前区块，可在表格区块工具栏点击“下方继续写”继续添加正文。
          </Text>
        </Stack>
      </ImportHeader>

      {props.renderDefault(props)}

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <Overlay
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) close();
            }}
          >
            <Modal radius={3} shadow={5} tone="default">
              <Card borderBottom padding={4}>
                <Flex align="center" gap={3} justify="space-between">
                  <Stack space={2}>
                    <Heading as="h2" size={2}>
                      导入电子表格
                    </Heading>
                    <Text muted size={1}>
                      文件只在浏览器中解析；确认前不会写入文章。
                    </Text>
                  </Stack>
                  <Button
                    aria-label="关闭"
                    icon={CloseIcon}
                    mode="bleed"
                    onClick={close}
                  />
                </Flex>
              </Card>

              <ModalBody>
                <Stack space={5}>
                  <SourceTabs>
                    {(["paste", "file", "google"] as const).map((item) => (
                      <SourceTab
                        $active={mode === item}
                        as="button"
                        key={item}
                        onClick={() => setModeAndReset(item)}
                        padding={3}
                        radius={2}
                        tone={mode === item ? "primary" : "transparent"}
                      >
                        <Stack space={2}>
                          <Text size={1} weight="semibold">
                            {modeLabel(item)}
                          </Text>
                          <Text muted size={1}>
                            {sourceDescription(item)}
                          </Text>
                        </Stack>
                      </SourceTab>
                    ))}
                  </SourceTabs>

                  {mode === "paste" && (
                    <Stack space={3}>
                      <Text size={1} weight="semibold">
                        粘贴单元格
                      </Text>
                      <TextArea
                        onChange={(event) => {
                          setPasteValue(event.currentTarget.value);
                          resetParsedSource();
                        }}
                        placeholder={"型号\t尺寸\t材质\nCR-001\t2280 × 620 mm\t枫木"}
                        rows={7}
                        value={pasteValue}
                      />
                      <Flex justify="flex-end">
                        <Button
                          icon={CheckmarkIcon}
                          onClick={parsePaste}
                          text="生成预览"
                          tone="primary"
                        />
                      </Flex>
                    </Stack>
                  )}

                  {mode === "file" && (
                    <Stack space={3}>
                      <HiddenFileInput
                        accept=".xlsx,.csv,.tsv"
                        onChange={onFileChange}
                        ref={fileInputRef}
                        type="file"
                      />
                      <FileDrop
                        as="button"
                        border
                        onClick={() => fileInputRef.current?.click()}
                        padding={5}
                        radius={2}
                        type="button"
                      >
                        <Stack space={3}>
                          <Box>
                            <UploadIcon fontSize={28} />
                          </Box>
                          <Text weight="semibold">选择 Excel、CSV 或 TSV</Text>
                          <Text muted size={1}>
                            最大 8 MB；旧版 .xls 请先在 Excel 中另存为 .xlsx。
                          </Text>
                        </Stack>
                      </FileDrop>
                    </Stack>
                  )}

                  {mode === "google" && (
                    <Stack space={3}>
                      <Text size={1} weight="semibold">
                        Google Sheets 共享链接
                      </Text>
                      <TextInput
                        onChange={(event) => {
                          setGoogleUrl(event.currentTarget.value);
                          resetParsedSource();
                        }}
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        value={googleUrl}
                      />
                      <Flex align="center" gap={3} justify="space-between" wrap="wrap">
                        <Text muted size={1}>
                          需要“知道链接的任何人可查看”；私有表格请导出 .xlsx 后上传。
                        </Text>
                        <Button
                          disabled={loading}
                          icon={ResetIcon}
                          onClick={parseGoogleSheet}
                          text="读取表格"
                          tone="primary"
                        />
                      </Flex>
                    </Stack>
                  )}

                  {loading && (
                    <Card padding={4} radius={2} tone="transparent">
                      <Flex align="center" gap={3} justify="center">
                        <Spinner muted />
                        <Text size={1}>正在读取表格…</Text>
                      </Flex>
                    </Card>
                  )}

                  {error && (
                    <Card border padding={3} radius={2} tone="critical">
                      <Text size={1}>{error}</Text>
                    </Card>
                  )}

                  {parsedSource &&
                    !normalized &&
                    parsedSource.sheets.length > 1 && (
                      <Card border padding={4} radius={2} tone="transparent">
                        <Stack space={2}>
                          <Text size={1} weight="semibold">
                            选择工作表
                          </Text>
                          <NativeSelect
                            onChange={(event) =>
                              setSelectedSheet(Number(event.currentTarget.value))
                            }
                            value={selectedSheet}
                          >
                            {parsedSource.sheets.map((sheet, index) => (
                              <option key={sheet.name} value={index}>
                                {sheet.name}
                              </option>
                            ))}
                          </NativeSelect>
                          <Text muted size={1}>
                            当前工作表不符合表格要求，请切换到包含两列以上数据的工作表。
                          </Text>
                        </Stack>
                      </Card>
                    )}

                  {!error && parsedSource && normalizedResult.error && (
                    <Card border padding={3} radius={2} tone="critical">
                      <Text size={1}>{normalizedResult.error}</Text>
                    </Card>
                  )}

                  {parsedSource && normalized && (
                    <Stack space={4}>
                      <Card border padding={4} radius={2} tone="transparent">
                        <Stack space={4}>
                          <Flex align="flex-end" gap={4} wrap="wrap">
                            {parsedSource.sheets.length > 1 && (
                              <Box flex={1} style={{minWidth: 220}}>
                                <Stack space={2}>
                                  <Text size={1} weight="semibold">
                                    选择工作表
                                  </Text>
                                  <NativeSelect
                                    onChange={(event) =>
                                      setSelectedSheet(Number(event.currentTarget.value))
                                    }
                                    value={selectedSheet}
                                  >
                                    {parsedSource.sheets.map((sheet, index) => (
                                      <option key={sheet.name} value={index}>
                                        {sheet.name}
                                      </option>
                                    ))}
                                  </NativeSelect>
                                </Stack>
                              </Box>
                            )}
                            <Flex align="center" gap={3} wrap="wrap">
                              <Badge mode="outline">
                                {normalized.columns.length} 列
                              </Badge>
                              <Badge mode="outline">
                                {normalized.rows.length} 行
                              </Badge>
                            </Flex>
                          </Flex>

                          <OptionRow>
                            <input
                              checked={firstRowIsHeader}
                              onChange={(event) =>
                                setFirstRowIsHeader(event.currentTarget.checked)
                              }
                              type="checkbox"
                            />
                            <Stack space={1}>
                              <Text size={1} weight="semibold">
                                第一行作为列标题
                              </Text>
                              <Text muted size={1}>
                                关闭后会自动生成“列 1、列 2…”。
                              </Text>
                            </Stack>
                          </OptionRow>
                        </Stack>
                      </Card>

                      {normalized.warnings.map((warning) => (
                        <Card
                          border
                          key={warning}
                          padding={3}
                          radius={2}
                          tone="caution"
                        >
                          <Text size={1}>{warning}</Text>
                        </Card>
                      ))}

                      <Stack space={2}>
                        <Flex align="center" justify="space-between" wrap="wrap">
                          <Text size={1} weight="semibold">
                            导入预览
                          </Text>
                          <Text muted size={1}>
                            最多预览 12 行，确认后导入全部有效内容
                          </Text>
                        </Flex>
                        <PreviewScroller>
                          <PreviewTable>
                            <thead>
                              <tr>
                                {normalized.columns.map((column) => (
                                  <th key={column}>{column}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {previewRows.map((row, rowIndex) => (
                                <tr key={`${rowIndex}-${row.join("|")}`}>
                                  {normalized.columns.map((_, columnIndex) => (
                                    <td key={columnIndex}>
                                      {row[columnIndex] || "\u00a0"}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </PreviewTable>
                        </PreviewScroller>
                      </Stack>

                      <Card border padding={4} radius={2} tone="transparent">
                        <Stack space={3}>
                          <Text size={1} weight="semibold">
                            写入方式
                          </Text>
                          <OptionRow>
                            <input
                              checked={action === "replace"}
                              name="table-import-action"
                              onChange={() => setAction("replace")}
                              type="radio"
                            />
                            <Stack space={1}>
                              <Text size={1} weight="semibold">
                                替换当前表格
                              </Text>
                              <Text muted size={1}>
                                更新列标题和全部内容，不影响表格标题与说明。
                              </Text>
                            </Stack>
                          </OptionRow>
                          <OptionRow>
                            <input
                              checked={action === "append"}
                              disabled={!canAppend}
                              name="table-import-action"
                              onChange={() => setAction("append")}
                              type="radio"
                            />
                            <Stack space={1}>
                              <Text size={1} weight="semibold">
                                追加到现有内容
                              </Text>
                              <Text muted size={1}>
                                仅在列数一致时追加；现有列标题保持不变。
                              </Text>
                            </Stack>
                          </OptionRow>
                        </Stack>
                      </Card>
                    </Stack>
                  )}
                </Stack>
              </ModalBody>

              <Card borderTop padding={4}>
                <Flex align="center" gap={3} justify="space-between" wrap="wrap">
                  <Text muted size={1}>
                    上限：{TABLE_IMPORT_LIMITS.maxColumns} 列 ×{" "}
                    {TABLE_IMPORT_LIMITS.maxRows} 行
                  </Text>
                  <Flex gap={2}>
                    <Button mode="ghost" onClick={close} text="取消" />
                    <Button
                      disabled={!normalized || loading}
                      icon={action === "append" ? InsertAboveIcon : CheckmarkIcon}
                      onClick={importTable}
                      text={action === "append" ? "追加内容" : "确认导入"}
                      tone="primary"
                    />
                  </Flex>
                </Flex>
              </Card>
            </Modal>
          </Overlay>,
          document.body,
        )}
    </Stack>
  );
}
