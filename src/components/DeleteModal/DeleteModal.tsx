import React, { useState, useCallback } from "react";
import {
  Button,
  ButtonGroup,
  TextInput,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Notification,
} from "@contentstack/venus-components";
import parse from "html-react-parser";
import localeTexts from "../../common/locales/en-us";
import { TIMEOUTS, FIELDTYPES } from "../../common/constants";
import { IDeleteModalProps } from "../../common/types";
import "./DeleteModal.scss";

const DeleteModal: React.FC<IDeleteModalProps> = ({
  onConfirm,
  closeModal,
  title = localeTexts.DeleteModal.title,
  message = localeTexts.DeleteModal.message,
  itemToDelete = "",
}) => {
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [deleteBtnDisabled, setDeleteBtnDisabled] = useState(true);

  const handleDeleteInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e?.target?.value;
    if (inputValue === itemToDelete) {
      setDeleteConfirmationText(inputValue);
      setDeleteBtnDisabled(false);
    } else {
      setDeleteConfirmationText(inputValue);
      setDeleteBtnDisabled(true);
    }
  };

  const handleConfirmDelete = useCallback(() => {
    closeModal();
    Notification({
      notificationContent: {
        text: `'${itemToDelete}' '${localeTexts.DeleteModal.successMessage}'`,
      },
      notificationProps: {
        autoClose: TIMEOUTS.autoClose,
      },
      type: localeTexts.DeleteModal.success.type,
    });
    onConfirm();
  }, [closeModal, onConfirm, itemToDelete]);

  return (
    <>
      <ModalHeader title={title} closeModal={closeModal} />
      <ModalBody className="delete-dialog-content">
        <p className="delete-dialog-message">
          {parse(localeTexts.DeleteModal.dialogMessage?.replace(/\$/g, itemToDelete) ?? "")}
        </p>

        <TextInput
          type={FIELDTYPES.textType}
          value={deleteConfirmationText}
          onChange={handleDeleteInput}
          placeholder={parse(localeTexts.DeleteModal.modalPlaceholder?.replace(/\$/g, itemToDelete) ?? "")}
          version="v2"
          className="delete-input-textbox"
          required
          maxLength={50}
        />
      </ModalBody>
      <ModalFooter>
        <ButtonGroup>
          <Button
            version="v2"
            buttonType="delete"
            onClick={handleConfirmDelete}
            disabled={deleteBtnDisabled}
            size="small"
            icon="v2-Delete"
            iconProps={{
              size: "mini",
              className: "remove-modal-icon",
            }}>
            {localeTexts.DeleteModal.confirmButton}
          </Button>
          <Button version="v2" buttonType="light" onClick={closeModal} size="small">
            {localeTexts.DeleteModal.cancelButton}
          </Button>
        </ButtonGroup>
      </ModalFooter>
    </>
  );
};

export default DeleteModal;
