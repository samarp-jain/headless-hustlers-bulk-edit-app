import React from "react";
import { Select, FieldLabel, Checkbox } from "@contentstack/venus-components";
import { IFieldSelectorProps, TypeSelectOption } from "../../../common/types";
import localeTexts from "../../../common/locales/en-us";
import "./FieldSelector.scss";

const FieldSelector: React.FC<IFieldSelectorProps> = ({
  contentType,
  selectedFields,
  availableFields,
  onFieldsChange,
}) => {
  const handleChange = (options: TypeSelectOption[]) => {
    onFieldsChange(options.map((opt) => opt?.value));
  };

  return (
    <div className="field-selector">
      <FieldLabel htmlFor={`field-selector-${contentType}`} version="v2">
        {localeTexts.ConfigScreen.FieldSelector.label}
      </FieldLabel>
      <div className="select-all-checkbox-wrapper">
        <label className="select-all-checkbox-label">
          <Checkbox
            type="checkbox"
            checked={selectedFields?.length === availableFields?.length && availableFields?.length > 0}
            indeterminate={selectedFields?.length > 0 && selectedFields?.length < availableFields?.length}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const allFieldValues = availableFields?.map((field) => field.value) || [];
              if (e.target.checked) {
                handleChange(availableFields || []);
              } else {
                handleChange([]);
              }
            }}
            className="select-all-checkbox"
          />
          <span className="select-all-label">Select All ({availableFields?.length || 0} fields)</span>
        </label>
      </div>

      <div className="field-selector-select-wrapper">
        <Select
          id={`field-selector-${contentType}`}
          options={availableFields}
          value={availableFields?.filter((field) => selectedFields?.includes(field.value))}
          onChange={handleChange}
          placeholder={localeTexts.ConfigScreen.FieldSelector.placeholder}
          isSearchable
          isMulti
          version="v2"
          multiDisplayLimit={3}
          menuPortalTarget={document.body}
          menuPosition="fixed"
          styles={{
            menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
          }}
        />
      </div>
    </div>
  );
};

export default FieldSelector;
