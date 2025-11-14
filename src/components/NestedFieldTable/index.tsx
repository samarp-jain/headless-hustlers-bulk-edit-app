/* eslint-disable */
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Checkbox, Icon } from "@contentstack/venus-components";
import CustomTable, { TableColumn } from "../CustomTable";
import "./styles.scss";

interface NestedFieldTableProps {
  schemaa: any[];
  selectedFieldsUID?: string[];
  onFieldSelection: (selectedFields: any[], disabledFields: string[]) => void;
  enableExtraFields?: boolean;
  contentType?: any;
  setSchema?: (schema: any) => void;
  extraFields?: any[];
  setExtraFields?: (fields: any[]) => void;
}

declare module "react" {
  interface CSSProperties {
    "--level"?: number;
    "--padding-left"?: string;
    "--chevron-left"?: string;
    "--vertical-line-left"?: string;
    "--horizontal-line-width"?: string;
  }
}

const getAllFieldKeys = (schema: any[]): string[] => {
  let keys: string[] = [];
  schema.forEach((item) => {
    if (item.fieldUid) {
      keys.push(item.fieldUid);
    }
    if (item.schema) {
      keys.push(...getAllFieldKeys(item.schema));
    }
    if (item.blocks) {
      item.blocks.forEach((block: any) => {
        if (block.fieldUid) {
          keys.push(block.fieldUid);
        }
        if (block.schema) {
          keys.push(...getAllFieldKeys(block.schema));
        }
      });
    }
  });
  return keys;
};

const countAllFields = (schema: any[]): number => {
  let count = 0;
  schema.forEach((item) => {
    count++;
    if (item.schema && item.schema.length > 0) {
      count += countAllFields(item.schema);
    }
    if (item.blocks && item.blocks.length > 0) {
      item.blocks.forEach((block: any) => {
        count++;
        if (block.schema && block.schema.length > 0) {
          count += countAllFields(block.schema);
        }
      });
    }
  });
  return count;
};

const processBlockUid = (blocksObj: any, prev_uid?: any) => {
  const currentUid = `${prev_uid ? `${prev_uid}.` : ""}${blocksObj.uid}`;
  blocksObj["fieldUid"] = currentUid;

  blocksObj.blocks?.forEach((bl_el: any) => {
    bl_el["fieldUid"] = `${currentUid}.${bl_el.uid}`;
    bl_el.schema?.forEach((bl_sch_el: any) => {
      if (bl_sch_el.data_type === "blocks") {
        processBlockUid(bl_sch_el, `${currentUid}.${bl_el.uid}`);
      } else if (bl_sch_el.data_type === "group") {
        processGroupUid(bl_sch_el, `${currentUid}.${bl_el.uid}`, true);
      } else if (bl_sch_el.data_type === "global_field") {
        processGroupUid(bl_sch_el, `${currentUid}.${bl_el.uid}`, true);
      } else {
        bl_sch_el["fieldUid"] = `${currentUid}.${bl_el.uid}.${bl_sch_el.uid}`;
      }
    });
  });
};

const processGroupUid = (groupObj: any, prev_uid?: any, disableCheck?: boolean) => {
  const currentUid = `${prev_uid ? `${prev_uid}.` : ""}${groupObj.uid}`;
  groupObj.fieldUid = currentUid;

  groupObj.schema?.forEach((el: any) => {
    if (el.data_type === "blocks") {
      processBlockUid(el, currentUid);
    } else if (el.data_type === "group") {
      processGroupUid(el, currentUid, groupObj.multiple ? true : disableCheck);
    } else if (el.data_type === "global_field") {
      processGroupUid(el, currentUid, groupObj.multiple ? true : el.multiple);
    } else {
      el["fieldUid"] = `${currentUid}.${el.uid}`;
    }
  });
};

