import React, { useState, useEffect } from "react";
import { Button, Icon, Textarea, ToggleSwitch } from "@contentstack/venus-components";
import { FIELDTYPES } from "../../../common/constants";
import localeTexts from "../../../common/locales/en-us";
import { useAppSdk } from "../../../common/hooks/useAppSdk";

interface FieldSpecificProps {
  locale: {
    value: string;
    label: string;
  };
  selectedField: any;
  allLocalesData: Record<string, any>;
  masterLocale: string;
  getFieldValueForLocale: (field: string, rowId: number, locale: string) => any;
  renderFieldValue: (value: any, locale?: string) => React.ReactNode;
  isSaving: boolean;
  contentTypeUid: string;
  entryContentTypeUid: string;
  onDataUpdated?: (locale: string, updatedData: any) => void;
}

const FieldSpecific: React.FC<FieldSpecificProps> = ({
  locale,
  selectedField,
  allLocalesData,
  masterLocale,
  getFieldValueForLocale,
  renderFieldValue,
  isSaving,
  contentTypeUid,
  entryContentTypeUid,
  onDataUpdated,
}) => {
  const appSdk = useAppSdk();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedValue, setEditedValue] = useState<any>("");
  const [isSavingLocale, setIsSavingLocale] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const textAreaRowsCount = 5;

  useEffect(() => {
    if (isEditing) {
      setSaveSuccess(false);
      setSaveError(null);
    }
  }, [isEditing]);

  const showRawData = (locale: string) => {
    alert(`Raw data for ${locale} logged to console`);
  };

  const hasLocaleData = allLocalesData[locale?.value] !== undefined;
  let localeValue = null;

  if (hasLocaleData) {
    try {
      localeValue = getFieldValueForLocale(selectedField?.field, selectedField?.rowId, locale?.value);
    } catch (error) {
      console.error(`Error getting value for locale ${locale?.value}:`, error);
    }
  }

  useEffect(() => {
    if (isEditing && localeValue !== null && localeValue !== undefined) {
      setEditedValue(localeValue);
    }
  }, [isEditing, localeValue]);

  useEffect(() => {
    if (hasLocaleData && !isEditing) {
      try {
        const newValue = getFieldValueForLocale(selectedField?.field, selectedField?.rowId, locale.value);
        if (newValue !== localeValue) {
        }
      } catch (error) {
        console.error(`Error updating local value for locale ${locale.value}:`, error);
      }
    }
  }, [
    allLocalesData,
    locale?.value,
    selectedField?.field,
    selectedField?.rowId,
    getFieldValueForLocale,
    hasLocaleData,
    isEditing,
  ]);

  const handleEdit = (value: any) => {
    setEditedValue(value);
    setIsEditing(true);
  };

  const handleSave = async () => {
    const isValueEmpty =
      typeof editedValue !== "boolean" &&
      (editedValue === null || editedValue === undefined || editedValue?.toString().trim() === "");

    if (isValueEmpty) {
      setSaveError("Value cannot be empty");
      return;
    }

    setIsSavingLocale(true);
    setSaveError(null);

    try {
      const updatedLocaleData = { ...allLocalesData[locale.value] };

      if (selectedField?.path) {
        const pathParts = selectedField?.path.split(".");
        let current = updatedLocaleData;

        for (let i = 0; i < pathParts.length - 1; i++) {
          if (!current[pathParts[i]]) {
            current[pathParts[i]] = {};
          }
          current = current[pathParts[i]];
        }

        current[pathParts[pathParts.length - 1]] = editedValue;
      } else {
        updatedLocaleData[selectedField?.field] = editedValue;
      }

      if (onDataUpdated) {
        onDataUpdated(locale?.value, updatedLocaleData);
      }

      setSaveSuccess(true);

      setTimeout(() => {
        setIsEditing(false);
        setIsSavingLocale(false);
        setSaveSuccess(false);
      }, 1000);
    } catch (error: any) {
      console.error("Error updating value:", error);
      setSaveError(error?.message || "Unknown error");
      setIsSavingLocale(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const renderEditableContent = () => {
    if (isEditing) {
      if (typeof editedValue === "boolean") {
        return (
          <div className="field-edit-container">
            <div className="toggle-container">
              <ToggleSwitch
                id={`toggle-${locale?.value}`}
                checked={editedValue}
                onChange={(checked: boolean) => setEditedValue(checked)}
                disabled={isSavingLocale}
              />
              <span className="toggle-label">{editedValue ? "True" : "False"}</span>
            </div>
            {saveError && <div className="error-message">{saveError}</div>}
            <div className="field-edit-actions">
              <Button
                version="v2"
                buttonType="primary"
                onClick={handleSave}
                icon={isSavingLocale ? "Loader" : saveSuccess ? "CheckCircle" : localeTexts.Icons.save}
                disabled={isSavingLocale}>
                {isSavingLocale
                  ? "Saving..."
                  : saveSuccess
                  ? "Saved!"
                  : localeTexts.FullPage.FieldDialog.button.saveButton}
              </Button>
              <Button
                version="v2"
                buttonType="secondary"
                onClick={handleCancel}
                icon={localeTexts.Icons.cancel}
                disabled={isSavingLocale}>
                {localeTexts.FullPage.FieldDialog.button.cancelButton}
              </Button>
            </div>
          </div>
        );
      }

      const isValueEmpty = !editedValue || editedValue.toString().trim() === "";
      return (
        <div className="field-edit-container">
          <Textarea
            id={`${FIELDTYPES.textType}-${locale?.value}`}
            value={editedValue}
            onChange={(e: any) => setEditedValue(e?.target?.value)}
            className="field-edit-input"
            rows={textAreaRowsCount}
            autoFocus
            error={isValueEmpty || saveError ? saveError || localeTexts.FullPage.FieldDialog.valueEmpty : ""}
            version="v2"
            disabled={isSavingLocale}
          />
          <div className="field-edit-actions">
            <Button
              version="v2"
              buttonType="primary"
              onClick={handleSave}
              icon={isSavingLocale ? "Loader" : saveSuccess ? "CheckCircle" : localeTexts.Icons.save}
              disabled={isValueEmpty || isSavingLocale}>
              {isSavingLocale
                ? "Saving..."
                : saveSuccess
                ? "Saved!"
                : localeTexts.FullPage.FieldDialog.button.saveButton}
            </Button>
            <Button
              version="v2"
              buttonType="secondary"
              onClick={handleCancel}
              icon={localeTexts.Icons.cancel}
              disabled={isSavingLocale}>
              {localeTexts.FullPage.FieldDialog.button.cancelButton}
            </Button>
          </div>
        </div>
      );
    }

    if (typeof localeValue === "string" || typeof localeValue === "number" || typeof localeValue === "boolean") {
      return (
        <div className="editable-field">
          <span className="field-value" onDoubleClick={() => handleEdit(localeValue)}>
            {typeof localeValue === "boolean" ? (localeValue ? "True" : "False") : String(localeValue)}
          </span>
          <Button
            version="v2"
            buttonType="tertiary"
            onClick={() => handleEdit(localeValue)}
            icon={localeTexts.Icons.edit}
            onlyIcon
            className="edit-button"
            disabled={isSaving || isSavingLocale}
          />
        </div>
      );
    }

    return renderFieldValue(localeValue, locale.value);
  };

  return (
    <div className="locale-section">
      <div className="locale-header">
        <Icon icon="Language" />
        <h4>
          {locale.label}
          {locale.value === masterLocale && (
            <span className="master-badge"> ({localeTexts.FullPage.EditableCell.master})</span>
          )}
        </h4>
        <div className="locale-actions">
          <Button
            version="v2"
            buttonType="tertiary"
            onlyIcon
            icon="Bug"
            onClick={() => showRawData(locale.value)}
            title="Debug: Show raw data"
            className="debug-button"
          />
        </div>
      </div>
      <div className="locale-content">
        {!hasLocaleData ? (
          <div className="no-locale-data">
            <Icon icon="InformationSmall" />
            <span>{localeTexts.FullPage.EditableCell.noDataAvailable}</span>
          </div>
        ) : localeValue === null || localeValue === undefined ? (
          <div className="no-locale-data">
            <Icon icon="InformationSmall" />
            <span>
              {" "}
              "{selectedField?.field}" {localeTexts.FullPage.EditableCell.noDataAvailableForLocale}
            </span>
          </div>
        ) : (
          renderEditableContent()
        )}
      </div>
    </div>
  );
};

export default FieldSpecific;
