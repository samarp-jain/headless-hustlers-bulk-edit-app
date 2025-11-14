/*eslint-disable*/
import React, { useEffect, useState } from "react";
import { Button, Icon } from "@contentstack/venus-components";
import SelectOption from "../../components/SelectOption";
import "./styles.scss";
import NestedFieldTable from "../../components/NestedFieldTable";
import utils from "../utils";
import EmptyStateTableHeader from "../../components/EmptyStateTableHeader";
import { ContentModelSetting, ManageFieldSetting } from "../../common/types";

declare global {
  interface Window {
    iframeRef: any;
    postRobot: any;
  }
}

const ContentModelSettingModal: React.FC<any> = function ({
  closeModal,
  contentTypes,
  state,
  appSDK,
  fieldTypesToExclude,
}: any) {
  const [contentType, setContentType] = useState<any>(null);
  const [schema, setSchema] = useState<any[]>([]);
  const [entrySchemaUnfiltered, setEntrySchemaUnfiltered] = useState<any[]>();
  const [selectedField, setSelectedField] = useState<any[]>([]);
  const [flattenedSchema, setFlattenedSchema] = useState<any[]>([]);
  const [initialSelectedRowIds, setInitialSelectedRowIds] = useState<any>([]);
  const [extraFields, setExtraFields] = useState<any[]>([]);
  const [excludedUIDs, setExcludedUIDs] = useState<any>(null);

  console.info("state fnwjneewjnfewjf", state.installationData.configuration.excludeKeys);

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const updateFlattenedSchemaWithExtraFields = (newExtraFields: any[]) => {
    if (!schema?.length) return;

    const allFieldsFlat = utils?.traverseSchema(schema, {
      disabledUidFields: [],
    });

    const existingExtraFieldsSet = new Set(extraFields || []);
    const selectedFieldSet = new Set(selectedField);
    const newlyAddedFieldsSet = new Set(newExtraFields.filter((field) => !existingExtraFieldsSet.has(field)));
    const activeExtraFields: string[] = [];
    const updatedSelectedRowIds = { ...initialSelectedRowIds };

    const extraFieldsFormatted = newExtraFields.map((field: string) => {
      const isFieldActive = newlyAddedFieldsSet.has(field) || selectedFieldSet.has(field);

      if (isFieldActive) {
        updatedSelectedRowIds[field] = true;
        activeExtraFields.push(field);
      } else {
        delete updatedSelectedRowIds[field];
      }

      return {
        uid: field,
        data_type: "text",
        display_name: field,
        display_type: "text",
        isFieldActive,
        isExtraField: true,
      };
    });

    allFieldsFlat.forEach((f: any) => {
      f.isFieldActive = selectedField.includes(f.uid);
      if (f.isFieldActive) {
        updatedSelectedRowIds[f.uid] = true;
      }
    });

    const flatArray = [...allFieldsFlat, ...extraFieldsFormatted];
    const newExtraFieldsSet = new Set(newExtraFields);
    const baseSelectedFields = selectedField.filter((uid: string) => !newExtraFieldsSet.has(uid));
    const newSelectedFields = [...baseSelectedFields, ...activeExtraFields];

    setFlattenedSchema(flatArray);
    setInitialSelectedRowIds(updatedSelectedRowIds);
    setSelectedField(newSelectedFields);
  };

  const handleNestedFieldSelection = (selectedFields: any[], disabledFields: string[]) => {
    const fieldUids = selectedFields.map((field: any) => field.fieldUid || field.uid).filter(Boolean);
    setSelectedField(fieldUids);

    const obj: any = {};
    fieldUids.forEach((uid: string) => {
      obj[uid] = true;
    });
    setInitialSelectedRowIds(obj);
  };

  const handleResize = () => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const getSchemaByUid = async (ct: any) => {
    const response = await appSDK?.stack.getContentType(ct?.value, {
      include_global_field_schema: true,
    });
    setEntrySchemaUnfiltered(response?.content_type?.schema);
    const currentSettings = state?.installationData?.configuration?.manageFields?.find(
      (e: ManageFieldSetting) => e?.contentType === ct?.value
    );

    console.info("currentSettings at line 142", currentSettings);

    if (currentSettings?.selectedFieldsUID) {
      setSchema(response?.content_type?.schema);

      const config = state?.installationData?.configuration || {};
      const excludeKeysObj = config?.excludeKeys || {};
      const excludedFieldTypesRaw = config?.excludedFieldTypes || [];

      const excludedUIDsForContentType: string[] = Array.isArray(excludeKeysObj[ct?.value])
        ? excludeKeysObj[ct?.value]
        : [];

      const excludedFieldTypes: string[] = Array.isArray(excludedFieldTypesRaw)
        ? excludedFieldTypesRaw.map((item: any) => (typeof item === "string" ? item : item?.value)).filter(Boolean)
        : [];

      const allFieldsFlat = utils?.traverseSchema(response?.content_type?.schema, { disabledUidFields: [] });

      setExcludedUIDs(excludedUIDsForContentType);

      const isFieldTypeExcludedCheck = (field: any): boolean => {
        if (!field || !field.data_type) return false;
        const fieldType = field.data_type.toLowerCase();
        const displayType = field.display_type?.toLowerCase();

        for (const excludedType of excludedFieldTypes) {
          const type = excludedType.toLowerCase();
          if (type === "date" && fieldType === "isodate") return true;
          if (type === "isodate" && fieldType === "isodate") return true;
          if (type === "number" && fieldType === "number") return true;
          if (type === "boolean" && fieldType === "boolean") return true;
          if (type === "file" && fieldType === "file") return true;
          if (type === "select" && (displayType === "dropdown" || displayType === "radio")) return true;
          if (type === "url" && (fieldType === "url" || fieldType === "link")) return true;
          if (type === "link" && fieldType === "link") return true;
          if (type === "non-localizable" && field.non_localizable === true) return true;
          if (type === "taxonomies" && fieldType === "taxonomy") return true;
          if (type === "taxonomy" && fieldType === "taxonomy") return true;
          if (type === "json" && fieldType === "json") return true;
          if (type === fieldType) return true;
        }
        return false;
      };

      const isFieldExcludedByUID = (fieldUid: string): boolean => {
        return excludedUIDsForContentType.some((excludedUID: string) => {
          const normalizedExcludedUID = excludedUID.replace(/\[\d+\]/g, "").replace(/\[\]/g, "");
          const normalizedFieldUid = fieldUid.replace(/\[\d+\]/g, "").replace(/\[\]/g, "");

          // Exact match
          if (excludedUID === fieldUid) return true;
          if (normalizedExcludedUID === normalizedFieldUid) return true;

          // Check if fieldUid is a descendant of excludedUID
          // e.g., excludedUID: "global_1.modular_blocks_1[]"
          //       fieldUid: "global_1.modular_blocks_1[0].some_field"
          if (normalizedFieldUid.startsWith(normalizedExcludedUID + ".")) return true;

          // If excludedUID ends with [], it means exclude all array items
          if (excludedUID.includes("[]")) {
            const baseExcludedPath = excludedUID.replace(/\[\]/g, "");
            if (normalizedFieldUid === baseExcludedPath || normalizedFieldUid.startsWith(baseExcludedPath + ".")) {
              return true;
            }
          }

          // Check if excludedUID contains the field as part of its path
          if (
            excludedUID.includes(`.${fieldUid}.`) ||
            excludedUID.includes(`.${fieldUid}[`) ||
            excludedUID.endsWith(`.${fieldUid}`)
          )
            return true;

          return false;
        });
      };

      const excludedFieldUIDs = allFieldsFlat
        .filter((f: any) => isFieldTypeExcludedCheck(f) || isFieldExcludedByUID(f.uid))
        .map((f: any) => f.uid);

      const filteredSelectedFields = currentSettings.selectedFieldsUID.filter(
        (uid: string) => !excludedFieldUIDs.includes(uid)
      );

      allFieldsFlat.forEach((f: any) => {
        f.isFieldActive = filteredSelectedFields.includes(f.uid);
      });

      const initialSelectedObj: any = {};
      allFieldsFlat.forEach((e: any) => {
        if (e?.isFieldActive) {
          initialSelectedObj[e.uid] = true;
        }
      });

      let flatArray = allFieldsFlat;

      if (currentSettings?.extraFields?.length > 0) {
        setExtraFields(currentSettings.extraFields);
        const extraFieldsFormatted = currentSettings.extraFields.map((field: any) => ({
          uid: field,
          data_type: "text",
          display_name: field,
          isFieldActive: filteredSelectedFields.includes(field),
          isExtraField: true,
        }));
        flatArray = [...flatArray, ...extraFieldsFormatted];

        extraFieldsFormatted.forEach((field: any) => {
          if (field.isFieldActive) {
            initialSelectedObj[field.uid] = true;
          }
        });

        const activeExtraFields = extraFieldsFormatted
          .filter((field: any) => field.isFieldActive)
          .map((field: any) => field.uid);

        const baseSelectedFields = allFieldsFlat
          .filter((field: any) => field.isFieldActive)
          .map((field: any) => field.uid);

        setSelectedField([...baseSelectedFields, ...activeExtraFields]);
      } else {
        setExtraFields([]);
        const baseSelectedFields = allFieldsFlat
          .filter((field: any) => field.isFieldActive)
          .map((field: any) => field.uid);

        setSelectedField(baseSelectedFields);
      }

      setFlattenedSchema(flatArray);
      setInitialSelectedRowIds({ ...initialSelectedObj });
      return;
    }

    const config = state?.installationData?.configuration || {};
    const excludeKeysObj = config?.excludeKeys || {};
    console.info("excludeKeysObj", excludeKeysObj);
    const excludedFieldTypesRaw = config?.excludedFieldTypes || [];

    const excludedUIDs: string[] = Array.isArray(excludeKeysObj[ct?.value]) ? excludeKeysObj[ct?.value] : [];

    const excludedFieldTypes: string[] = Array.isArray(excludedFieldTypesRaw)
      ? excludedFieldTypesRaw.map((item: any) => (typeof item === "string" ? item : item?.value)).filter(Boolean)
      : [];

    const allFieldsFlat = utils?.traverseSchema(response?.content_type?.schema, { disabledUidFields: [] });

    console.log("allFieldsFlat", allFieldsFlat);
    setExcludedUIDs(excludedUIDs);

    const isFieldTypeExcluded = (field: any): boolean => {
      if (!field || !field.data_type) return false;

      const fieldType = field.data_type.toLowerCase();
      const displayType = field.display_type?.toLowerCase();

      for (const excludedType of excludedFieldTypes) {
        const type = excludedType.toLowerCase();

        if (type === "date" && fieldType === "isodate") return true;
        if (type === "isodate" && fieldType === "isodate") return true;
        if (type === "number" && fieldType === "number") return true;
        if (type === "boolean" && fieldType === "boolean") return true;
        if (type === "file" && fieldType === "file") return true;
        if (type === "select" && (displayType === "dropdown" || displayType === "radio")) return true;
        if (type === "url" && (fieldType === "url" || fieldType === "link")) return true;
        if (type === "link" && fieldType === "link") return true;
        if (type === "non-localizable" && field.non_localizable === true) return true;
        if (type === "taxonomies" && fieldType === "taxonomy") return true;
        if (type === "taxonomy" && fieldType === "taxonomy") return true;
        if (type === "json" && fieldType === "json") return true;
        if (type === fieldType) return true;
      }

      return false;
    };

    const collectExcludedFields = (schemaArray: any[], prefix: string = ""): string[] => {
      const excluded: string[] = [];

      schemaArray.forEach((field: any) => {
        const fieldPath = prefix ? `${prefix}.${field.uid}` : field.uid;

        if (isFieldTypeExcluded(field)) {
          excluded.push(prefix ? fieldPath : field.uid);
        }

        const isExcludedByUID = excludedUIDs.some((excludedUID: string) => {
          const normalizedExcludedUID = excludedUID.replace(/\[\d+\]/g, "").replace(/\[\]/g, "");
          const normalizedFieldPath = fieldPath.replace(/\[\d+\]/g, "").replace(/\[\]/g, "");

          // Exact match
          if (excludedUID === field.uid) return true;
          if (excludedUID === fieldPath || normalizedExcludedUID === normalizedFieldPath) return true;

          // Check if fieldPath is a descendant of excludedUID
          // e.g., excludedUID: "global_1.modular_blocks_1[]"
          //       fieldPath: "global_1.modular_blocks_1[0].some_field"
          if (normalizedFieldPath.startsWith(normalizedExcludedUID + ".")) return true;

          // If excludedUID ends with [], it means exclude all array items
          if (excludedUID.includes("[]")) {
            const baseExcludedPath = excludedUID.replace(/\[\]/g, "");
            if (normalizedFieldPath === baseExcludedPath || normalizedFieldPath.startsWith(baseExcludedPath + ".")) {
              return true;
            }
          }

          // Check if excludedUID contains the field as part of its path
          if (
            excludedUID.includes(`.${field.uid}.`) ||
            excludedUID.includes(`.${field.uid}[`) ||
            excludedUID.endsWith(`.${field.uid}`)
          )
            return true;

          return false;
        });

        if (isExcludedByUID) {
          excluded.push(prefix ? fieldPath : field.uid);
        }

        if (field.schema && Array.isArray(field.schema)) {
          excluded.push(...collectExcludedFields(field.schema, fieldPath));
        }

        if (field.blocks && Array.isArray(field.blocks)) {
          field.blocks.forEach((block: any) => {
            if (block.schema && Array.isArray(block.schema)) {
              const blockPath = `${fieldPath}.${block.uid}`;
              excluded.push(...collectExcludedFields(block.schema, blockPath));
            }
          });
        }

        if (field.data_type === "global_field" && field.schema && Array.isArray(field.schema)) {
          excluded.push(...collectExcludedFields(field.schema, fieldPath));
        }
      });

      return excluded;
    };

    const excludedByTypeAndUID = collectExcludedFields(response?.content_type?.schema || []);
    const excludedFieldsSet = new Set(excludedByTypeAndUID);

    const selectedFields = allFieldsFlat.filter((f: any) => !excludedFieldsSet.has(f.uid)).map((f: any) => f.uid);

    allFieldsFlat.forEach((f: any) => {
      f.isFieldActive = selectedFields.includes(f.uid);
    });

    const initialSelectedObj: any = {};
    allFieldsFlat.forEach((e: any) => {
      if (e?.isFieldActive) {
        initialSelectedObj[e.uid] = true;
      }
    });

    setSchema(response?.content_type?.schema);
    setExtraFields([]);
    setSelectedField(selectedFields);
    setFlattenedSchema(allFieldsFlat);
    setInitialSelectedRowIds({ ...initialSelectedObj });
  };

  const handleSelectedContentType = (e: any) => {
    setContentType(e);
    if (e) {
      getSchemaByUid(e);
      return;
    }
    setSchema([]);
    setInitialSelectedRowIds({});
    setSelectedField([]);
    setExtraFields([]);
  };

  // Auto-select content type if only one is provided
  useEffect(() => {
    if (contentTypes?.length === 1 && !contentType) {
      const singleContentType = contentTypes[0];
      setContentType(singleContentType);
      getSchemaByUid(singleContentType);
    }
  }, [contentTypes]);

  const updateConfig = async (e: any) => {
    // eslint-disable-next-line prefer-const
    const updatedConfig = state?.installationData?.configuration || {};
    updatedConfig.manageFields = e;
    if (typeof state?.setInstallationData !== "undefined") {
      await state?.setInstallationData({
        ...state?.installationData,
        configuration: updatedConfig,
      });
    }
    return true;
  };

  // handle inclusion of fields
  const handleIncludeFields = () => {
    if (contentType) {
      const reducedArr = Array.isArray(state?.installationData?.configuration?.manageFields)
        ? [...state?.installationData?.configuration?.manageFields]
        : [];

      const setting: ContentModelSetting = {
        contentType: contentType?.value,
        selectedFieldsUID: selectedField,
        isEnabled: true,
        extraFields: extraFields,
      };

      if (reducedArr?.some((e: ContentModelSetting) => e?.contentType === setting?.contentType)) {
        const settingIndex = reducedArr.findIndex((e: ContentModelSetting) => e?.contentType === setting?.contentType);
        if (selectedField.length === 0) {
          reducedArr[settingIndex].isEnabled = false;
        } else {
          reducedArr[settingIndex].isEnabled = true;
        }
        reducedArr[settingIndex].selectedFieldsUID = selectedField;
        reducedArr[settingIndex].extraFields = extraFields;
        updateConfig(reducedArr);
        utils.notify("success", "Content Model Settings saved successfully.");
        closeModal();
        return;
      }
      if (selectedField.length === 0) {
        setting.isEnabled = false;
      }
      reducedArr.push(setting);
      updateConfig(reducedArr);
      utils.notify("success", "Content Model Settings saved successfully.");
      closeModal();
      return;
    }
    utils.notify("warning", "Warning: Please select a content type to proceed.");
  };

  return (
    <div>
      <div className="modal-config-wrapper page-modal-wrapper">
        <div className="flex FullPage_Modal_Header">
          <h6 className="ml-30 mt-20">Content Type Settings</h6>
          <Icon
            icon="CancelLarge"
            size="small"
            className="Tab__icon mt-20"
            hover
            hoverType="secondary"
            style={{
              marginRight: "30px",
              marginLeft: "auto",
              cursor: "pointer",
            }}
            onClick={closeModal}
          />
        </div>
        <div className="modal-body">
          <div className="modal-header-actions">
            <Button buttonType="secondary" size="small" icon="v2-Save" version="v2" onClick={handleIncludeFields}>
              Save
            </Button>
          </div>
          <div
            className={`nested-fields-container ${windowSize?.height < 786 ? "nested-fields-container--compact" : ""}`}>
            {schema.length > 0 ? (
              <NestedFieldTable
                schemaa={schema}
                selectedFieldsUID={selectedField}
                onFieldSelection={handleNestedFieldSelection}
                enableExtraFields={false}
                contentType={contentType}
                setSchema={(newSchema: any) => {
                  setSchema(newSchema);
                }}
                extraFields={extraFields}
                setExtraFields={(newExtraFields: any[]) => {
                  setExtraFields(newExtraFields);
                  updateFlattenedSchemaWithExtraFields(newExtraFields);
                }}
              />
            ) : (
              <EmptyStateTableHeader
                description="No Content Type Selected"
                customClass="modal-empty-state-table-header"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ContentModelSettingModal;
