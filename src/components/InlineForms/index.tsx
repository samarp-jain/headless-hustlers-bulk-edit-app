import React, { Fragment, useState } from "react";
import "./InlineForms.scss";
import { Icon, TextInput } from "@contentstack/venus-components";

// Copied venus components code thats why added eslint-disable
/* eslint-disable */

interface InlineFormsProps {
  onCancel: (arg?: any) => void;
  onSave: (arg?: any) => void;
  fieldArray: Array<React.ReactNode>;
  disableSave: boolean;
  defaultOpen: boolean;
  fieldName?: string;
  onFieldNameChange?: (value: string) => void;
}

function InlineForms(props: InlineFormsProps): JSX.Element {
  const {
    onCancel,
    onSave,
    fieldArray,
    disableSave = false,
    defaultOpen = true,
    fieldName = "",
    onFieldNameChange,
  } = props;
  const [isOpen, setOpen] = useState(defaultOpen);

  const cancelClicked = (e: any) => {
    if (onCancel) {
      onCancel(e);
    }

    setOpen(false);
  };

  const saveClicked = (e: any) => {
    if (onSave) {
      onSave(e);
    }

    setOpen(false);
  };

  return (
    <div className="InlineForms">
      {!isOpen ? (
        <Fragment>
          <div
            className="InlineForms__plus-icon flex-v-center flex-h-center"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
            }}
          >
            <Icon testId="cs-inline-form-add-icon" icon="AddCircle" />
          </div>
          <div
            onClick={(e: any) => {
              e.stopPropagation();
              setOpen(true);
            }}
            className="InlineForms__add-text"
            data-test-id="cs-inline-forms-label"
          >
            Add Item
          </div>
        </Fragment>
      ) : (
        <Fragment>
          <div className="InlineForms__plus-icon flex-v-center flex-h-center">
            <Icon testId="cs-inline-form-add-icon" icon="AddCircle" />
          </div>
          <div className="InlineForms__input-container">
            <TextInput
              placeholder="Enter Name"
              value={fieldName}
              onChange={(e: any) =>
                onFieldNameChange && onFieldNameChange(e.target.value)
              }
              className="InlineForms__name-input"
            />
          </div>
          <div className="InlineForms__icon-container">
            <div
              className="InlineForms__cancel-icon"
              onClick={cancelClicked}
              data-test-id="cs-inline-forms-add-cancel"
            >
              <Icon icon="CancelCircle" />
            </div>
            <div
              className={`InlineForms__save-icon ${
                disableSave ? "InlineForms--disable" : ""
              }`}
              data-test-id="cs-inline-forms-add"
              onClick={disableSave ? () => {} : saveClicked}
            >
              <Icon icon="CheckedCircle" disabled={disableSave} />
            </div>
          </div>
        </Fragment>
      )}
    </div>
  );
}

export default InlineForms;
