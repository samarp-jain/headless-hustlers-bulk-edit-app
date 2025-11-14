import { Select } from "@contentstack/venus-components";
import React from "react";

interface Props {
  values: SelectOptions[];
  handleSelection: Function;
  value: string;
  selectOptionLabel: string;
  isClearable: boolean;
  isSearchable: boolean;
  placeholder: string;
  hideSelectedOptions: boolean;
  isDisabled: boolean;
  isMulti: boolean;
  className: string;
  width: string;
}

export interface SelectOptions {
  label: string;
  value: string;
}

const SelectOption = React.memo(
  ({
    selectOptionLabel,
    handleSelection,
    values,
    value,
    isClearable,
    isSearchable,
    placeholder,
    isDisabled,
    hideSelectedOptions,
    isMulti,
    className,
    width,
  }: Props) => (
    <Select
      selectLabel={selectOptionLabel}
      onChange={(e: any) => handleSelection(e)}
      options={values}
      value={value}
      isClearable={isClearable}
      isSearchable={isSearchable}
      placeholder={placeholder}
      isDisabled={isDisabled}
      hideSelectedOptions={hideSelectedOptions}
      isMulti={isMulti}
      className={className}
      width={width}
      multiDisplayLimit={5}
      version="v2"
    />
  )
);

export default SelectOption;
