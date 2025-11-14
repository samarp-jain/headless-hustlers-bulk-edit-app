/* eslint-disable */
import React, { useState, useEffect } from "react";
import InlineForms from "../InlineForms";
import "./styles.scss";

export interface TableColumn {
  key: string;
  title: string;
  width: string;
  render?: (value: any, record: any, index: number) => React.ReactNode;
  renderHeader?: () => React.ReactNode;
  className?: string;
}

export interface TableProps {
  columns: TableColumn[];
  dataSource: any[];
  rowKey?: string | ((record: any) => string);
  className?: string;
  stickyHeader?: boolean;
  height?: string;
  onRowClick?: (record: any, index: number) => void;
  renderExpandableRow?: (record: any) => React.ReactNode;
  expandedRowKeys?: string[];
  onExpand?: (expanded: boolean, record: any) => void;
  tableRef?: React.RefObject<HTMLDivElement>;
  enableExtraFields?: boolean;
  contentType?: any;
  setSchema?: (schema: any) => void;
  extraFields?: any[];
  setExtraFields?: (fields: any[]) => void;
}

const CustomTable: React.FC<TableProps> = ({
  columns,
  dataSource,
  rowKey = "key",
  className = "",
  stickyHeader = true,
  height = "460px",
  onRowClick,
  renderExpandableRow,
  expandedRowKeys = [],
  onExpand,
  tableRef,
  enableExtraFields = false,
  extraFields = [],
  setExtraFields,
}) => {
  const [localExtraFields, setLocalExtraFields] = useState<any>([]);
  const [newFieldName, setNewFieldName] = useState<string>("");

  const effectiveExtraFields = setExtraFields ? extraFields : localExtraFields;

  useEffect(() => {
    if (setExtraFields && extraFields) {
      setLocalExtraFields(extraFields);
    }
  }, [extraFields, setExtraFields]);

  useEffect(() => {
    return () => {
      setLocalExtraFields([]);
      setNewFieldName("");
    };
  }, []);

  const getRowKey = (record: any, index: number): string => {
    if (typeof rowKey === "function") {
      return rowKey(record);
    }
    return record[rowKey] || index.toString();
  };

  const isExpanded = (record: any): boolean => {
    const key = getRowKey(record, 0);
    return expandedRowKeys.includes(key);
  };

  const handleExpand = (record: any) => {
    if (onExpand) {
      const expanded = isExpanded(record);
      onExpand(!expanded, record);
    }
  };

  // Handle adding new field
  const handleAddField = () => {
    if (
      newFieldName.trim() &&
      !effectiveExtraFields.includes(newFieldName.trim())
    ) {
      const newFields = [...effectiveExtraFields, newFieldName.trim()];
      if (setExtraFields) {
        setExtraFields(newFields);
      } else {
        setLocalExtraFields(newFields);
      }
      setNewFieldName("");
    }
  };

  // Handle removing field
  const handleRemoveField = (fieldToRemove: string) => {
    const newFields = effectiveExtraFields.filter(
      (field: string) => field !== fieldToRemove
    );
    if (setExtraFields) {
      setExtraFields(newFields);
    } else {
      setLocalExtraFields(newFields);
    }
  };

  // Handle cancel for InlineForms
  const handleCancel = () => {
    setNewFieldName("");
  };

  // Merge dataSource with extra fields at the end
  const getMergedDataSource = () => {
    const extraFieldsData = effectiveExtraFields.map(
      (field: string, index: number) => ({
        uid: field,
        fieldUid: field,
        display_name: field,
        data_type: "text",
        isExtraField: true,
        isFieldActive: true,
      })
    );
    return [...dataSource, ...extraFieldsData];
  };

  const renderCell = (column: TableColumn, record: any, index: number) => {
    const value = record[column.key];

    if (column.render) {
      return column.render(value, record, index);
    }

    return value;
  };

  return (
    <div className={`custom-table-container ${className}`} ref={tableRef}>
      <div className={`custom-table-header ${stickyHeader ? "sticky" : ""}`}>
        {columns.map((column) => (
          <div
            key={column.key}
            className={`custom-table-header-cell ${column.className || ""}`}
            data-width={column.width}
          >
            {column.renderHeader ? column.renderHeader() : column.title}
          </div>
        ))}
      </div>

      {/* Field Addition UI - Under Headers */}
      {enableExtraFields && (
        <div className="field-addition-container">
          <div className="field-addition-content">
            {/* InlineForms component */}
            <InlineForms
              onCancel={handleCancel}
              onSave={handleAddField}
              disableSave={!newFieldName.trim()}
              defaultOpen={true}
              fieldArray={[]}
              fieldName={newFieldName}
              onFieldNameChange={setNewFieldName}
            />
          </div>
        </div>
      )}

      <div className="custom-table-body">
        {getMergedDataSource().map((record, index) => {
          const key = getRowKey(record, index);
          const expanded = isExpanded(record);
          const hasExpandableContent =
            renderExpandableRow && renderExpandableRow(record);
          const uid = record.fieldUid || record.uid;

          return (
            <div
              key={key}
              className="custom-table-row-container"
              data-uid={uid}
            >
              <div
                className="custom-table-row"
                data-level={record.level || 0}
                data-uid={uid}
                onClick={() => {
                  if (onRowClick) onRowClick(record, index);
                  if (hasExpandableContent) handleExpand(record);
                }}
              >
                {columns.map((column) => (
                  <div
                    key={column.key}
                    className={`custom-table-cell ${column.className || ""}`}
                    data-width={column.width}
                  >
                    {renderCell(column, record, index)}
                  </div>
                ))}
              </div>

              {hasExpandableContent && expanded && (
                <div className="custom-table-expandable-row">
                  {renderExpandableRow(record)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CustomTable;
