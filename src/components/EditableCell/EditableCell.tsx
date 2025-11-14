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
      console.log(`[EditableCell] Detected select field for "${fieldName}":`, {
        display_type: fieldConfig?.display_type,
        choices: fieldConfig?.enum?.choices,
        fieldConfig,
      });
      return "select";
    }

    // Check for ISO date in schema (for array fields with date items)
    if (fieldConfig?.schema && Array.isArray(fieldConfig.schema)) {
      const hasIsoDate = fieldConfig.schema.some(
        (item: any) => item?.data_type === "isodate" || item?.data_type === "date"
      );
      if (hasIsoDate) return "date";
    }

    if (fieldConfig?.data_type === "isodate" || fieldConfig?.data_type === "date" || fieldType === "date") {
      return "date";
    }

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
        let dateValue: string;
        if (value) {
          try {
            const parsedDate = new Date(value);
            if (parsedDate && !isNaN(parsedDate.getTime())) {
              dateValue = toISOStringLocal(parsedDate);
            } else {
              console.warn("Invalid date value on edit, using current date:", value);
              dateValue = toISOStringLocal(new Date());
            }
          } catch (error) {
            console.error("Error parsing date on edit:", error);
            dateValue = toISOStringLocal(new Date());
          }
        } else {
          dateValue = toISOStringLocal(new Date());
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
      // Ensure date is saved in ISO 8601 format: "2025-08-14T22:04:52.000Z" (preserves local time)
      let isoDate: string;
      try {
        const dateObj = new Date(editedValue);
        if (dateObj && !isNaN(dateObj.getTime())) {
          isoDate = toISOStringLocal(dateObj);
        } else {
          // If date is invalid, use current date as fallback
          console.warn("Invalid date value, using current date:", editedValue);
          isoDate = toISOStringLocal(new Date());
        }
      } catch (error) {
        // If conversion fails, use current date
        console.error("Error converting date to ISO:", error);
        isoDate = toISOStringLocal(new Date());
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

  // Helper function to convert date to ISO string preserving local time (no timezone conversion)
  const toISOStringLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const milliseconds = String(date.getMilliseconds()).padStart(3, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
  };

  const openDatePickerModal = () => {
    // Parse the current value to a Date object
    let initialDate: Date = new Date();
    try {
      if (editedValue) {
        const parsedDate = new Date(editedValue);
        if (!isNaN(parsedDate.getTime())) {
          initialDate = parsedDate;
        }
      }
    } catch (error) {
      console.error("Error parsing initial date:", error);
      initialDate = new Date();
    }

    // Use state to track the selected date within the modal
    const ModalContent = (props: { closeModal: () => void }) => {
      const [selectedDate, setSelectedDate] = useState<Date>(() => {
        // Ensure we always have a valid date
        return initialDate && !isNaN(initialDate.getTime()) ? initialDate : new Date();
      });

      // Handle DateTimePicker date change
      const handleDateChange = useCallback((date: any) => {
        if (!date) return;

        try {
          let dateObj: Date;

          if (date instanceof Date) {
            dateObj = date;
          } else if (typeof date === "string" || typeof date === "number") {
            dateObj = new Date(date);
          } else {
            return;
          }

          if (dateObj && !isNaN(dateObj.getTime()) && dateObj.getTime() > 0) {
            setSelectedDate(dateObj);
          }
        } catch (error) {
          console.error("Date conversion error:", error);
        }
      }, []);

      // Handle Apply button click and internal Done button - Auto-save to table
      const handleApply = useCallback(() => {
        try {
          if (selectedDate instanceof Date && !isNaN(selectedDate.getTime())) {
            const isoString = toISOStringLocal(selectedDate);
            // Save directly to table
            onSave(fieldName, isoString, rowId);
            setIsEditing(false);
            props.closeModal();
          } else {
            const fallbackIso = toISOStringLocal(new Date());
            onSave(fieldName, fallbackIso, rowId);
            setIsEditing(false);
            props.closeModal();
          }
        } catch (error) {
          console.error("Error converting date to ISO:", error);
          const fallbackIso = toISOStringLocal(new Date());
          onSave(fieldName, fallbackIso, rowId);
          setIsEditing(false);
          props.closeModal();
        }
      }, [selectedDate, props, onSave, fieldName, rowId, setIsEditing]);

      // Handle DateTimePicker's internal done button - Auto-save to table
      const handleDone = useCallback(
        (date?: any) => {
          // Update state if a date is passed
          if (date) {
            try {
              let dateObj: Date;
              if (date instanceof Date) {
                dateObj = date;
              } else {
                dateObj = new Date(date);
              }
              if (dateObj && !isNaN(dateObj.getTime()) && dateObj.getTime() > 0) {
                // Save directly to table (preserve local time)
                const isoString = toISOStringLocal(dateObj);
                onSave(fieldName, isoString, rowId);
                setIsEditing(false);
                props.closeModal();
                return;
              }
            } catch (error) {
              console.error("Error in handleDone:", error);
            }
          }
          // Fallback to using current selectedDate via handleApply
          handleApply();
        },
        [handleApply, props, onSave, fieldName, rowId, setIsEditing]
      );

      return (
        <>
          <ModalHeader title={`Select Date and Time for ${fieldName}`} closeModal={props.closeModal} />
          <ModalBody className="date-picker-modal-body">
            <div className="date-picker-modal-content">
              <DateTimePicker
                key={selectedDate.getTime()}
                initialDate={selectedDate}
                onChange={handleDateChange}
                onDone={handleDone}
                version="v2"
                dateFormat="DD/MM/YYYY"
                timeFormat="HH:mm"
                showTimeSelect={true}
                inline={true}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonGroup>
              <Button version="v2" buttonType="light" onClick={props.closeModal} size="small">
                Cancel
              </Button>
              <Button version="v2" buttonType="primary" onClick={handleApply} size="small">
                Apply
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </>
      );
    };

    cbModal({
      component: ModalContent,
      modalProps: {
        className: "date-picker-modal",
        modalWidth: "medium",
        shouldCloseOnOverlayClick: false,
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
              className="select-option-menu"
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
