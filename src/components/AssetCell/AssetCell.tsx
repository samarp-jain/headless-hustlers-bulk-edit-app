import React from "react";
import { Icon } from "@contentstack/venus-components";
import "./AssetCell.scss";
import localeTexts from "../../common/locales/en-us";
import { IAssetCellProps } from "../../common/types";

const AssetCell: React.FC<IAssetCellProps> = ({ imageUrl, fieldName, onView }) => {
  return (
    <div className="image-cell" onClick={onView}>
      {imageUrl ? (
        <>
          <div className="image-preview">
            <img src={imageUrl} alt={fieldName} />
          </div>
          <div className="image-overlay">
            <div className="expand-icon">
              <Icon icon="Expand" />
            </div>
          </div>
        </>
      ) : (
        <div className="no-image">
          <Icon icon="Image" />
          <span>{localeTexts.FullPage.assetCell.noImage}</span>
        </div>
      )}
    </div>
  );
};

export default AssetCell;
