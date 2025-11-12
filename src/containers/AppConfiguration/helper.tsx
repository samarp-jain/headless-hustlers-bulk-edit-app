/* eslint-disable import/prefer-default-export */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import localeTexts from "../../common/locales/en-us";
import { TypeSelectOption } from "../../common/types";
export const multiSelecteFields = ["dropdown", "checkbox"];

interface MappingWrapperProps {
  contentType: string;
  fields: string[];
  contentTypeOptions: TypeSelectOption[];
  contentSchemaOptions: { [key: string]: TypeSelectOption[] };
  getMapper: (mapper: { [key: string]: string[] }) => void;
  allContentTypes: boolean;
  includeAssets: boolean;
}

export const MappingWrapper: React.FC<MappingWrapperProps> = ({
  contentType,
  fields,
  contentTypeOptions,
  contentSchemaOptions,
  getMapper,
  allContentTypes,
  includeAssets,
}) => {
  const updateFields = (isChecked: boolean, selectedField: string) => {
    const updatedFields = isChecked ? [...fields, selectedField] : fields?.filter((field) => field !== selectedField);
    getMapper?.({ [contentType]: updatedFields });
  };

  return (
    <div className="mapping-wrapper">
      <h3>{contentType}</h3>
      <div className="field-selection">
        {contentSchemaOptions?.[contentType]?.map((field: TypeSelectOption) => (
          <div key={field?.value} className="field-item">
            <input
              type="checkbox"
              id={`${contentType}-${field?.value}`}
              checked={fields?.includes(field?.value)}
              onChange={(e) => updateFields(e?.target?.checked, field?.value)}
            />
            <label htmlFor={`${contentType}-${field?.value}`}>{field?.label}</label>
          </div>
        ))}
      </div>
    </div>
  );
};
