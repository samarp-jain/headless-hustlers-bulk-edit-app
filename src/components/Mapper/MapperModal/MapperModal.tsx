import React, { useState } from "react";
import {
  ModalHeader,
  Field,
  FieldLabel,
  ModalFooter,
  ButtonGroup,
  Button,
  Select,
  Icon,
} from "@contentstack/venus-components";
import { IMapperModalProps, TypeSelectOption } from "../../../common/types";
import localeTexts from "../../../common/locales/en-us";
import "./MapperModal.scss";

const MapperModal: React.FC<IMapperModalProps> = function ({ handleMapperConfig, contentTypeOptions, closeModal }) {
  const [selectedContentType, setSelectedContentType] = useState<string>("");

  const onContentTypeChange = (option: TypeSelectOption) => {
    setSelectedContentType(option.value);
  };

  const onSaveConfiguration = () => {
    handleMapperConfig(selectedContentType);
    closeModal();
  };

  return (
    <div className="mapper-modal-overlay">
      <div className="mapper-modal">
        <div className="mapper-modal-content">
          <div className="mapper-modal-header">
            <h2>{localeTexts.ConfigScreen.MapperModal.title}</h2>
            <Button className="close-button" onClick={closeModal} buttonType="light" version="v2">
              <Icon version="v2" icon="CloseNoborder" size="small" />
            </Button>
          </div>
          <div className="mapper-modal-body">
            <div className="field-group">
              <FieldLabel required htmlFor="contenttypelabel" className="field-label" version="v2">
                {localeTexts.ConfigScreen.MapperModal.label}
              </FieldLabel>
              <Select
                version="v2"
                options={contentTypeOptions}
                onChange={onContentTypeChange}
                placeholder={localeTexts.ConfigScreen.MapperModal.placeholder}
                value={contentTypeOptions?.find((opt) => opt.value === selectedContentType)}
                className="content-type-select"
                isSearchable
              />
            </div>
          </div>
          <div className="mapper-modal-footer">
            <ButtonGroup>
              <Button buttonType="light" onClick={closeModal} className="cancel-button" version="v2">
                {localeTexts.ConfigScreen.MapperModal.button.cancelButton}
              </Button>
              <Button
                onClick={onSaveConfiguration}
                buttonType="primary"
                disabled={!selectedContentType}
                className="add-button"
                version="v2">
                {localeTexts.ConfigScreen.MapperModal.button.addButton}
              </Button>
            </ButtonGroup>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapperModal;
