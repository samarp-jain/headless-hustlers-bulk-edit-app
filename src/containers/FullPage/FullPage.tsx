import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  EmptyState,
  FieldLabel,
  Icon,
  InfiniteScrollTable,
  openUploadAssetModal,
  Select,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ButtonGroup,
  Button,
  cbModal,
  Notification,
  Dropdown,
  Textarea,
} from "@contentstack/venus-components";
import { useAppSdk } from "../../common/hooks/useAppSdk";
import { useAppConfig } from "../../common/hooks/useAppConfig";
import { handleContentTypeChange, updateEntryData } from "./FullPage.helper";
import AssetCell from "../../components/AssetCell/AssetCell";
import EditableCell from "../../components/EditableCell";
import { TableDataItem } from "./FullPage.types";
import { handlePublishModal } from "../../components/PublishModal";
import localeTexts from "../../common/locales/en-us";
import { TIMEOUTS } from "../../common/constants";

import "@contentstack/venus-components/build/main.css";
import "./FullPage.scss";
import AssetModal from "../../components/AssetDialog/AssetModal";
import FieldModal from "../../components/FieldModal/FieldModal";
import utils from "../../common/utils/Locale/GetLocale";

const FullPageExtension: React.FC = () => {
  const appSdk = useAppSdk() as any;
  const { api_key, master_locale } = appSdk?.stack?._data || {};
  const appConfig = useAppConfig();

  const [data, setData] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [mapper, setMapper] = useState<Record<string, any>>({});
  const [rowSelectionModel, setRowSelectionModel] = useState<any[]>([]);
  const [showSelected, setShowSelected] = useState<boolean>(false);
  const [contentTypeOptions, setContentTypeOptions] = useState<any[]>([]);
  const [selectedContentType, setSelectedContentType] = useState<any>(null);
  const [showMessage, setShowMessage] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [showErrorMessage, setShowErrorMessage] = useState<any>(false);
  const [environments, setEnvironments] = useState<any[]>([]);
  const [locales, setLocales] = useState<any[]>([]);
  const [selectedField, setSelectedField] = useState<any>(null);
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState<any>(null);
  const [tableKey, setTableKey] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalCounts, setTotalCounts] = useState<number>(0);
  const [filteredRows, setFilteredRows] = useState<any[]>([]);
  const [itemStatusMap, setItemStatusMap] = useState<Record<number, string>>({});
  const [resizedColumnWidths, setResizedColumnWidths] = useState<any>({});
  const [storedColumnOrder, setStoredColumnOrder] = useState<any[]>([]);
  const [freezedColumns, setFreezedColumns] = useState<any[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [referenceData, setReferenceData] = useState<any>(null);
  const [allLocalesData, setAllLocalesData] = useState<Record<string, any>>({});
  const [contentTypeSchema, setContentTypeSchema] = useState<any[]>([]);

  const [venusData, setVenusData] = useState<any[]>([]);
  const [viewBy, setViewBy] = useState<string>("Comfort");
  const [resetRowSelection, setResetRowSelection] = useState<boolean>(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);
  const [tableData, setTableData] = useState<TableDataItem[]>([]);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState<boolean>(false);

  const [tableHeight, setTableHeight] = useState<number>(window.innerHeight - 250);

  const [toolbarPosition, setToolbarPosition] = useState<string>("top");
  const [defaultLocale, setDefaultLocale] = useState<string>("");
  const [localeOptions, setLocaleOptions] = useState<any[]>([]);

  useEffect(() => {
    const fetchEnvironments = async () => {
      const envs = await appSdk?.stack?.getEnvironments?.();
      const loc = await appSdk?.stack?.getLocales?.();
      setLocales(loc?.locales || []);
      envs && envs?.environments?.length > 0 && setEnvironments([...envs?.environments]);
      loc && loc?.locales?.length > 0 && setLocales([...loc?.locales]);
      const sortedLocales = utils?.sortLocales?.(loc?.locales);
      setDefaultLocale(sortedLocales?.[0]?.code);
      setLocales(sortedLocales);
      setLocaleOptions(utils?.localeDropdownData?.(sortedLocales, setDefaultLocale));
    };
    fetchEnvironments();
  }, [appSdk?.stack]);

  // Function to get data type from schema by field name
  const getDataTypeFromSchema = useCallback((fieldName: string, schema: any[]): string | null => {
    if (!schema || !Array.isArray(schema) || schema.length === 0) {
      console.log(`[Schema Lookup] No schema available for field: ${fieldName}`);
      return null;
    }

    // Search through schema recursively
    const searchSchema = (schemaArray: any[], fieldUid: string): string | null => {
      for (const field of schemaArray) {
        if (field.uid === fieldUid) {
          console.log(`[Schema Lookup] ✓ Found field "${fieldUid}" with data_type: ${field.data_type}`);
          return field.data_type;
        }

        // Search in nested schema (for groups)
        if (field.schema && Array.isArray(field.schema)) {
          const result = searchSchema(field.schema, fieldUid);
          if (result) return result;
        }

        // Search in blocks
        if (field.blocks && Array.isArray(field.blocks)) {
          for (const block of field.blocks) {
            if (block.schema && Array.isArray(block.schema)) {
              const result = searchSchema(block.schema, fieldUid);
              if (result) return result;
            }
          }
        }
      }
      return null;
    };

    const result = searchSchema(schema, fieldName);
    if (!result) {
      console.log(`[Schema Lookup] ✗ Field "${fieldName}" not found in schema`);
    }
    return result;
  }, []);

  const refreshTableData = async (preserveSelection: boolean = false) => {
    if (!selectedContentType) return;

    const currentSelectedRows = preserveSelection ? rowSelectionModel : [];

    try {
      setShowMessage(true);
      setLoading(true);
      await handleContentTypeChange?.(
        selectedContentType,
        setSelectedContentType,
        appSdk,
        mapper,
        setData,
        setReferenceData,
        setLoading,
        defaultLocale,
        setContentTypeSchema
      );
      if (preserveSelection) {
        setRowSelectionModel(currentSelectedRows);
      }

      setTimeout(() => setShowMessage(false), TIMEOUTS?.debounceConfig);
      setTableKey((prevKey) => prevKey + 1);
    } catch (error) {
      console.error("Error refreshing table data:", error);
      setShowErrorMessage(["Failed to refresh data. Please try again."]);
    }
  };

  const updateNestedValue = (obj: any, path: string, value: any) => {
    if (!path) return value;

    const parts = path?.replace(/\[(\d+)\]/g, ".$1")?.split(".");
    const result = { ...obj };
    let current = result;

    for (let i = 0; i < parts?.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = parts[i + 1]?.match(/^\d+$/) ? [] : {};
      }
      current = current[part];
    }

    const lastPart = parts[parts?.length - 1];
    current[lastPart] = value;
    return result;
  };

  const handleEdit = (key: string, value: any, path?: string, index?: number) => {
    setIsEditing(true);
    setEditedValue({ key, value, path, index });
    setHasUnsavedChanges(true);
  };

  const handleSave = (path?: string) => {
    if (editedValue && selectedField) {
      if (!editedValue?.value || editedValue?.value?.toString?.()?.trim?.() === "") {
        return;
      }

      let updatedValue: any;

      if (
        Array.isArray(selectedField?.value) &&
        typeof editedValue?.index === localeTexts?.FullPage?.constants?.number
      ) {
        updatedValue = [...selectedField?.value];
        updatedValue[editedValue?.index] = editedValue?.value;
      } else if (path) {
        updatedValue = updateNestedValue(selectedField?.value, path, editedValue?.value);
      } else {
        updatedValue = editedValue?.value;
      }

      setRows((prevRows) => {
        return prevRows?.map((row) => {
          if (row?.id === selectedField?.rowId) {
            return {
              ...row,
              [selectedField?.field]: updatedValue,
            };
          }
          return row;
        });
      });

      setSelectedField({
        ...selectedField,
        value: updatedValue,
      });
      setHasUnsavedChanges(false);
    }
    setIsEditing(false);
    setEditedValue(null);
  };

  const renderCellContent = useCallback(
    (content: any, fieldType: string, fieldConfig: any, fieldName?: string) => {
      if (!content) return "";

      if (fieldType === "array" && Array.isArray(content)) {
        return (
          <div className="array-value">
            <span className="badge">{content?.length}</span>
            <span className="array-preview">{content?.join?.(", ")}</span>
          </div>
        );
      }

      if (
        Array?.isArray(content) &&
        content?.length > 0 &&
        content?.every?.(
          (item) =>
            typeof item === localeTexts?.FullPage?.constants?.object &&
            item !== null &&
            item?.uid &&
            item?._content_type_uid
        )
      ) {
        return (
          <div className="reference-field-cell">
            <div className="reference-preview">
              <div className="reference-content">
                <Icon icon="Link" size="small" />
                <span>
                  {content?.length}{" "}
                  {content?.length === 1
                    ? localeTexts?.FullPage?.constants?.referenceText?.Reference
                    : localeTexts?.FullPage?.constants?.referenceText?.References}
                </span>
              </div>
            </div>
          </div>
        );
      }

      if (fieldType === localeTexts?.FullPage?.constants?.referenceText?.reference) {
        if (Array.isArray(content)) {
          const referenceCount = content.filter(
            (item) => typeof item === localeTexts?.FullPage?.constants?.object && item !== null
          ).length;
          return (
            <div className="reference-field-cell">
              <div className="reference-preview">
                <div className="reference-content">
                  <Icon icon="Link" size="small" />
                  <span>
                    {referenceCount}{" "}
                    {referenceCount === 1
                      ? localeTexts?.FullPage?.constants?.referenceText?.referenceField
                      : localeTexts?.FullPage?.constants?.referenceText?.referenceFields}
                  </span>
                </div>
              </div>
            </div>
          );
        }

        if (typeof content === localeTexts?.FullPage?.constants?.object && content !== null) {
          return (
            <div className="reference-field-cell">
              <div className="reference-preview">
                <div className="reference-content">
                  <Icon icon="Link" size="small" />
                  <span>1 {localeTexts?.FullPage?.constants?.referenceText?.Reference}</span>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="reference-field-cell">
            <div className="reference-preview">
              <div className="reference-content">
                <Icon icon="Link" size="small" />
                <span>1 {localeTexts?.FullPage?.constants?.referenceText?.Reference}</span>
              </div>
            </div>
          </div>
        );
      }

      if (fieldType === localeTexts?.FullPage?.constants?.groupText?.group) {
        const fieldCount = Object?.keys(content || {})?.length;
        return (
          <div className="nested-field-cell">
            <div className="nested-field-preview">
              <div className="nested-field-info">
                <span className="field-type">{localeTexts?.FullPage?.constants?.groupText?.Group}</span>
                <span className="field-count">
                  {fieldCount}{" "}
                  {fieldCount === 1
                    ? localeTexts?.FullPage?.constants?.field
                    : localeTexts?.FullPage?.constants?.fields}
                  <Icon version="v2" icon="v2-CaretRight" className="preview-arrow" />
                </span>
              </div>
            </div>
          </div>
        );
      }

      if (fieldType === localeTexts?.FullPage?.constants?.blockText?.blocks) {
        const blockCount = (content || [])?.length;
        return (
          <div className="nested-field-cell">
            <div className="nested-field-preview">
              <Icon version="v2" icon="v2-ModularBlocks" size="small" />
              <div className="nested-field-info">
                <span className="field-count">
                  {blockCount}{" "}
                  {blockCount === 1
                    ? localeTexts?.FullPage?.constants?.blockText?.block
                    : localeTexts?.FullPage?.constants?.blockText?.blocks}
                </span>
              </div>
              <Icon version="v2" icon="v2-CaretRight" size="small" />
            </div>
          </div>
        );
      }

      // Check if this field is a link type by comparing with schema
      const schemaDataType = fieldName ? getDataTypeFromSchema(fieldName, contentTypeSchema) : null;

      if (schemaDataType === "link") {
        if (content && typeof content === "object" && content !== null) {
          const title = content?.title || "";
          const href = content?.href || content?.url || "";
          const hasContent = title || href;

          return (
            <div className="link-field-cell">
              <div className="link-field-preview">
                <Icon version="v2" icon="Link" size="small" className="link-icon" />
                <div className="link-field-content">
                  {hasContent ? (
                    <>
                      {title && (
                        <div className="link-field-row">
                          <span className="link-label">Title:</span>
                          <span className="link-value">{title}</span>
                        </div>
                      )}
                      {href && (
                        <div className="link-field-row">
                          <span className="link-label">URL:</span>
                          <span className="link-value">{href}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="link-empty">Empty Link</span>
                  )}
                </div>
                <Icon version="v2" icon="v2-CaretRight" size="small" className="link-arrow" />
              </div>
            </div>
          );
        }
        return (
          <div className="link-field-cell">
            <div className="link-field-preview">
              <Icon version="v2" icon="Link" size="small" />
              <span className="link-empty">Empty Link</span>
            </div>
          </div>
        );
      }

      // Check for long text that should open in modal
      if (typeof content === "string" && (content.length > 100 || content.includes("\n"))) {
        const preview = content.length > 100 ? `${content.substring(0, 100)}...` : content;
        return (
          <div className="long-text-field-cell">
            <div className="long-text-preview">
              <Icon version="v2" icon="Edit" size="small" className="text-icon" />
              <span className="text-content">{preview}</span>
              <Icon version="v2" icon="v2-CaretRight" size="small" className="text-arrow" />
            </div>
          </div>
        );
      }

      if (typeof content === localeTexts?.FullPage?.constants?.object && content !== null) {
        const keyCount = Object?.keys(content)?.length;
        return (
          <div className="object-value">
            <span className="badge">{keyCount}</span>
            <span className="array-preview">
              {keyCount === 1
                ? localeTexts?.FullPage?.constants?.fieldText?.field
                : localeTexts?.FullPage?.constants?.fieldText?.fields}
            </span>
          </div>
        );
      }

      return content?.toString() || "";
    },
    [getDataTypeFromSchema, contentTypeSchema]
  );

  const detectFieldType = (fieldConfig: any, value: any, fieldName?: string) => {
    // First check schema if fieldName is provided
    if (fieldName) {
      const schemaDataType = getDataTypeFromSchema(fieldName, contentTypeSchema);
      if (schemaDataType === "link") {
        return "link";
      }
    }

    if (fieldConfig?.type?.type === localeTexts?.FullPage?.constants?.referenceText?.reference)
      return localeTexts?.FullPage?.constants?.referenceText?.reference;
    if (
      fieldConfig?.type?.type === localeTexts?.FullPage?.constants?.fileText?.file ||
      fieldConfig?.type === localeTexts?.FullPage?.constants?.fileText?.file
    )
      return localeTexts?.FullPage?.constants?.fileText?.file;
    if (fieldConfig?.type?.type === localeTexts?.FullPage?.constants?.groupText?.group)
      return localeTexts?.FullPage?.constants?.groupText?.group;
    if (fieldConfig?.type?.type === localeTexts?.FullPage?.constants?.blockText?.blocks)
      return localeTexts?.FullPage?.constants?.blockText?.blocks;

    // Check if it's a link field
    if (fieldConfig?.type?.type === "link" || fieldConfig?.type === "link") {
      return "link";
    }

    // Check if it's a link object (has title and href properties)
    if (value && typeof value === localeTexts?.FullPage?.constants?.object && "title" in value && "href" in value) {
      return "link";
    }

    // Check if it's a modular block array field
    if (Array?.isArray(value)) {
      // If the array contains objects with _content_type_uid or uid, it's a reference array
      const hasReferenceItems = value.some(
        (arrayItem) =>
          arrayItem &&
          typeof arrayItem === localeTexts?.FullPage?.constants?.object &&
          (arrayItem?._content_type_uid || arrayItem?.uid)
      );

      if (!hasReferenceItems) {
        return "array";
      }
    }

    // Check if it's a reference object
    if (value && typeof value === localeTexts?.FullPage?.constants?.object) {
      if (value?._content_type_uid || (value?.uid && value?._content_type_uid)) {
        return localeTexts?.FullPage?.constants?.referenceText?.reference;
      }
    }

    return fieldConfig?.type?.type || fieldConfig?.type || localeTexts?.FullPage?.constants?.text;
  };

  function parseJsonSafely<T = any>(value: string | null): T | undefined {
    try {
      if (!value) return undefined;
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }

  function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  useEffect(() => {
    const freezedCols = parseJsonSafely<any[]>(localStorage.getItem("freezedColumns")) || [];
    setFreezedColumns(freezedCols);
    const colWidths = parseJsonSafely<any>(localStorage.getItem("columnWidths")) || {};
    setResizedColumnWidths(colWidths);
    const colOrder = parseJsonSafely<any[]>(localStorage.getItem("columnOrder")) || [];
    setStoredColumnOrder(colOrder);
  }, []);

  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setDebouncedSearchTerm(term);
    }, TIMEOUTS.debounce),
    []
  );

  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term?.trim());
      debouncedSearch(term?.trim());
    },
    [debouncedSearch]
  );

  useEffect(() => {
    if (!rows?.length) return;

    if (!debouncedSearchTerm) {
      if (!showSelected) {
        setFilteredRows(rows);
        setTotalCounts(rows?.length);
      } else {
        const selectedRowData = rows?.filter((row) => rowSelectionModel?.includes(row?.id));
        setFilteredRows(selectedRowData);
        setTotalCounts(selectedRowData?.length);
      }
      return;
    }

    const searchLower = debouncedSearchTerm?.toLowerCase();
    const filtered = rows?.filter((row) => {
      if (showSelected && !rowSelectionModel.includes(row?.id)) {
        return false;
      }

      const searchableFields = { ...row };
      const excludeFields = ["id", "action", "refresh"];
      excludeFields?.forEach((field) => {
        delete searchableFields[field];
      });

      return Object?.entries(searchableFields)?.some(([key, value]) => {
        if (value === null || value === undefined) return false;

        if (typeof value === "object") {
          if (Array?.isArray(value)) {
            return value?.some((item) => {
              if (item === null || item === undefined) return false;
              return String(item)?.toLowerCase()?.includes(searchLower);
            });
          }
          try {
            return JSON?.stringify(value)?.toLowerCase()?.includes(searchLower);
          } catch (error) {
            return false;
          }
        }

        return String(value)?.toLowerCase()?.includes(searchLower);
      });
    });

    setFilteredRows(filtered);
    setTotalCounts(filtered?.length);
  }, [debouncedSearchTerm, rows, showSelected, rowSelectionModel]);

  const fetchTableData = async ({ skip = 0, limit = 30, startIndex = 0, stopIndex = 30, searchText = "" }) => {
    if (!selectedContentType) {
      return { data: [], count: 0 };
    }

    setLoading(true);

    try {
      const dataToUse = filteredRows;
      const rowsData = dataToUse?.slice(skip, skip + limit);
      const totalCount = dataToUse?.length;

      const itemStatus: Record<number, string> = {};
      for (let index = startIndex; index <= stopIndex; index++) {
        itemStatus[index] = localeTexts?.FullPage?.constants?.loaded;
      }

      setItemStatusMap(itemStatus);
      setTableData(rowsData);
      setLoading(false);
      setVenusData(rowsData);
      setTotalCounts(totalCount);

      return {
        data: rowsData,
        count: totalCount,
      };
    } catch (error) {
      console.error("Error fetching table data:", error);
      if (startIndex === 0) {
        setTableData([]);
        setTotalCounts(0);
      }
      return { data: [], count: 0 };
    } finally {
      setLoading(false);
    }
  };

  const loadMoreItems = async ({ skip = 0, limit = 30, startIndex = 0, stopIndex = 30 }) => {
    try {
      const itemStatusMapCopy: Record<number, string> = { ...itemStatusMap };
      for (let index = startIndex; index <= stopIndex; index++) {
        itemStatusMapCopy[index] = "loading";
      }
      setItemStatusMap(itemStatusMapCopy);
      setLoading(true);

      const dataToUse = filteredRows;
      const rowsData = dataToUse?.slice(skip, skip + limit);

      const updateditemStatusMapCopy: Record<number, string> = { ...itemStatusMap };
      for (let index = startIndex; index <= stopIndex; index++) {
        updateditemStatusMapCopy[index] = localeTexts?.FullPage?.constants?.loaded;
      }

      setItemStatusMap(updateditemStatusMapCopy);
      setLoading(false);
      setVenusData([...venusData, ...rowsData]);
      setTotalCounts(dataToUse?.length);
    } catch (error) {
      console.error("Error loading more items:", error);
    }
  };

  useEffect(() => {
    const rowData = data?.slice(1)?.map((item, index) => {
      const obj = {
        id: index + 1,
        ...item?.reduce((acc: { [x: string]: any }, cell: { value: any }, cellIndex: string | number) => {
          if (data?.[0] && data?.[0]?.[cellIndex]) {
            acc[data?.[0]?.[cellIndex]?.value] = cell?.value;
          }
          return acc;
        }, {}),
      };
      return obj;
    });

    if (!showSelected) {
      setRows(rowData);
    } else {
      const selectedRowData = rowSelectionModel
        ?.map((id: any) => rowData.find((row) => row?.id === id))
        ?.filter(Boolean);
      setRows(selectedRowData);
    }

    setVenusData([]);
    setSearchTerm("");
  }, [data, showSelected, rowSelectionModel]);

  const onRowSelectProp = [
    {
      label: showSelected
        ? localeTexts?.FullPage?.table?.actions?.selected?.showAll
        : localeTexts?.FullPage?.table?.actions?.selected?.label,
      icon: showSelected
        ? localeTexts?.FullPage?.table?.actions?.selected?.iconAll
        : localeTexts?.FullPage?.table?.actions?.selected?.icon,
      cb: (data: any) => {
        if (showSelected) {
          setShowSelected(false);
          setFilteredRows(rows);
          setTotalCounts(rows?.length);
        } else {
          if (data?.data?.length > 0) {
            setShowSelected(true);
            const selectedIds = data?.data?.map((item: any) => item?.id);
            setRowSelectionModel(selectedIds);
            const selectedRowData = rows?.filter((row) => selectedIds.includes(row?.id));
            setFilteredRows(selectedRowData);
            setTotalCounts(selectedRowData?.length);
          }
        }
      },
      showSelected: true,
    },
    {
      label: localeTexts?.FullPage?.table?.actions?.update?.label,
      icon: localeTexts?.FullPage?.table?.actions?.update?.icon,
      disabled: isBulkUpdating,
      cb: (callbackData: any) => {
        const selectedIds = callbackData?.data?.map((item: any) => item?.id) || [];

        if (selectedIds?.length === 0) {
          setShowErrorMessage(["Please select at least one row to update"]);
          return;
        }

        const selectedRows = rows.filter((row) => {
          return callbackData?.data?.some((item: any) => item?.uid === row?.uid);
        });

        if (selectedRows?.length > 0) {
          // Set loading state for bulk update
          setIsBulkUpdating(true);

          // Show loading notification
          Notification({
            notificationContent: {
              text: `Updating ${selectedRows?.length} ${selectedRows?.length === 1 ? "entry" : "entries"}...`,
            },
            notificationProps: {
              autoClose: TIMEOUTS.autoClose,
            },
            type: "info",
          });

          // Check if we have locale-specific data from FieldModal
          const hasLocaleData = Object.keys(allLocalesData).length > 0;

          const result = selectedRows?.map((rowData: any) => {
            // Filter out reference fields from the entry data
            const filteredData = Object?.entries(rowData)?.reduce((acc: any, [key, value]) => {
              // Skip reference fields and special fields
              if (key === "uid" || key === "id" || key === "action" || key === "refresh") {
                acc[key] = value;
                return acc;
              }

              // Check if the field is a reference field
              const fieldConfig = data?.[0]?.find((item: any) => item?.value === key);
              const fieldType = detectFieldType(fieldConfig, value, key);

              if (fieldType !== localeTexts?.FullPage?.constants?.referenceText?.reference) {
                acc[key] = value;
              }

              return acc;
            }, {});

            const rowLocale = rowData?.locale || rowData?.lang || rowData?.language || defaultLocale || master_locale;

            if (hasLocaleData && allLocalesData[rowLocale] && rowData.uid) {
              const updatedData = {
                ...allLocalesData[rowLocale],
                uid: rowData.uid,
              };

              return updateEntryData({
                stack: appSdk?.stack,
                contentTypeValue: selectedContentType,
                entry: updatedData,
                localeValue: {
                  value: rowLocale,
                },
                publish: false,
              });
            }

            return updateEntryData({
              stack: appSdk?.stack,
              contentTypeValue: selectedContentType,
              entry: filteredData,
              localeValue: {
                value: rowLocale,
              },
              publish: false,
            });
          });

          Promise.all(result)
            .then((res: any) => {
              setRowSelectionModel([]);
              setAllLocalesData({});

              const errorItems = res?.filter((item: any) => item?.status === 400);
              if (errorItems?.length > 0) {
                Notification({
                  notificationContent: {
                    text: errorItems?.map((item: any) => item?.notice),
                  },
                  notificationProps: {
                    autoClose: TIMEOUTS.autoClose,
                  },
                  type: localeTexts?.FullPage?.Notification?.error,
                });
              } else if (errorItems?.length === 0) {
                Notification({
                  notificationContent: {
                    text: localeTexts?.FullPage?.Notification?.updateSuccess,
                  },
                  notificationProps: {
                    autoClose: TIMEOUTS.autoClose,
                  },
                  type: localeTexts?.FullPage?.Notification?.success,
                });
              }

              refreshTableData(false);
            })
            .catch((error: any) => {
              console.error("Update error:", error);
              Notification({
                notificationContent: {
                  text: localeTexts?.FullPage?.Notification?.updateFailure,
                },
                type: localeTexts?.FullPage?.Notification?.error,
              });
            })
            .finally(() => {
              setIsBulkUpdating(false);
            });
        }

        setResetRowSelection(true);
      },
    },
    {
      label: localeTexts?.FullPage?.table?.actions?.updateAndPublish?.label,
      icon: localeTexts?.FullPage?.table?.actions?.updateAndPublish?.icon,
      disabled: isBulkUpdating,
      cb: (callbackData: any) => {
        const selectedItems = callbackData?.data || [];

        if (selectedItems?.length === 0) {
          setShowErrorMessage(["Please select at least one row to publish"]);
          return;
        }

        const selectedRows = rows.filter((row) => {
          return selectedItems?.some((item: any) => item?.uid === row?.uid);
        });

        if (selectedRows?.length > 0) {
          // Open the publish modal
          handlePublishModal({
            envs: environments,
            locales: locales,
            handleUpdateAndPublish: (publish: boolean, envs: any[], langs: any[]) => {
              // Set loading state for bulk publish
              setIsBulkUpdating(true);

              // Show loading notification
              Notification({
                notificationContent: {
                  text: `Publishing ${selectedRows?.length} ${selectedRows?.length === 1 ? "entry" : "entries"}...`,
                },
                notificationProps: {
                  autoClose: TIMEOUTS.autoClose,
                },
                type: "info",
              });

              const result = selectedRows?.map((rowData: any) => {
                return updateEntryData({
                  stack: appSdk?.stack,
                  contentTypeValue: selectedContentType,
                  entry: rowData,
                  localeValue: {
                    value: master_locale,
                  },
                  publish: true,
                  envs: envs,
                  locales: langs,
                });
              });
              Promise?.all(result)
                .then((res: any) => {
                  setRowSelectionModel([]);
                  setShowMessage(true);
                  const errorItems = res?.filter((item: any) => item?.status === 400);

                  if (errorItems?.length === 0) {
                    Notification({
                      notificationContent: {
                        text: localeTexts?.FullPage?.Notification?.publishSuccess?.message,
                      },
                      type: localeTexts?.FullPage?.Notification?.publishSuccess?.type,
                    });
                  } else {
                    Notification({
                      notificationContent: {
                        text: errorItems?.map((item: any) => item?.notice),
                      },
                      type: localeTexts?.FullPage?.Notification?.publishFailure?.type,
                    });
                  }
                  refreshTableData(false);
                })
                .catch((error: any) => {
                  console.error("Publish error:", error);
                  setShowErrorMessage(["Failed to publish entries. Please try again."]);
                })
                .finally(() => {
                  setIsBulkUpdating(false);
                });
            },
          });
        } else {
          setShowErrorMessage(["No matching rows found for the selected items"]);
        }

        setResetRowSelection(true);
      },
    },
  ];

  const onChangeColumnOrder = (columnOrder: any) => {
    setStoredColumnOrder(columnOrder);
    localStorage?.setItem("columnOrder", JSON.stringify(columnOrder));
  };

  const onColumnFreeze = (columns: any) => {
    setFreezedColumns(columns);
    localStorage?.setItem("freezedColumns", JSON.stringify(columns));
  };

  const onToggleColumnSelector = (data: { name: string; isVisible: boolean }) => {
    if (data?.isVisible) {
      setVisibleColumns((prev) => [...prev, data?.name]);
    } else {
      setVisibleColumns((prev) => prev.filter((col) => col !== data?.name));
    }
  };

  const findImageUrl = (obj: any, fieldName: string = ""): string => {
    if (!obj) return "";

    if (typeof obj === "string" && (obj?.startsWith("http") || obj?.match(/\.(jpg|jpeg|png|gif|webp|svg)/i))) {
      return obj;
    }

    if (typeof obj === localeTexts?.FullPage?.constants?.object && obj?.url) {
      return obj?.url;
    }

    if (typeof obj === localeTexts?.FullPage?.constants?.object && obj?.banner_image?.url) {
      return obj?.banner_image?.url;
    }

    return "";
  };

  const updateImageField = (originalValue: any, newImage: { uid: string; url: string }, fieldPath: string) => {
    if (typeof originalValue === localeTexts?.FullPage?.constants?.object && "url" in originalValue) {
      return { ...originalValue, ...newImage };
    }

    if (typeof originalValue === localeTexts?.FullPage?.constants?.object && "banner_image" in originalValue) {
      return {
        ...originalValue,
        banner_image: { ...originalValue?.banner_image, ...newImage },
      };
    }

    if (typeof originalValue === "string") {
      return newImage?.url;
    }

    return newImage;
  };

  const handleCellSave = (fieldName: string, value: any, rowId: number) => {
    setRows((prevRows) => {
      return prevRows.map((row) => {
        if (row.id === rowId) {
          return {
            ...row,
            [fieldName]: value,
          };
        }
        return row;
      });
    });

    setFilteredRows((prevFilteredRows) => {
      return prevFilteredRows.map((row) => {
        if (row.id === rowId) {
          return {
            ...row,
            [fieldName]: value,
          };
        }
        return row;
      });
    });
    setHasUnsavedChanges(true);
  };

  const generateVenusColumns = useCallback(
    (data: any[]) => {
      if (!data || data?.length < 1 || !data[0]) {
        return [
          {
            Header: localeTexts?.FullPage?.table?.columns?.header,
            accessor: localeTexts?.FullPage?.table?.columns?.accessor,
            addToColumnSelector: true,
            disableResizing: false,
            canDragDrop: true,
            width: 350,
          },
        ];
      }

      const capitalizeFirstLetter = (string: string) => {
        return string?.charAt(0)?.toUpperCase() + string?.slice(1)?.toLowerCase();
      };

      const generateTooltip = (fieldPath: string) => {
        return fieldPath
          ?.split(/[\[\].]+/)
          ?.filter(Boolean)
          ?.join(" → ");
      };

      const getFieldTypeIcon = (fieldConfig: any, fieldName: string): { icon: string; label: string } => {
        // Check schema first
        const schemaDataType = getDataTypeFromSchema(fieldName, contentTypeSchema);

        // Map data types to icons and labels
        if (schemaDataType === "link") {
          return { icon: "Link", label: "Link" };
        }
        if (schemaDataType === "number") {
          return { icon: "Number", label: "Number" };
        }
        if (schemaDataType === "boolean") {
          return { icon: "CheckboxActive", label: "Boolean" };
        }
        if (schemaDataType === "isodate" || schemaDataType === "date") {
          return { icon: "Calendar", label: "Date" };
        }
        if (schemaDataType === "file") {
          return { icon: "Asset", label: "File" };
        }
        if (schemaDataType === "reference") {
          return { icon: "v2-Reference", label: "Reference" };
        }
        if (schemaDataType === "group") {
          return { icon: "Group", label: "Group" };
        }
        if (schemaDataType === "blocks") {
          return { icon: "v2-ModularBlocks", label: "Blocks" };
        }

        // Check field config for display_type (dropdown/radio)
        if (fieldConfig?.display_type === "dropdown") {
          return { icon: "Dropdown", label: "Dropdown" };
        }
        if (fieldConfig?.display_type === "radio") {
          return { icon: "RadioChecked", label: "Radio" };
        }

        // Check field config type
        const fieldType = fieldConfig?.type?.type || fieldConfig?.type;
        if (fieldType === "number") {
          return { icon: "Number", label: "Number" };
        }
        if (fieldType === "boolean") {
          return { icon: "CheckboxActive", label: "Boolean" };
        }
        if (fieldType === "file") {
          return { icon: "Asset", label: "File" };
        }

        // Default to text
        return { icon: "Edit", label: "Text" };
      };

      const estimateColumnWidth = (item: any, index: number) => {
        let width = 350;
        const headerLength = item?.value?.length || 0;

        if (data.length > 1) {
          const sampleSize = Math.min(10, data.length - 1);
          let maxContentLength = 0;

          for (let i = 1; i <= sampleSize; i++) {
            const cellValue = data[i][index]?.value;
            if (cellValue) {
              if (typeof cellValue === "string") {
                maxContentLength = Math.max(maxContentLength, cellValue.length);
              } else if (Array.isArray(cellValue)) {
                maxContentLength = Math.max(maxContentLength, 10 + String(cellValue.length).length);
              } else if (typeof cellValue === "object" && cellValue !== null) {
                maxContentLength = Math.max(maxContentLength, 15);
              }
            }
          }
          const contentWidth = Math.max(headerLength * 10, maxContentLength * 8);
          width = Math.min(500, Math.max(250, contentWidth));
        }

        return width;
      };

      return data[0]
        ?.map((item: any, index: number) => {
          if (!item?.value || item?.value === "uid") return null;

          const estimatedWidth = estimateColumnWidth(item, index);
          const fieldValue = item?.value;

          const fieldTypeInfo = getFieldTypeIcon(item?.type, fieldValue);

          const commonProps = {
            Header: ({ column }: any = {}) => (
              <div
                className="column-header-with-type"
                title={`${generateTooltip(fieldValue)} (${fieldTypeInfo.label})`}>
                {/* <Icon icon={fieldTypeInfo.icon} size="small" className="field-type-icon" /> */}
                <span className="field-name">{capitalizeFirstLetter(fieldValue)}</span>
                <span className="field-type-label">{fieldTypeInfo.label}</span>
              </div>
            ),
            accessor: fieldValue,
            disableSortBy: true,
            id: fieldValue,
            addToColumnSelector: true,
            disableResizing: false,
            canDragDrop: true,
            width: resizedColumnWidths[fieldValue] || estimatedWidth,
            minWidth: 350,
            maxWidth: 400,
          };

          return {
            ...commonProps,
            Cell: ({ row }: any) => {
              const value = row?.original[fieldValue];
              const fieldType = detectFieldType(item?.type, value, fieldValue);
              const rowId = row?.original?.id;
              const isSelected = Array?.isArray(rowSelectionModel) && rowSelectionModel?.includes(rowId);

              // Debug log for link fields
              if (fieldType === "link") {
                console.log(`[Table Cell] Link field "${fieldValue}":`, {
                  value,
                  rowData: row?.original,
                  fieldType,
                });
              }

              if (fieldType === localeTexts?.FullPage?.constants?.fileText?.file) {
                return (
                  <AssetCell
                    imageUrl={findImageUrl(value, fieldValue)}
                    fieldName={fieldValue}
                    onView={() => {
                      setSelectedImage({
                        url: findImageUrl(value, fieldValue),
                        title: fieldValue,
                      });
                      setShowImageDialog(true);
                    }}
                  />
                );
              }

              // Check if text field is long enough to warrant a modal
              const isLongTextField =
                typeof value === "string" &&
                (value.length > 100 || value.includes("\n")) &&
                fieldType !== localeTexts?.FullPage?.constants?.fileText?.file;

              if (
                fieldType === localeTexts?.FullPage?.constants?.referenceText?.reference ||
                fieldType === "link" ||
                fieldType === localeTexts?.FullPage?.constants?.groupText?.group ||
                fieldType === localeTexts?.FullPage?.constants?.blockText?.blocks ||
                isLongTextField ||
                (Array.isArray(value) && fieldType !== localeTexts?.FullPage?.constants?.fileText?.file) ||
                (typeof value === "object" &&
                  value !== null &&
                  fieldType !== localeTexts?.FullPage?.constants?.fileText?.file)
              ) {
                return (
                  <div
                    className={`cell-content ${
                      fieldType === localeTexts?.FullPage?.constants?.referenceText?.reference
                        ? "reference-field-cell"
                        : ""
                    }`}
                    onClick={() => {
                      console.log(`[Modal Opening] Field "${fieldValue}" clicked:`, {
                        fieldValue,
                        value,
                        fieldType,
                        rowId: row?.original?.id,
                      });
                      setSelectedField({
                        field: fieldValue,
                        value: value,
                        rowId: row?.original?.id,
                        type: fieldType,
                      });
                      setShowFieldDialog(true);
                    }}>
                    {renderCellContent(value, fieldType, item?.type, fieldValue)}
                  </div>
                );
              }

              // Check if this is a locale column or other non-editable column
              const isLocaleColumn =
                fieldValue?.toLowerCase() === "locale" || fieldValue?.toLowerCase()?.includes("locale");

              return (
                <div className={`cell-content ${isSelected ? "selected-row" : ""}`}>
                  {isSelected && <div className="selected-row-indicator" />}
                  {isLocaleColumn ? (
                    renderCellContent(value, fieldType, item?.type, fieldValue)
                  ) : (
                    <EditableCell
                      value={value}
                      fieldType={fieldType}
                      fieldName={fieldValue}
                      rowId={rowId}
                      onSave={handleCellSave}
                      renderContent={renderCellContent}
                      fieldConfig={item?.type}
                    />
                  )}
                </div>
              );
            },
          };
        })
        ?.filter(Boolean);
    },
    [renderCellContent, rowSelectionModel, setSelectedImage, setShowImageDialog, resizedColumnWidths, handleCellSave]
  );

  console.log("Generating columns with data:", data);

  const venusColumns = React.useMemo(() => {
    return generateVenusColumns(data);
  }, [data, viewBy]);

  const getData = useCallback(async () => {
    if (!mapper) return;

    const result: any = [];
    const contentData = Object.keys(mapper);

    contentData?.forEach((item: string, index: number) => {
      const newOptions: any = {};
      newOptions.label = item;
      newOptions.value = index;
      newOptions.data = item;
      result.push(newOptions);
    });

    setContentTypeOptions(result);
  }, [mapper]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        if (typeof appConfig?.mapper === "object") {
          setMapper(appConfig?.mapper);
          await getData();
        }
      } catch (error) {
        console.error("Error initializing content types:", error);
      }
    };

    initializeData();
  }, [appConfig, getData]);

  useEffect(() => {
    if (showMessage) {
      setTimeout(() => {
        setShowMessage(false);
      }, TIMEOUTS.showMessage);
    }
    if (showErrorMessage) {
      setTimeout(() => {
        setShowErrorMessage(false);
      }, TIMEOUTS.showError);
    }
  }, [showErrorMessage, showMessage]);

  const defaultEmptyColumns = useMemo(
    () => [
      {
        Header: localeTexts?.FullPage?.defaultTableAttributes?.defaultHeader,
        accessor: (data: TableDataItem) => (
          <div className="cell-content">
            <div>{data?.name || ""}</div>
          </div>
        ),
        addToColumnSelector: true,
        disableSortBy: true,
        width: 400,
      },
    ],
    []
  );

  const handleSingleRowRefresh = async (rowId: number, uid: string) => {
    if (hasUnsavedChanges) {
      cbModal({
        component: (props: { closeModal: () => void }) => (
          <>
            <ModalHeader title="Unsaved Changes" closeModal={props?.closeModal} />
            <ModalBody className="delete-dialog-content">
              <div className="delete-dialog-message">
                <p>{localeTexts?.FullPage?.RefreshModal?.refreshText}</p>
              </div>
            </ModalBody>
            <ModalFooter>
              <ButtonGroup>
                <Button version="v2" buttonType="light" onClick={props?.closeModal} size="small">
                  {localeTexts?.FullPage?.RefreshModal?.button?.cancel}
                </Button>
                <Button
                  version="v2"
                  buttonType="primary"
                  onClick={async () => {
                    props?.closeModal();
                    setHasUnsavedChanges(false);
                    await refreshSingleRow(rowId, uid);
                  }}
                  size="small">
                  {localeTexts?.FullPage?.RefreshModal?.button?.refresh}
                </Button>
              </ButtonGroup>
            </ModalFooter>
          </>
        ),
        modalProps: {
          className: "refresh-confirmation-modal",
          modalWidth: "medium",
          shouldCloseOnOverlayClick: false,
          closeOnEscapeKey: true,
        },
      });
    } else {
      await refreshSingleRow(rowId, uid);
    }
  };

  const refreshSingleRow = async (rowId: number, uid: string) => {
    try {
      setLoading(true);
      const entry = await appSdk?.stack?.ContentType(selectedContentType?.data)?.Entry(uid)?.fetch();

      if (entry) {
        const dataIndex = rowId;

        const updatedRowData = Object?.keys(entry?.entry).reduce((acc: any, key) => {
          if (data?.[0]?.some((header: any) => header?.value === key)) {
            acc[key] = entry?.entry[key];
          }
          return acc;
        }, {});

        const newData = [...data];
        Object?.keys(updatedRowData)?.forEach((key) => {
          const headerIndex = data?.[0]?.findIndex((header: any) => header?.value === key);
          if (headerIndex !== -1 && newData[dataIndex]) {
            newData[dataIndex][headerIndex] = { value: updatedRowData[key] };
          }
        });
        setData(newData);

        setRows((prevRows) =>
          prevRows?.map((row) => (row?.id === rowId ? { ...row, ...updatedRowData, id: rowId, uid } : row))
        );

        setFilteredRows((prevFilteredRows) =>
          prevFilteredRows?.map((row) => (row?.id === rowId ? { ...row, ...updatedRowData, id: rowId, uid } : row))
        );

        Notification({
          notificationContent: {
            text: localeTexts?.FullPage?.Notification?.refreshSuccess?.message,
          },
          type: localeTexts?.FullPage?.Notification?.refreshSuccess?.type,
        });
      }
    } catch (error) {
      console.error("Error refreshing single row:", error);
      Notification({
        notificationContent: {
          text: localeTexts?.FullPage?.Notification?.refreshFailure?.message,
        },
        type: localeTexts?.FullPage?.Notification?.refreshFailure?.type,
      });
    } finally {
      setLoading(false);
    }
  };

  const tableRowActionList = [
    {
      label: localeTexts?.FullPage?.constants?.view?.label,
      icon: localeTexts?.FullPage?.constants?.view?.icon,

      action: (_e: any, row: any) => {
        window?.open(
          `${window?.location?.ancestorOrigins?.item(0)}/#!/stack/${api_key}/content-type/${
            selectedContentType?.data
          }/${master_locale}/entry/${row?.uid}/edit`,
          "_blank"
        );
      },
      disabled: false,
    },
    {
      label: localeTexts?.FullPage?.constants?.refresh?.label,
      icon: localeTexts?.FullPage?.constants?.refresh?.icon,
      action: (_e: any, row: any) => {
        handleSingleRowRefresh(row?.id, row?.uid);
      },
      disabled: false,
    },
  ];

  useEffect(() => {
    if (venusColumns?.length > 0) {
      const initialVisibleColumns = venusColumns?.map((col: any) => col?.accessor);
      setVisibleColumns(initialVisibleColumns);
    }
  }, [venusColumns]);

  const getVisibleColumns = useCallback(() => {
    if (!selectedContentType) return defaultEmptyColumns;
    return venusColumns?.filter((col: any) => visibleColumns?.includes(col?.accessor)) || [];
  }, [venusColumns, visibleColumns, selectedContentType, defaultEmptyColumns]);

  const handleBrowserRefresh = useCallback(
    (e: KeyboardEvent | BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isRefreshing) {
        e.preventDefault();
        e.stopPropagation();

        cbModal({
          component: (props: { closeModal: () => void }) => (
            <>
              <ModalHeader title="Confirm Refresh" closeModal={props?.closeModal} />
              <ModalBody className="delete-dialog-content">
                <div className="delete-dialog-message">
                  <p>{localeTexts?.FullPage?.RefreshModal?.refreshText}</p>
                </div>
              </ModalBody>
              <ModalFooter>
                <ButtonGroup>
                  <Button version="v2" buttonType="light" onClick={props.closeModal} size="small">
                    {localeTexts?.FullPage?.RefreshModal?.button?.cancel}
                  </Button>
                  <Button
                    version="v2"
                    buttonType="primary"
                    onClick={() => {
                      setIsRefreshing(true);
                      props?.closeModal();
                      window?.location?.reload();
                    }}
                    size="small">
                    {localeTexts?.FullPage?.RefreshModal?.button?.refresh}
                  </Button>
                </ButtonGroup>
              </ModalFooter>
            </>
          ),
          modalProps: {
            className: "refresh-confirmation-modal",
            modalWidth: "medium",
            shouldCloseOnOverlayClick: false,
            closeOnEscapeKey: true,
          },
        });

        if (e?.type === "beforeunload") {
          const event = e as BeforeUnloadEvent;
          event.returnValue = "";
          return "";
        }
      }
    },
    [hasUnsavedChanges, isRefreshing]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e?.key === "F5" || (e?.ctrlKey && e?.key === "r")) {
        handleBrowserRefresh(e);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isRefreshing) {
        handleBrowserRefresh(e);
      }
    };

    window?.addEventListener("keydown", handleKeyDown);
    window?.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window?.removeEventListener("keydown", handleKeyDown);
      window?.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, isRefreshing, handleBrowserRefresh]);

  useEffect(() => {
    const handleResize = () => {
      setTableHeight(window?.innerHeight - 225);
    };

    window?.addEventListener("resize", handleResize);
    handleResize();

    return () => window?.removeEventListener("resize", handleResize);
  }, [window?.innerHeight]);

  const handleReset = () => {
    setSelectedContentType(null);
    setData([]);
    setRows([]);
    setRowSelectionModel([]);
    setShowSelected(false);
    setSearchTerm("");
    setTableData([]);
    setTotalCounts(0);
    setFilteredRows([]);
    setVenusData([]);
    setReferenceData(null);
  };

  const handleRowSelect = (rowIds: any) => {
    if (Array?.isArray(rowIds)) {
      setRowSelectionModel(rowIds);

      if (showSelected) {
        const selectedRowData = rows?.filter((row) => rowIds?.includes(row?.id));
        setFilteredRows(selectedRowData);
        setTotalCounts(selectedRowData?.length);
      }
    }
  };

  return (
    <div className="iframe-container">
      <div className="fullPageHeader">
        <div className="header-content">
          <div className="header-main">
            <img src="/Bulk-Edit-Icon.png" alt="Bulk Edit" className="header-icon-image" />
            <div className="header-text">
              <h1 className="header-title">{localeTexts?.FullPage?.title}</h1>
              <p className="header-subtitle">Manage and update multiple entries efficiently</p>
            </div>
          </div>
          <div className="header-description">
            <p className="description-text">
              Select a content type to view and edit entries in bulk. Double-click on any cell to make changes, then use
              the bulk actions to update multiple entries at once.
            </p>
          </div>
        </div>
      </div>

      <div className="content-header">
        <div className="left-content">
          <Select
            version="v2"
            className="Select__placeholder"
            value={selectedContentType}
            onChange={(selectedOption: any) =>
              handleContentTypeChange(
                selectedOption,
                setSelectedContentType,
                appSdk,
                mapper,
                setData,
                setReferenceData,
                setLoading,
                defaultLocale,
                setContentTypeSchema
              )
            }
            options={contentTypeOptions}
            placeholder={localeTexts?.FullPage?.SelectTag?.placeHolder}
            isDisabled={rowSelectionModel?.length > 0}
            isSearchable
            isClearable={false}
            isMulti={false}
            width="200px"
            noOptionsMessage={() =>
              appConfig && !appConfig?.mapper
                ? localeTexts?.FullPage?.SelectTag?.noData
                : localeTexts?.FullPage?.SelectTag?.loading
            }
          />
          <Button
            version="v2"
            className="button-container"
            buttonType="secondary"
            onClick={handleReset}
            icon={localeTexts?.FullPage?.SelectTag?.button?.icon}
            isDisabled={!selectedContentType}>
            {localeTexts?.FullPage?.SelectTag?.button?.label}
          </Button>
        </div>

        <div className="right-content">
          <Dropdown
            version="v2"
            className="button-container"
            closeAfterSelect
            highlightActive
            list={localeOptions}
            type="select"
            onChange={(selectedOption) => {
              const localeValue = selectedOption?.value || selectedOption?.label || selectedOption;
              handleContentTypeChange(
                selectedContentType,
                setSelectedContentType,
                appSdk,
                mapper,
                setData,
                setReferenceData,
                setLoading,
                localeValue,
                setContentTypeSchema
              );
            }}
          />
        </div>
      </div>

      <div className="bulk-edit-table">
        <InfiniteScrollTable
          key={tableKey}
          tableHeight={tableHeight}
          itemSize={180}
          data={filteredRows}
          columns={selectedContentType ? getVisibleColumns() : defaultEmptyColumns}
          loadMoreItems={loadMoreItems}
          uniqueKey="uid"
          fetchTableData={fetchTableData}
          totalCounts={totalCounts}
          loading={loading || isBulkUpdating}
          rowPerPageOptions={[10, 30, 50, 100]}
          minBatchSizeToFetch={30}
          v2Features={{
            tableRowAction: true,
            tableBulkAction: true,
            isNewEmptyState: true,
            pagination: true,
          }}
          tableRowActionList={tableRowActionList}
          isResizable={true}
          onResizeColumn={(columnId: string, newWidth: number) => {
            setResizedColumnWidths((prev: Record<string, number>) => ({
              ...prev,
              [columnId]: newWidth,
            }));
          }}
          isRowSelect={!!selectedContentType}
          columnSelector={true}
          canSearch={true}
          searchPlaceholder={localeTexts?.FullPage?.table?.searchPlaceholder}
          searchValue={searchTerm}
          onSearchChangeEvent={handleSearch}
          resizedColumnWidths={resizedColumnWidths}
          canOrderColumn={true}
          onChangeColumnOrder={onChangeColumnOrder}
          onColumnFreeze={onColumnFreeze}
          freezedColumns={freezedColumns}
          columnsOrder={storedColumnOrder}
          onToggleColumnSelector={onToggleColumnSelector}
          bulkActionList={onRowSelectProp}
          onRowSelect={handleRowSelect}
          selectedRows={rowSelectionModel}
          toolbarPosition={toolbarPosition}
          customEmptyState={
            !selectedContentType ? (
              <EmptyState
                heading={localeTexts?.FullPage?.table?.EmptyState?.noContentTypeSelected?.heading}
                description={localeTexts?.FullPage?.table?.EmptyState?.noContentTypeSelected?.description}
                moduleIcon={localeTexts?.FullPage?.table?.EmptyState?.noContentTypeSelected?.moduleIcon}
                type="secondary"
                className="custom-empty-state"
              />
            ) : loading ? null : searchTerm && filteredRows?.length === 0 ? (
              <EmptyState
                heading={localeTexts?.FullPage?.table?.EmptyState?.noSearchResults?.heading}
                description={localeTexts?.FullPage?.table?.EmptyState?.noSearchResults?.description}
                moduleIcon={localeTexts?.FullPage?.table?.EmptyState?.noSearchResults?.moduleIcon}
                type="secondary"
                className="custom-empty-state"
              />
            ) : totalCounts === 0 && !loading ? (
              <EmptyState
                heading={localeTexts?.FullPage?.table?.EmptyState?.noEntriesFound?.heading}
                description={localeTexts?.FullPage?.table?.EmptyState?.noEntriesFound?.description}
                moduleIcon={localeTexts?.FullPage?.table?.EmptyState?.noEntriesFound?.moduleIcon}
                type="secondary"
                className="custom-empty-state"
              />
            ) : null
          }
          canRefresh
          onRefresh={() => refreshTableData(true)}
        />

        {showFieldDialog && (
          <FieldModal
            setReferenceData={setReferenceData}
            fieldType={selectedField?.type}
            selectedField={selectedField}
            isEditing={isEditing}
            editedValue={editedValue}
            onClose={() => {
              setShowFieldDialog(false);
              setSelectedField(null);
            }}
            onEdit={handleEdit}
            onSave={handleSave}
            onCancelEdit={() => setIsEditing(false)}
            onViewEntry={(uid, contentTypeUid) => {
              window?.open(
                `${window?.location?.ancestorOrigins?.item(
                  0
                )}/#!/stack/${api_key}/content-type/${contentTypeUid}/${master_locale}/entry/${uid}/edit`,
                "_blank"
              );
            }}
            entryContentTypeUid={rows?.find((row) => row?.id === selectedField?.rowId)?.uid || ""}
            contentTypeUid={selectedContentType?.data || ""}
            referenceFieldPath={selectedField?.field || ""}
            parentReferenceData={referenceData}
            locales={localeOptions}
            setAllLocalesData={setAllLocalesData}
          />
        )}

        {showImageDialog && (
          <AssetModal
            selectedImage={selectedImage}
            onClose={() => {
              setShowImageDialog(false);
              setSelectedImage(null);
            }}
            onUpdate={() => {
              openUploadAssetModal({
                sdk: appSdk,
                multiple: false,
                onSubmit: (assets) => {
                  if (assets && assets?.length > 0 && selectedImage) {
                    const fieldName = selectedImage?.title;
                    const rowToUpdate = rows.find((row) => {
                      const value = row[fieldName];
                      const url = findImageUrl(value, fieldName);
                      return url === selectedImage?.url;
                    });

                    if (rowToUpdate) {
                      const updatedValue = updateImageField(
                        rowToUpdate[fieldName],
                        {
                          uid: assets?.[0]?.uid,
                          url: assets?.[0]?.url,
                        },
                        fieldName
                      );

                      setRows((prevRows) =>
                        prevRows.map((r) => (r?.id === rowToUpdate?.id ? { ...r, [fieldName]: updatedValue } : r))
                      );

                      setSelectedImage({
                        url: assets?.[0]?.url,
                        title: fieldName,
                      });
                    }
                  }
                },
              });
            }}
          />
        )}
      </div>
    </div>
  );
};

export default FullPageExtension;