const NestedFieldTable: React.FC<NestedFieldTableProps> = ({
  schemaa,
  selectedFieldsUID = [],
  onFieldSelection,
  enableExtraFields = false,
  contentType,
  setSchema,
  extraFields = [],
  setExtraFields,
}) => {
  const [selectedField, setSelectedFields] = useState<any[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const lastNotifiedSelection = useRef<string>("");
  const isInitializing = useRef<boolean>(false);
  const lastSelectedData = useRef<string>("");
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  // Process schema data first so it's available for the initialization effect
  const processedSchemaData = useMemo(() => {
    if (!schemaa || schemaa.length === 0) {
      return { entries: [], totalFieldCount: 0, allKeys: [] };
    }

    const Main_obj: any = JSON.parse(JSON.stringify(schemaa));

    Main_obj.forEach((el: any) => {
      if (el.data_type === "blocks") {
        processBlockUid(el);
      } else if (el.data_type === "group" || el.data_type === "global_field") {
        processGroupUid(el, undefined, el.multiple);
      } else {
        el["fieldUid"] = el.uid;
      }
    });

    const totalCount = countAllFields(Main_obj);

    const allKeys = getAllFieldKeys(Main_obj);

    return { entries: Main_obj, totalFieldCount: totalCount, allKeys };
  }, [schemaa]);

  useEffect(() => {
    isInitializing.current = true;

    const allFieldKeys = processedSchemaData.allKeys;
    const allFieldKeysWithExtra = [...allFieldKeys, ...(extraFields || [])];

    if (allFieldKeysWithExtra.length > 0 && selectedFieldsUID.length > 0) {
      const enabledFields = allFieldKeysWithExtra
        .filter((uid) => selectedFieldsUID?.includes(uid))
        .map((uid) => ({
          fieldUid: uid,
          uid: uid.split(".").pop() || uid,
          title: uid.split(".").pop() || uid,
        }));

      setSelectedFields(enabledFields);
    } else {
      setSelectedFields([]);
    }

    const timeoutId = setTimeout(() => {
      isInitializing.current = false;
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [selectedFieldsUID, processedSchemaData.allKeys, extraFields]);

  useEffect(() => {
    setExpandedKeys([]);
  }, [processedSchemaData.allKeys]);

  useEffect(() => {
    if (selectedField.length === 0) {
      setExpandedKeys([]);
      return;
    }

    const selectedFieldUids = selectedField.map((f) => f.fieldUid);
    const keysToExpand: string[] = [];

    const checkAndExpandParents = (schema: any[], parentUid: string = "") => {
      schema.forEach((field) => {
        const fieldUid = field.fieldUid || field.uid;
        const isBlockOrGlobalField =
          field.data_type === "blocks" || field.data_type === "global_field" || field.data_type === "group";

        if (isBlockOrGlobalField) {
          const hasSelectedChildren = getAllChildFieldUIDs(field).some((childUid) =>
            selectedFieldUids.includes(childUid)
          );

          if (hasSelectedChildren && !keysToExpand.includes(fieldUid)) {
            keysToExpand.push(fieldUid);
          }

          if (field.schema && field.schema.length > 0) {
            checkAndExpandParents(field.schema, fieldUid);
          }

          if (field.blocks && field.blocks.length > 0) {
            field.blocks.forEach((block: any) => {
              const blockUid = block.fieldUid || block.uid;
              const blockHasSelectedChildren = getAllChildFieldUIDs(block).some((childUid) =>
                selectedFieldUids.includes(childUid)
              );

              if (blockHasSelectedChildren && !keysToExpand.includes(blockUid)) {
                keysToExpand.push(blockUid);
              }

              if (block.schema && block.schema.length > 0) {
                checkAndExpandParents(block.schema, blockUid);
              }
            });
          }
        }

        if (field.schema && field.schema.length > 0) {
          checkAndExpandParents(field.schema, fieldUid);
        }
      });
    };

    checkAndExpandParents(processedSchemaData.entries);
    setExpandedKeys(keysToExpand);
  }, [selectedField, processedSchemaData.entries]);

  const handleFieldSelectionChange = useCallback(() => {
    if (isInitializing.current) {
      return;
    }

    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    // Calculate disabled fields as the inverse of selected fields
    const selectedFieldUids = selectedField.map((f) => f.fieldUid);
    const currentDisabledFields = processedSchemaData.allKeys.filter((key) => !selectedFieldUids.includes(key));

    const currentSelection = JSON.stringify(selectedFieldUids.sort());
    const currentDisabled = JSON.stringify(currentDisabledFields.sort());

    if (onFieldSelection && currentSelection !== lastNotifiedSelection.current && !isInitializing.current) {
      lastNotifiedSelection.current = currentSelection;

      notificationTimeoutRef.current = setTimeout(() => {
        if (!isInitializing.current && onFieldSelection) {
          // Pass both the selected fields and the disabled fields to the parent
          onFieldSelection(selectedField, currentDisabledFields);
        }
        notificationTimeoutRef.current = null;
      }, 100);
    }
  }, [selectedField, onFieldSelection, processedSchemaData.allKeys]);

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    handleFieldSelectionChange();
  }, [handleFieldSelectionChange]);

  const fieldItemClass = function (moduleVal: any) {
    const fieldUid = moduleVal.fieldUid || moduleVal.uid;
    const findModuleVal = selectedField.find((item: any) => item.fieldUid === fieldUid);
    let isSelected = !!findModuleVal;

    if (!isSelected && (moduleVal.schema || moduleVal.blocks)) {
      const allChildUIDs = getAllChildFieldUIDs(moduleVal);
      if (allChildUIDs.length > 0) {
        const selectedChildren = allChildUIDs.filter((childUID) =>
          selectedField.some((sf) => sf.fieldUid === childUID)
        );
        if (selectedChildren.length > 0) {
          isSelected = true;
        }
      }
    }
    return isSelected;
  };

  const getAllChildFieldUIDs = (field: any): string[] => {
    let childUIDs: string[] = [];

    if (field.schema && field.schema.length > 0) {
      field.schema.forEach((childField: any) => {
        if (childField.fieldUid) {
          childUIDs.push(childField.fieldUid);
        }
        childUIDs.push(...getAllChildFieldUIDs(childField));
      });
    }

    if (field.blocks && field.blocks.length > 0) {
      field.blocks.forEach((block: any) => {
        if (block.fieldUid) {
          childUIDs.push(block.fieldUid);
        }
        childUIDs.push(...getAllChildFieldUIDs(block));
      });
    }

    return childUIDs;
  };

  const handleFieldChange = (field: any, isChecked: boolean) => {
    let selectedVal: any = [...selectedField];
    const fieldUid = field.fieldUid || field.uid;

    if (isChecked) {
      // Add the current field if not already selected
      const existingIndex = selectedVal.findIndex((item: any) => item.fieldUid === fieldUid);
      if (existingIndex === -1) {
        selectedVal.push({
          uid: field.uid,
          title: field.uid || field.title,
          fieldUid: fieldUid,
        });
      }

      if (field.schema || field.blocks) {
        const allUIDs = getAllChildFieldUIDs(field);
        allUIDs.forEach((childUID: string) => {
          const childExists = selectedVal.findIndex((item: any) => item.fieldUid === childUID);
          if (childExists === -1) {
            selectedVal.push({
              uid: childUID.split(".").pop(),
              title: childUID.split(".").pop(),
              fieldUid: childUID,
            });
          }
        });
      }
    } else {
      selectedVal = selectedVal.filter((item: any) => item.fieldUid !== fieldUid);

      if (field.schema || field.blocks) {
        const allUIDs = getAllChildFieldUIDs(field);
        allUIDs.forEach((childUID: string) => {
          selectedVal = selectedVal.filter((item: any) => item.fieldUid !== childUID);
        });
      }

      selectedVal = selectedVal.filter((item: any) => !item.fieldUid.startsWith(fieldUid + "."));
    }

    setSelectedFields(selectedVal);
  };

  const handleExpand = (expanded: boolean, record: any) => {
    const key = record.fieldUid || record.uid;
    if (expanded) {
      setExpandedKeys([...expandedKeys, key]);

      // Schedule scrolling after the DOM has been updated
      setTimeout(() => {
        if (tableContainerRef.current) {
          // Find the row element by its data-uid attribute
          const rowElement = tableContainerRef.current.querySelector(`[data-uid="${key}"]`);

          if (rowElement) {
            // Get the row's position relative to the container
            const containerRect = tableContainerRef.current.getBoundingClientRect();
            const rowRect = rowElement.getBoundingClientRect();
            const rowPosition = rowRect.top - containerRect.top;

            // Calculate the target scroll position to show the expanded content
            // Add some extra space to show more of the expanded content
            const targetScroll = tableContainerRef.current.scrollTop + rowPosition - 100;

            // Smooth scroll to the target position
            tableContainerRef.current.scrollTo({
              top: targetScroll,
              behavior: "smooth",
            });
          }
        }
      }, 100); // Small delay to ensure DOM is updated
    } else {
      setExpandedKeys(expandedKeys.filter((k) => k !== key));
    }
  };

  const calculateHierarchySpacing = (level: number) => {
    const baseIndent = 0;
    const levelIncrement = 1;
    const chevronBasePosition = -1.75;
    const chevronIncrement = 1;
    const chevronWidth = 18;
    const chevronWidthRem = chevronWidth / 16;

    const parentChevronCenter =
      level === 0 ? chevronBasePosition : chevronBasePosition + (level - 1) * chevronIncrement + chevronWidthRem / 2;

    return {
      paddingLeft: level === 0 ? 0 : baseIndent + level * levelIncrement,
      chevronLeft: level === 0 ? chevronBasePosition : chevronBasePosition + level * chevronIncrement,
      verticalLineLeft: parentChevronCenter,
      horizontalLineWidth: 1,
    };
  };

  // Helper to find last visible descendant index for a parent
  const findLastDescendantIndex = (parentIndex: number, data: any[]): number => {
    const parent = data[parentIndex];
    const parentFieldUid = parent.fieldUid || parent.uid;
    const parentLevel = parent.level;

    let lastDescendantIndex = parentIndex;

    for (let i = parentIndex + 1; i < data.length; i++) {
      const currentItem = data[i];
      const currentFieldUid = currentItem.fieldUid || currentItem.uid;

      if (currentItem.level > parentLevel) {
        if (currentFieldUid.startsWith(parentFieldUid + ".")) {
          lastDescendantIndex = i;
        }
      } else {
        break;
      }
    }

    return lastDescendantIndex;
  };

  const renderFieldName = (value: any, record: any, index: number) => {
    const hasChildren =
      record.data_type === "blocks" ||
      record.data_type === "group" ||
      record.data_type === "global_field" ||
      (record.schema && record.schema.length > 0) ||
      (record.blocks && record.blocks.length > 0);

    const isExpanded = expandedKeys.includes(record.fieldUid || record.uid);
    const level = record.level || 0;
    const spacing = calculateHierarchySpacing(level);
    const isLastChild = record.isLastSibling;

    const ancestorLines: Array<{
      level: number;
      left: string;
      shouldExtend: boolean;
    }> = [];

    if (level > 0) {
      for (let ancestorLevel = 0; ancestorLevel < level; ancestorLevel++) {
        for (let i = index - 1; i >= 0; i--) {
          const potentialAncestor = flattenedData[i];
          if (potentialAncestor.level === ancestorLevel) {
            const ancestorFieldUid = potentialAncestor.fieldUid || potentialAncestor.uid;
            const currentFieldUid = record.fieldUid || record.uid;

            if (currentFieldUid.startsWith(ancestorFieldUid + ".")) {
              const lastDescendantIndex = findLastDescendantIndex(i, flattenedData);
              const ancestorSpacing = calculateHierarchySpacing(ancestorLevel + 1);
              const shouldExtend = index < lastDescendantIndex;

              ancestorLines.push({
                level: ancestorLevel,
                left: `${ancestorSpacing.verticalLineLeft}rem`,
                shouldExtend: shouldExtend,
              });
            }
            break;
          }
        }
      }
    }

    const containerStyle = {
      "--level": level,
      "--padding-left": `${spacing.paddingLeft}rem`,
      "--chevron-left": `${spacing.chevronLeft}rem`,
      "--vertical-line-left": `${spacing.verticalLineLeft}rem`,
      "--horizontal-line-width": `${spacing.horizontalLineWidth}rem`,
    } as React.CSSProperties;

    const fieldStyle = {
      paddingLeft: `${spacing.paddingLeft}rem`,
      "--chevron-left": `${spacing.chevronLeft}rem`,
      "--vertical-line-left": `${spacing.verticalLineLeft}rem`,
      "--horizontal-line-width": `${spacing.horizontalLineWidth}rem`,
    } as React.CSSProperties;

    const chevronClassName = `hierarchy-chevron ${isExpanded ? "expanded" : "collapsed"} level-${level}`;

    return (
      <div className="field-hierarchy-container" style={containerStyle}>
        {ancestorLines.map((ancestorLine, idx) => (
          <div
            key={`ancestor-line-${idx}`}
            className={`ancestor-vertical-line ${ancestorLine.shouldExtend ? "extend" : "stop"}`}
            style={{ left: ancestorLine.left }}
          />
        ))}

        <div
          className={`hierarchical-field-name dynamic-level ${isLastChild ? "is-last-child" : ""}`}
          style={fieldStyle}
          data-extend-line={!isLastChild}>
          {hasChildren && (
            <Icon
              icon="Right"
              className={chevronClassName}
              onClick={(e: any) => {
                e.stopPropagation();
                handleExpand(!isExpanded, record);
              }}
              version="v2"
              style={{ left: `${spacing.chevronLeft}rem` }}
            />
          )}
          <div className="field-checkbox-container">
            <Checkbox
              onChange={(evt: any) => {
                evt.stopPropagation();
                handleFieldChange(record, evt.target.checked);
              }}
              checked={fieldItemClass(record)}
              id={record.uid}
              text={
                <div title={record.uid} className="field-label-text">
                  {record.uid || record.title}
                </div>
              }
            />
          </div>
        </div>
      </div>
    );
  };

  // Flatten data to include nested fields as separate rows when expanded
  const flattenedData = useMemo(() => {
    const flattenFields = (
      fields: any[],
      parentLevel: number = 0,
      parentPath: string = "",
      parentFieldUid: string = ""
    ): any[] => {
      let result: any[] = [];

      fields.forEach((field, index) => {
        const fieldPath = parentPath ? `${parentPath}.${field.uid}` : field.uid;
        const fieldUid = field.fieldUid || field.uid;
        const isLastSibling = index === fields.length - 1;

        const fieldWithMeta = {
          ...field,
          level: parentLevel,
          index,
          parentPath,
          fieldPath,
          isLastSibling,
          parentFieldUid,
        };

        result.push(fieldWithMeta);

        if (expandedKeys.includes(fieldUid)) {
          if (field.schema && field.schema.length > 0) {
            result.push(...flattenFields(field.schema, parentLevel + 1, fieldPath, fieldUid));
          }

          // Add block children
          if (field.blocks && field.blocks.length > 0) {
            field.blocks.forEach((block: any, blockIndex: number) => {
              const blockPath = `${fieldPath}.blocks.${block.uid}`;
              const blockFieldUid = block.fieldUid || block.uid;
              const isLastBlock = blockIndex === field.blocks.length - 1;

              const blockWithMeta = {
                ...block,
                level: parentLevel + 1,
                index: blockIndex,
                parentPath: fieldPath,
                fieldPath: blockPath,
                isLastSibling: isLastBlock,
                parentFieldUid: fieldUid,
              };
              result.push(blockWithMeta);

              if (expandedKeys.includes(blockFieldUid) && block.schema && block.schema.length > 0) {
                result.push(...flattenFields(block.schema, parentLevel + 2, blockPath, blockFieldUid));
              }
            });
          }
        }
      });

      return result;
    };

    return flattenFields(processedSchemaData.entries);
  }, [processedSchemaData.entries, expandedKeys]);

  // Calculate if all fields are selected
  const allFieldUIDs = useMemo(() => {
    return [...processedSchemaData.allKeys, ...(extraFields || [])];
  }, [processedSchemaData.allKeys, extraFields]);

  const allSelected = useMemo(() => {
    if (allFieldUIDs.length === 0) return false;
    return allFieldUIDs.every((uid) => selectedField.some((sf) => sf.fieldUid === uid));
  }, [allFieldUIDs, selectedField]);

  const someSelected = useMemo(() => {
    if (allFieldUIDs.length === 0) return false;
    return allFieldUIDs.some((uid) => selectedField.some((sf) => sf.fieldUid === uid)) && !allSelected;
  }, [allFieldUIDs, selectedField, allSelected]);

  // Handle select all / deselect all
  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      // Select all fields
      const allFields = allFieldUIDs.map((uid) => ({
        uid: uid.split(".").pop() || uid,
        title: uid.split(".").pop() || uid,
        fieldUid: uid,
      }));
      setSelectedFields(allFields);
    } else {
      // Deselect all fields
      setSelectedFields([]);
    }
  };

  // Render header checkbox for select all
  const renderFieldNameHeader = () => {
    const checkboxRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (checkboxRef.current && someSelected) {
        checkboxRef.current.indeterminate = true;
      } else if (checkboxRef.current) {
        checkboxRef.current.indeterminate = false;
      }
    }, [someSelected, checkboxRef.current]);

    return (
      <div className="header-checkbox-container">
        <Checkbox
          onChange={(evt: any) => {
            handleSelectAll(evt.target.checked);
          }}
          checked={allSelected}
          inputRef={checkboxRef}
          id="select-all-fields"
        />
        <span className="header-title">UIDS</span>
      </div>
    );
  };

  const columns: TableColumn[] = [
    {
      key: "uid",
      title: "UIDS",
      width: "40%",
      className: "field-name-cell",
      render: renderFieldName,
      renderHeader: renderFieldNameHeader,
    },
    {
      key: "data_type",
      title: "Data Type",
      width: "15%",
      render: (value) => value || "",
    },
    {
      key: "mandatory",
      title: "Mandatory",
      width: "15%",
      render: (value) => (value ? "True" : "False"),
    },
    {
      key: "non_localizable",
      title: "Non Localizable",
      width: "15%",
      render: (value) => (value ? "True" : "False"),
    },
    {
      key: "multiple",
      title: "Multiple",
      width: "15%",
      render: (value) => (value ? "True" : "False"),
    },
  ];
  const totalFieldCount = useMemo(() => {
    return processedSchemaData.totalFieldCount + (extraFields?.length || 0);
  }, [processedSchemaData.totalFieldCount, extraFields]);

  return (
    <div className="hierarchical-field-table">
      <div className="field-count-header">
        <span className="field-count-text">Total Fields {totalFieldCount}</span>
      </div>

      <CustomTable
        columns={columns}
        dataSource={flattenedData}
        rowKey={(record) => record.fieldUid || record.uid}
        stickyHeader={true}
        expandedRowKeys={expandedKeys}
        onExpand={handleExpand}
        tableRef={tableContainerRef}
        enableExtraFields={enableExtraFields}
        contentType={contentType}
        setSchema={setSchema}
        extraFields={extraFields}
        setExtraFields={setExtraFields}
      />
    </div>
  );
};

export default NestedFieldTable;
