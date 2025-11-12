import React, { useState, useCallback, useEffect } from "react";
import {
  Textarea,
  Button,
  Tooltip,
  Select,
  DateTimePicker,
  ToggleSwitch,
  cbModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ButtonGroup,
} from "@contentstack/venus-components";
import "./EditableCell.scss";
import localeTexts from "../../common/locales/en-us";

interface EditableCellProps {
  value: any;
  fieldType: string;
  fieldName: string;
  rowId: number;
  onSave: (fieldName: string, value: any, rowId: number) => void;
  renderContent: (value: any, fieldType: string, fieldConfig: any) => React.ReactNode;
  fieldConfig: any;
}

const EditableCell: React.FC<EditableCellProps> = ({
  value,
  fieldType,
  fieldName,
  rowId,
  onSave,
  renderContent,
  fieldConfig,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedValue, setEditedValue] = useState<any>("");
  const [fieldInputType, setFieldInputType] = useState<string>("text");

  // Sanitize field name for use in CSS selectors
  const sanitizeFieldName = useCallback((name: string) => {
    return name?.replace(/[[\]().]/g, "_")?.replace(/\s+/g, "_");
  }, []);

  // Detect special field types from schema
  const detectSpecialFieldType = useCallback(() => {
    // Check for boolean field first
    if (fieldConfig?.data_type === "boolean" || fieldType === "boolean" || typeof value === "boolean") {
      return "boolean";
    }

    // Check for select field (radio or dropdown)
    if (
      fieldConfig?.display_type === "radio" ||
      fieldConfig?.display_type === "dropdown" ||
      (fieldConfig?.enum?.choices && Array.isArray(fieldConfig.enum.choices))
    ) {
      return "select";
    }

    // Check for ISO date in schema (for array fields with date items)
    if (fieldConfig?.schema && Array.isArray(fieldConfig.schema)) {
      const hasIsoDate = fieldConfig.schema.some(
        (item: any) => item?.data_type === "isodate" || item?.data_type === "date"
      );
      if (hasIsoDate) return "date";
    }

    // Check for direct date field
    if (fieldConfig?.data_type === "isodate" || fieldConfig?.data_type === "date" || fieldType === "date") {
      return "date";
    }

    // Check if value looks like an ISO date string
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return "date";
    }

    return "text";
  }, [fieldConfig, fieldType, value]);

  // Check if the field is editable
  const isEditableField = useCallback(() => {
    const nonEditableTypes = ["reference", "group", "blocks", "file", "array", "object"];
    return !nonEditableTypes?.includes(fieldType);
  }, [fieldType]);

  // Get select options from field config
  const getSelectOptions = useCallback(() => {
    if (fieldConfig?.enum?.choices) {
      return fieldConfig.enum.choices.map((choice: any) => ({
        label: choice.label || choice.value,
        value: choice.value,
      }));
    }
    return [];
  }, [fieldConfig]);

  useEffect(() => {
    const specialType = detectSpecialFieldType();
    setFieldInputType(specialType);
  }, [detectSpecialFieldType]);

  const handleDoubleClick = () => {
    if (isEditableField()) {
      setIsEditing(true);
      const specialType = detectSpecialFieldType();

      if (specialType === "boolean") {
        setEditedValue(value === true || value === "true");
      } else if (specialType === "date") {
        // Ensure valid date format
        let dateValue = value;
        if (value) {
          try {
            const parsedDate = new Date(value);
            if (!isNaN(parsedDate.getTime())) {
              dateValue = parsedDate.toISOString();
            } else {
              dateValue = new Date().toISOString();
            }
          } catch {
            dateValue = new Date().toISOString();
          }
        } else {
          dateValue = new Date().toISOString();
        }
        setEditedValue(dateValue);
      } else if (specialType === "select") {
        setEditedValue(value || "");
      } else {
        setEditedValue(typeof value === "string" ? value : String(value || ""));
      }
    }
  };

  const handleSave = () => {
    if (fieldInputType === "boolean") {
      onSave?.(fieldName, editedValue, rowId);
      setIsEditing(false);
      return;
    }

    if (fieldInputType === "date") {
      // Ensure date is saved in ISO 8601 format: "2025-08-14T08:37:38.000Z"
      let isoDate = editedValue;
      try {
        const dateObj = new Date(editedValue);
        if (!isNaN(dateObj.getTime())) {
          isoDate = dateObj.toISOString();
        }
      } catch {
        // If conversion fails, use current date
        isoDate = new Date().toISOString();
      }
      onSave?.(fieldName, isoDate, rowId);
      setIsEditing(false);
      return;
    }

    if (fieldInputType === "select") {
      if (!editedValue) {
        handleCancel();
        return;
      }
      onSave?.(fieldName, editedValue, rowId);
      setIsEditing(false);
      return;
    }

    if (editedValue?.trim() === "") {
      handleCancel();
      return;
    }
    onSave?.(fieldName, editedValue, rowId);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedValue("");
  };

  const handleBooleanToggle = (checked: boolean) => {
    setEditedValue(checked);
  };

  const handleSelectChange = (option: any) => {
    setEditedValue(option?.value || option);
  };

  const openDatePickerModal = () => {
    // Parse the current value to a Date object
    let initialDate;
    try {
      initialDate = editedValue ? new Date(editedValue) : new Date();
      if (isNaN(initialDate.getTime())) {
        initialDate = new Date();
      }
    } catch {
      initialDate = new Date();
    }

    // Store temporary date value within modal scope
    let tempDateValue = editedValue || new Date().toISOString();

    cbModal({
      component: (props: { closeModal: () => void }) => (
        <>
          <ModalHeader title={`Select Date for ${fieldName}`} closeModal={props.closeModal} />
          <ModalBody className="date-picker-modal-body">
            <div className="date-picker-modal-content">
              <DateTimePicker
                id={`date-modal-${sanitizeFieldName(fieldName)}-${rowId}`}
                value={initialDate}
                onChange={(date: any) => {
                  // Convert to ISO format immediately and store temporarily
                  if (date !== null && date !== undefined) {
                    try {
                      let dateObj;

                      // Handle different date formats
                      if (date instanceof Date) {
                        dateObj = date;
                      } else if (typeof date === "string") {
                        dateObj = new Date(date);
                      } else if (typeof date === "number") {
                        dateObj = new Date(date);
                      } else {
                        dateObj = new Date();
                      }

                      // Validate the date
                      if (!isNaN(dateObj.getTime())) {
                        tempDateValue = dateObj.toISOString();
                        setEditedValue(tempDateValue);
                      } else {
                        console.warn("Invalid date received:", date);
                        tempDateValue = new Date().toISOString();
                        setEditedValue(tempDateValue);
                      }
                    } catch (error) {
                      console.error("Date conversion error:", error);
                      tempDateValue = new Date().toISOString();
                      setEditedValue(tempDateValue);
                    }
                  }
                }}
                version="v2"
                dateFormat="DD/MM/YYYY"
                timeFormat="HH:mm"
                showTimeSelect
                inline
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonGroup>
              <Button
                version="v2"
                buttonType="light"
                onClick={() => {
                  props.closeModal();
                  // Restore original value on cancel
                  setEditedValue(editedValue);
                }}
                size="small">
                Cancel
              </Button>
              <Button
                version="v2"
                buttonType="primary"
                onClick={() => {
                  // Ensure we have a valid ISO date before closing
                  try {
                    const finalDate = new Date(tempDateValue);
                    if (!isNaN(finalDate.getTime())) {
                      setEditedValue(finalDate.toISOString());
                    }
                  } catch (error) {
                    console.error("Error setting final date:", error);
                    setEditedValue(new Date().toISOString());
                  }
                  props.closeModal();
                }}
                size="small">
                Apply
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </>
      ),
      modalProps: {
        className: "date-picker-modal",
        modalWidth: "medium",
        shouldCloseOnOverlayClick: true,
        closeOnEscapeKey: true,
      },
    });
  };

  if (isEditing) {
    return (
      <div className="editable-cell-editor">
        {fieldInputType === "boolean" ? (
          <div className="editable-cell-boolean">
            <div className="boolean-toggle-wrapper">
              <span className="toggle-label">{editedValue ? "True" : "False"}</span>
              <ToggleSwitch
                id={`editable-cell-${sanitizeFieldName(fieldName)}-${rowId}`}
                checked={editedValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleBooleanToggle(e.target.checked)}
              />
            </div>
          </div>
        ) : fieldInputType === "date" ? (
          <div className="editable-cell-date">
            <div className="date-display-wrapper">
              <input
                type="text"
                value={
                  editedValue
                    ? (() => {
                        try {
                          const date = new Date(editedValue);
                          return !isNaN(date.getTime()) ? date.toLocaleString() : "";
                        } catch {
                          return "";
                        }
                      })()
                    : ""
                }
                readOnly
                className="date-display-input"
                placeholder="Select date and time"
              />
              <Button
                version="v2"
                buttonType="secondary"
                onClick={openDatePickerModal}
                size="small"
                icon="Calendar"
                className="date-picker-btn">
                Select Date
              </Button>
            </div>
          </div>
        ) : fieldInputType === "select" ? (
          <div className="editable-cell-select">
            <Select
              id={`editable-cell-${sanitizeFieldName(fieldName)}-${rowId}`}
              options={getSelectOptions()}
              value={getSelectOptions().find((opt: any) => opt.value === editedValue)}
              onChange={handleSelectChange}
              placeholder={`Select ${fieldName}`}
              version="v2"
              isSearchable
              menuPortalTarget={document.body}
              styles={{
                menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
              }}
            />
          </div>
        ) : (
          <Textarea
            id={`editable-cell-${sanitizeFieldName(fieldName)}-${rowId}`}
            placeholder={`Edit ${fieldName}`}
            rows={2}
            maxLength={500}
            version="v2"
            value={editedValue}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedValue(e?.target?.value)}
            className="editable-cell-textarea"
            autoFocus
          />
        )}
        <div className="editable-cell-actions">
          <Button version="v2" buttonType="light" onClick={handleCancel} size="small" className="cancel-btn">
            Cancel
          </Button>
          <Button
            version="v2"
            buttonType="primary"
            onClick={handleSave}
            size="small"
            isDisabled={
              (fieldInputType === "text" && editedValue?.trim() === "") || (fieldInputType === "select" && !editedValue)
            }
            className="update-btn">
            Update
          </Button>
        </div>
      </div>
    );
  }

  // Render display value based on field type
  const renderDisplayValue = () => {
    if (fieldInputType === "boolean") {
      return (
        <div className="boolean-display">
          <span className={`boolean-badge ${value ? "boolean-true" : "boolean-false"}`}>
            {value ? "True" : "False"}
          </span>
        </div>
      );
    }

    if (fieldInputType === "date" && value) {
      try {
        const date = new Date(value);
        return date.toLocaleString();
      } catch {
        return value;
      }
    }

    return renderContent?.(value, fieldType, fieldConfig);
  };

  return (
    <div className={`editable-cell-content ${isEditableField() ? "editable" : ""}`} onDoubleClick={handleDoubleClick}>
      <Tooltip content={String(value || "")} position="bottom">
        <div className="truncate-content">{renderDisplayValue()}</div>
      </Tooltip>

      {isEditableField() && (
        <div className="editable-indicator">
          <span className="edit-hint">{localeTexts?.FullPage?.EditableCell?.doubleClickToEdit}</span>
        </div>
      )}
    </div>
  );
};

export default EditableCell;
