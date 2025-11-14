import React from "react";
import { Button, cbModal } from "@contentstack/venus-components";
import ContentModelSettingsModal from "../ContentModelSettingsModal";

interface ContentTypeSettingsProps {
  state: any;
  appSDK: any;
  contentTypes: any;
  fieldTypesToExclude: any;
}

function ContentTypeSettings({ state, appSDK, contentTypes, fieldTypesToExclude }: ContentTypeSettingsProps) {
  // open modal to content type settings for exclusion/inclusion.
  const handleOpenContentModelSettings = () => {
    cbModal({
      // eslint-disable-next-line react/no-unstable-nested-components
      component: (props: any) => (
        <ContentModelSettingsModal
          contentTypes={contentTypes}
          closeModal={props.closeModal}
          state={state}
          appSDK={appSDK}
          fieldTypesToExclude={fieldTypesToExclude}
        />
      ),
      modalProps: {
        size: "customSize",
      },
    });
  };

  return (
    <div>
      <Button
        className="manage-fields-btn"
        icon="ContentModelsMediumActive"
        buttonType="secondary"
        onClick={handleOpenContentModelSettings}>
        Manage Fields
      </Button>
    </div>
  );
}

export default ContentTypeSettings;
