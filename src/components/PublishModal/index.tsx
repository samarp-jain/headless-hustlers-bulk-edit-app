import {
  Button,
  ButtonGroup,
  cbModal,
  Checkbox,
  FieldLabel,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@contentstack/venus-components";
import "./index.scss";
import React, { useState } from "react";
import localeTexts from "../../common/locales/en-us";

export const handlePublishModal = ({ envs, locales, handleUpdateAndPublish }: any) => {
  cbModal({
    component: (props: any) => (
      <PublishModal
        modalHeaderTitle={localeTexts.FullPage.PublishModal.title}
        envs={envs}
        locales={locales}
        handleUpdateAndPublish={handleUpdateAndPublish}
        {...props}
      />
    ),
    modalProps: {
      size: "large",
    },
    testId: "cs-modal-storybook",
  });
};

type Props = {
  envs: any;
  locales: any;
  modalHeaderTitle: string;
  closeModal: () => void;
  handleUpdateAndPublish: (publish: boolean, envs: any[], lang: any[]) => void;
};

export const PublishModal = (props: Props) => {
  console.info("props -----------", props);
  const [selectedLang, setSelectedLang] = useState<any[]>([]);
  const [selectedEnv, setSelectedEnv] = useState<any[]>([]);

  const handleChange = (e: any, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
    if (e?.target?.value) {
      setter((prevState: any[]) =>
        prevState.includes(e?.target?.value)
          ? prevState.filter((item) => item !== e?.target?.value)
          : [...prevState, e?.target?.value]
      );
    }
  };

  return (
    <>
      <ModalHeader
        title={localeTexts.FullPage.PublishModal.title}
        closeModal={props.closeModal}
        closeIconTestId="cs-default-header-close"
      />
      <ModalBody className="modalBodyCustomClass">
        <div className="publish-modal-section-wrapper-v2">
          {React.createElement(FieldLabel as any, {
            htmlFor: "someInput",
            requiredText: localeTexts.FullPage.PublishModal.envLabel.requiredText,
            children: [
              localeTexts.FullPage.PublishModal.envLabel.label,
              <span key="required" className="FieldLabel__required-text ml-8">
                {localeTexts.FullPage.PublishModal.envLabel.requiredText}
              </span>,
            ],
          })}
          {props?.envs?.length > 0 && (
            <div className="publish-modal-checkbox-wrapper">
              {props?.envs?.map((env: any) => {
                return (
                  <Checkbox
                    onChange={(e: any) => handleChange(e, setSelectedEnv)}
                    label={env?.name}
                    value={env?.name}
                    checked={selectedEnv?.includes(env.name) || false}
                    isLabelFullWidth={localeTexts.FullPage.PublishModal.chkbox.isLabelFullWidth}
                    checkboxDisplayType={localeTexts.FullPage.PublishModal.chkbox.checkboxDisplayType}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="publish-modal-section-wrapper-v2">
          <FieldLabel htmlFor="someInput" requiredText={localeTexts.FullPage.PublishModal.languagesLabel?.requiredText}>
            {localeTexts.FullPage.PublishModal?.languagesLabel?.label}
            <span className="FieldLabel__required-text ml-8">
              {localeTexts.FullPage.PublishModal.envLabel.requiredText}
            </span>
          </FieldLabel>
          {props?.locales?.length > 0 && (
            <div className="publish-modal-checkbox-wrapper">
              {props?.locales?.map((loc: any) => {
                return (
                  <Checkbox
                    onChange={(e: any) => handleChange(e, setSelectedLang)}
                    label={loc?.name}
                    value={loc?.code}
                    checked={selectedLang?.includes(loc?.code) || false}
                    isLabelFullWidth={localeTexts.FullPage.PublishModal?.chkbox?.isLabelFullWidth}
                    checkboxDisplayType={localeTexts.FullPage.PublishModal?.chkbox?.checkboxDisplayType}
                  />
                );
              })}
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <ButtonGroup>
          <Button buttonType="light" onClick={() => props?.closeModal()}>
            {localeTexts.FullPage.PublishModal.button.cancelButton}
          </Button>
          <Button
            onClick={() => {
              props?.handleUpdateAndPublish(true, selectedEnv, selectedLang);
              props?.closeModal();
            }}
            disabled={selectedEnv?.length === 0 || selectedLang?.length === 0}>
            {localeTexts.FullPage.PublishModal.button.sendButton}
          </Button>
        </ButtonGroup>
      </ModalFooter>
    </>
  );
};
