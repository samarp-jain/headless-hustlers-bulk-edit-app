import React, { useEffect, useState } from "react";
import { Button, EntryReferenceDetails, Icon, Textarea, Tooltip } from "@contentstack/venus-components";
import { useAppSdk } from "../../common/hooks/useAppSdk";
import { getReferenceFieldData } from "../../containers/FullPage/FullPage.helper";
import { IFieldModalProps, IReferenceItem, IReferenceProps } from "../../common/types";
import { FIELDTYPES } from "../../common/constants";
import localeTexts from "../../common/locales/en-us";
import "./FieldModal.scss";

const FieldModal: React.FC<IFieldModalProps> = ({
  setReferenceData,
  entryContentTypeUid,
  contentTypeUid,
  referenceFieldPath,
  fieldType,
  selectedField,
  isEditing,
  editedValue,
  onClose,
  onEdit,
  onSave,
  onCancelEdit,
  onViewEntry,
  parentReferenceData,
}) => {
  const appSdk = useAppSdk();
  const [localReferenceData, setLocalReferenceData] = useState<any>(parentReferenceData || null);
  const textAreaRowsCount = 5;

  useEffect(() => {
    if (parentReferenceData) {
      setLocalReferenceData(parentReferenceData);
      return;
    }

    const fetchReferenceData = async () => {
      if (
        selectedField?.type === localeTexts.FullPage.constants.referenceText.reference &&
        entryContentTypeUid &&
        contentTypeUid &&
        referenceFieldPath
      ) {
        try {
          const data = await getReferenceFieldData(entryContentTypeUid, contentTypeUid, referenceFieldPath, appSdk);

          setLocalReferenceData(data);
          setReferenceData(data);
        } catch (error) {
          console.error("Error fetching reference data:", error);
        }
      }
    };

    fetchReferenceData();
  }, [
    entryContentTypeUid,
    contentTypeUid,
    referenceFieldPath,
    selectedField?.type,
    appSdk,
    setReferenceData,
    parentReferenceData,
  ]);

  if (!selectedField) return null;

  const isEditableValue = (value: any): boolean => {
    return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
  };

  const extractAllReferenceItems = (data?: any, rowUid?: string): IReferenceItem[] => {
    const items: IReferenceItem[] = [];

    const extractFromObject = (obj: any, path: string = "") => {
      if (!obj || typeof obj !== "object") return;

      if (obj?.title && obj?._content_type_uid) {
        if (!rowUid || obj?.uid === rowUid) {
          items?.push({
            title: obj?.title,
            uid: obj?.uid,
            contentTypeUid: obj?._content_type_uid,
            data: obj,
          });
        }
        return;
      }

      if (Array.isArray(obj)) {
        obj?.forEach((item, index) => {
          extractFromObject(item, `${path}[${index}]`);
        });
        return;
      }

      Object?.keys(obj)?.forEach((key) => {
        const value = obj[key];
        const currentPath = path ? `${path}?.${key}` : key;

        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            extractFromObject(item, `${currentPath}[${index}]`);
          });
        } else if (value && typeof value === "object") {
          extractFromObject(value, currentPath);
        }
      });
    };

    extractFromObject(data);
    return items;
  };

  const isReferenceObject = (obj: IReferenceProps): boolean => {
    if (!obj || typeof obj !== "object") return false;
    return "uid" in obj && "_content_type_uid" in obj;
  };

  const isReferenceArray = (arr: IReferenceProps[]): boolean => {
    if (!Array.isArray(arr) || arr?.length === 0) return false;
    return arr.every((item) => {
      if (Array.isArray(item)) {
        return isReferenceArray(item);
      }
      return isReferenceObject(item);
    });
  };

  const extractReferencesFromArray = (arr: IReferenceProps[]): string[] => {
    return arr.reduce((uids: string[], item) => {
      if (Array?.isArray(item)) {
        return [...uids, ...extractReferencesFromArray(item)];
      }
      if (isReferenceObject(item) && item?.uid) {
        return [...uids, item?.uid];
      }
      return uids;
    }, []);
  };

  const renderFieldValue = (value: any, depth = 0, parentKey = "", currentPath = "") => {
    if (value === null || value === undefined) return "null";

    if (
      selectedField?.type === FIELDTYPES.referenceType ||
      (value?.uid && value?._content_type_uid) ||
      (Array?.isArray(value) && isReferenceArray(value))
    ) {
      const referenceDataToUse = parentReferenceData || localReferenceData;
      const currentUids = Array?.isArray(value)
        ? extractReferencesFromArray(value)
        : typeof value === "string"
        ? value
        : value?.uid;

      const allReferenceItems = Array?.isArray(currentUids)
        ? currentUids?.flatMap((uid) => extractAllReferenceItems(referenceDataToUse, uid))
        : extractAllReferenceItems(referenceDataToUse, currentUids);

      return (
        <div className="reference-field-details">
          {allReferenceItems?.length > 0 ? (
            <div className="reference-items-container">
              <div className="reference-items-header">
                <Icon icon="v2-Bullet" />
                <span className="items-count">
                  {allReferenceItems?.length > 1
                    ? `${allReferenceItems?.length} ${localeTexts.FullPage.constants.referenceText.referenceditems}`
                    : localeTexts.FullPage.constants.referenceText.referenceditem}
                </span>
              </div>

              {allReferenceItems?.map((item, index) => (
                <div key={index}>
                  {item?.uid && item?.contentTypeUid && onViewEntry && (
                    <EntryReferenceDetails
                      title={item?.title}
                      version="v2"
                      contentType={item?.contentTypeUid}
                      onEdit={() => {
                        if (onViewEntry && item?.uid && item?.contentTypeUid) {
                          onViewEntry(item?.uid, item?.contentTypeUid);
                        }
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-reference-items">
              <Icon icon="InformationSmall" />
              <span>{localeTexts.FullPage.FieldDialog.noReference}</span>
            </div>
          )}
        </div>
      );
    }

    if (isEditableValue(value)) {
      if (isEditing && editedValue?.key === parentKey && editedValue?.path === currentPath) {
        const isValueEmpty = !editedValue?.value || editedValue?.value?.toString().trim() === "";
        return (
          <div className="field-edit-container">
            <Textarea
              id={FIELDTYPES.textType}
              value={editedValue?.value}
              onChange={(e: any) => onEdit(parentKey, e?.target?.value, currentPath)}
              className="field-edit-input"
              rows={textAreaRowsCount}
              autoFocus
              error={isValueEmpty ? localeTexts.FullPage.FieldDialog.valueEmpty : ""}
              version="v2"
            />
            <div className="field-edit-actions">
              <Button
                version="v2"
                buttonType="primary"
                onClick={() => onSave(currentPath)}
                icon={localeTexts.Icons.update}
                disabled={isValueEmpty}>
                {localeTexts.FullPage.FieldDialog.button.updateButton}
              </Button>
              <Button version="v2" buttonType="secondary" onClick={onCancelEdit} icon={localeTexts.Icons.cancel}>
                {localeTexts.FullPage.FieldDialog.button.cancelButton}
              </Button>
            </div>
          </div>
        );
      }
      return (
        <div className="editable-field">
          <span className="field-value" onDoubleClick={() => onEdit(parentKey, value, currentPath)}>
            {String(value)}
          </span>
          <Button
            version="v2"
            buttonType="tertiary"
            onClick={() => onEdit(parentKey, value, currentPath)}
            icon={localeTexts.Icons.edit}
            onlyIcon
            className="edit-button"
          />
        </div>
      );
    }

    if (Array.isArray(value)) {
      if (isReferenceArray(value)) {
        return null;
      }
      return (
        <div className="field-array">
          <div className="array-header">
            <Icon icon="ListBullet" />
            <span className="array-count">
              {value?.length} {localeTexts.FullPage.constants.items}
            </span>
          </div>
          <div className="array-content">
            {value.map((item, index) => (
              <div key={index} className="array-item">
                {selectedField?.type === FIELDTYPES.referenceType ? (
                  <div className="reference-item">
                    <Icon icon={localeTexts.Icons.link} />
                    <span>
                      {item?.title ||
                        item?.name ||
                        item?.uid ||
                        localeTexts.FullPage.constants.referenceText.referenceditem}
                    </span>
                  </div>
                ) : isEditableValue(item) ? (
                  isEditing &&
                  editedValue?.key === parentKey &&
                  editedValue?.path === currentPath &&
                  editedValue?.index === index ? (
                    <div className="field-edit-container">
                      <Textarea
                        id={FIELDTYPES.textType}
                        value={editedValue?.value}
                        onChange={(e: any) => {
                          onEdit(parentKey, e.target.value, currentPath, index);
                        }}
                        className="field-edit-input"
                        autoFocus
                        rows={textAreaRowsCount}
                        error={
                          !editedValue?.value || editedValue?.value.toString().trim() === ""
                            ? localeTexts.FullPage.FieldDialog.valueEmpty
                            : ""
                        }
                        version="v2"
                      />
                      <div className="field-edit-actions">
                        <Button
                          version="v2"
                          buttonType="primary"
                          onClick={() => onSave(currentPath)}
                          icon={localeTexts.Icons.update}
                          disabled={!editedValue?.value || editedValue?.value?.toString()?.trim() === ""}>
                          {localeTexts.FullPage.FieldDialog.button.updateButton}
                        </Button>
                        <Button
                          version="v2"
                          buttonType="secondary"
                          onClick={onCancelEdit}
                          icon={localeTexts.Icons.close}>
                          {localeTexts.FullPage.FieldDialog.button.cancelButton}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="editable-field">
                      <span
                        className="field-value"
                        onDoubleClick={() => {
                          onEdit(parentKey, item, currentPath, index);
                        }}>
                        {String(item)}
                      </span>
                      <Button
                        version="v2"
                        buttonType="tertiary"
                        onClick={() => {
                          onEdit(parentKey, item, currentPath, index);
                        }}
                        icon={localeTexts.Icons.edit}
                        onlyIcon
                        className="edit-button"
                      />
                    </div>
                  )
                ) : (
                  renderFieldValue(
                    item,
                    depth + 1,
                    `${parentKey}[${index}]`,
                    currentPath ? `${currentPath}[${index}]` : `[${index}]`
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (typeof value === "object") {
      return (
        <div className="field-object">
          <div className="object-content" style={{ marginLeft: `${depth * 20}px` }}>
            {Object?.entries(value)?.map(([key, val]) => (
              <div key={key} className="object-item">
                <div className="object-key">
                  <Icon version="v2" icon="ChevronRight" className="chevron-icon" />
                  <strong>{key}:</strong>
                </div>
                {renderFieldValue(val, depth + 1, key, currentPath ? `${currentPath}.${key}` : key)}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return JSON.stringify(value);
  };

  return (
    <div className="field-dialog-overlay" onClick={!isEditing ? onClose : undefined}>
      <div className="field-dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="field-dialog-header">
          <div className="header-title">
            <Icon icon="Field" />
            <h3>
              {localeTexts.FullPage.FieldDialog.title} {selectedField?.field}
              {selectedField?.type === FIELDTYPES.referenceType && (
                <span className="field-type-label">
                  ({localeTexts.FullPage.constants.referenceText.referenceField}
                  {selectedField?.referenceTitle ? ` - ${selectedField?.referenceTitle}` : ""})
                </span>
              )}
            </h3>
          </div>
          {!isEditing && (
            <Tooltip content="Close" position="top">
              <Button version="v2" buttonType="none" onlyIcon="true" onClick={onClose} icon="Cancel" />
            </Tooltip>
          )}
        </div>
        <div className="field-dialog-body">{renderFieldValue(selectedField?.value)}</div>
        <div className="field-dialog-footer">
          <Icon icon="InformationSmallPurple" />
          <span>
            {selectedField?.type === FIELDTYPES.referenceType ||
            (selectedField?.value?.uid && selectedField?.value?._content_type_uid)
              ? localeTexts.FullPage.FieldDialog.referencedBody
              : localeTexts.FullPage.FieldDialog.body}{" "}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FieldModal;
