import React, { ChangeEvent, useState } from "react";
import {
  cbModal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
  Button,
  ButtonGroup,
  Icon,
} from "@contentstack/venus-components";
import { TypeModalComp } from "../types";
import { get, isEmpty } from "lodash";
import localeTexts from "../../../../common/locales/en-us";

export const ModalComponent = function ({ props, handleModalValue, indexKey, labelObj }: TypeModalComp) {
  const [modalValue, setModalValue] = useState("");

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    await setModalValue(e?.target?.value);
  };

  const handleCreate = () => {
    handleModalValue(modalValue, indexKey, "create");
    props.closeModal();
  };

  const handleCreateApply = () => {
    handleModalValue(modalValue, indexKey, "createApply");
    props.closeModal();
  };

  return (
    <>
      <ModalHeader title={labelObj.modalTitleText} closeModal={props.closeModal} />

      <ModalBody className="modalBodyCustomClass">
        <div className="field-label-container">
          <label htmlFor="label" className="required">
            {labelObj.modalLabelText}
          </label>
        </div>
        <TextInput
          required
          autoFocus
          value={modalValue}
          placeholder={labelObj.modalPlaceholderText}
          name="label"
          autoComplete="off"
          onChange={handleChange}
        />
        <div className="instruction-text">
          {labelObj.modalInstructionText}
          <br />
          {labelObj.modalNoteText}
        </div>
      </ModalBody>

      <ModalFooter>
        <ButtonGroup>
          <Button buttonType="light" onClick={() => props.closeModal()}>
            {localeTexts.ConfigScreen.mapper.modal_cancel_btn_text}
          </Button>
          <Button onClick={handleCreate} buttonType="secondary">
            <Icon icon="CheckedPurple" />
            {localeTexts.ConfigScreen.mapper.modal_create_btn_text}
          </Button>
          <Button onClick={handleCreateApply}>
            <Icon icon="CheckedWhite" />
            {localeTexts.ConfigScreen.mapper.modal_create_apply_btn_text}
          </Button>
        </ButtonGroup>
      </ModalFooter>
    </>
  );
};

const addNewLabel = (key: string, handleModalValue: React.FC, labelObj: any) => {
  cbModal({
    // eslint-disable-next-line
    component: (props: any) => (
      <ModalComponent props={props} handleModalValue={handleModalValue} indexKey={key} labelObj={labelObj} />
    ),
    testId: "cs-modal",
  });
};

const utils = {
  addNewLabel,
};

export default utils;
