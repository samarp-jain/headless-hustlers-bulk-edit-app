import React from "react";
import { Button, Icon, Tooltip } from "@contentstack/venus-components";
import localeTexts from "../../common/locales/en-us";
import { IAssetModalProps } from "../../common/types";
import "./AssetModal.scss";

const AssetModal: React.FC<IAssetModalProps> = ({ selectedImage, onClose, onUpdate }) => {
  if (!selectedImage) return null;

  return (
    <div className="image-dialog-overlay" onClick={onClose}>
      <div className="image-dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="image-dialog-header">
          <div className="header-title">
            <Icon version="v2" icon="Image" size="medium" />
            <h3>{selectedImage?.title}</h3>
          </div>
          <div className="header-actions">
            <Button version="v2" buttonType="secondary" onClick={onUpdate} icon="Edit">
              {localeTexts.FullPage.assetDialog.updateButton}
            </Button>
            <Tooltip content="Close" position="top">
              <Button version="v2" buttonType="none" onlyIcon="true" onClick={onClose} icon="Cancel" />
            </Tooltip>
          </div>
        </div>
        <div className="image-dialog-body">
          <img src={selectedImage?.url} alt={selectedImage?.title} className="image-dialog-img" />
        </div>
        <div className="image-dialog-footer">
          <Icon icon="InformationSmallPurple" />
          <span>{localeTexts.FullPage.assetDialog.footerText}</span>
        </div>
      </div>
    </div>
  );
};

export default AssetModal;
