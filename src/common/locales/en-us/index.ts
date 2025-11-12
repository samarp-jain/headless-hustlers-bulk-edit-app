import { update } from "lodash";

const localeTexts = {
  404: {
    title: "404: Not Found",
    body: "The link you tried to access doesn't seem to exist. <br />Please verify and enter the correct URL.",
    button: {
      text: "Learn More",
      url: "https://www.contentstack.com/docs/developers/developer-hub/about-ui-locations/",
    },
  },

  ConfigScreen: {
    headerTitle: "Configuration",
    button: {
      configBtn: {
        tooltip: "All environments configured",
        label: "Add Configuration",
      },
    },

    LoadingState: {
      title: "Loading Configuration ...",
      body: "Please wait while we load the configuration for you.",
    },

    FieldSelector: {
      label: "Select Fields",
      placeholder: "Select fields",
    },

    MapperModal: {
      title: "Add New Content Type Mapping",
      label: "Select Content Type",
      placeholder: "Select a content type",
      addFieldLabel: "Add Field",
      btnText: "Add",
      button: {
        cancelButton: "Cancel",
        addButton: "Add",
      },
      mapperFieldMsg: "Include all fields",
      modalTitle: "Add Mapping Field Option",
      modalLabel: "ContentType field path",
      modalPlaceholder: "Enter contentType field path (Lowercase)",
      modalInstruction: 'Use the dot format to enter nested objects, for eg: "file.url".',
      modalNote: "Note: Label already created/added in the dropdown will not be created.",
    },

    Accordion: {
      title: "Content Type Mapping",
      button: {
        addText: "Content Type ",
      },
    },

    modal: {
      remove: {
        header: "Remove Environment Configuration",
        body: `Are you sure to remove the environment configuration? Once the configuration is removed,
  it cannot be undone.`,
        btnCancel: "Cancel",
        btnRemove: "Remove",
      },
      alert: {
        title: "Alert: Update Latest Settings",
        textS: "You must click the",
        textE: "button to update the latest settings, even if you do not have any changes to the configurations.",
        btnText: "OK",
      },
    },
    mapper: {
      title: "Content Type Mapping",
      title_contenttype: "Content Type",
      title_mapping: "Mapping Fields",
      placeholder_contenttype: "Select Content Type",
      placeholder_mapper: "Select Mapping Items",
      add_field_label: "Add Field",
      btn_text: "Add ContentType",
      modal_title: "Add Mapping Field Option",
      modal_label: "ContentType field path",
      modal_placeholder: "Enter contentType field path (Lowercase)",
      modal_instruction: 'Use the dot format to enter nested objects, for eg: "file.url".',
      modal_note: "Note: Label already created/added in the dropdown will not be created.",
      webhook_label: "Additional Settings",
      webhook_info: "Atleast one configuration is required for enabling additional settings",
      checkbox_label: "Select for all Content Types",
      include_assets: "Select for Asset(s)",
      fieldSelector: "fields selected",
      selectFieldText: "Please select fields for each content type",
      configureFieldText: "Please configure at least one content type mapping",
      modal_cancel_btn_text: "Cancel",
      modal_create_btn_text: "Create",
      modal_create_apply_btn_text: "Create & Apply",
      mapperMsgS: "The option",
      mapperMsgE: "already exists",
      mapperLowerMsg: "should be in lowercase",
      mapperFieldMsg: "Include all fields",
    },
  },
  Warning: {
    cookiesBlocked: "Third-party cookies are blocked. To use this app, please disable this setting in your browser.",
  },
  DeleteModal: {
    title: "Delete Confirmation",
    successMessage: "mapping deleted successfully",
    message: "Type the content type name to confirm deletion",
    dialogMessage:
      " Are you sure you want to delete this <b>&apos;$&apos;</b> mapping? If yes, type the name of the configuration and press Delete.",
    modalPlaceholder: "Type &apos;$&apos; here",
    error: {
      type: "error",
      message: "Failed to delete mapping",
    },
    success: {
      type: "success",
      message: "Mapping deleted successfully",
    },
    cancelButton: "Cancel",
    confirmButton: "Delete",
  },
  FullPage: {
    title: "Bulk Edit",
    body: "This is the location that contains your Full Page App.",
    defaultTableAttributes: {
      defaultHeader: "Select Content Type",
      defaultEnvironment: "Select Environment",
      defaultField: "Select Field",
      defaultFieldPlaceholder: "Select a field to map",
    },
    button: {
      text: "Learn More",
      url: "https://www.contentstack.com/docs/developers/developer-hub/full-page-location/",
    },
    constants: {
      Notification: {
        success: "success",
        error: "error",
        warning: "warning",
        autoClose: 3000,
      },
      view: {
        label: "View",
        icon: "v2-View",
      },
      refresh: {
        label: "Refresh",
        icon: "v2-Refresh",
      },
      update: {
        label: "Update",
        icon: "v2-Update",
      },
      unpublish: {
        label: "Unpublish",
        icon: "v2-Unpublish",
      },
      updateAndPublish: {
        label: "Update & Publish",
        icon: "v2-PublishIcon",
      },
      text: "text",
      loaded: "loaded",
      referenceText: {
        reference: "reference",
        references: "references",
        referenceditem: "Referenced item",
        referenceditems: "Referenced items",
        referenceField: "Reference Field",
        referenceFields: "Reference Fields",
        Reference: "Reference",
        References: "References",
      },
      item: "item",
      items: "items",
      field: "field",
      fields: "fields",
      groupText: {
        group: "group",
        groups: "groups",
        Group: "Group",
        Groups: "Groups",
      },
      number: "number",
      object: "object",
      fieldText: {
        field: "field",
        fields: "fields",
        Field: "Field",
        Fields: "Fields",
      },
      blockText: {
        modularBlocks: "modular blocks",
        modularBlock: "modular block",
        modularBlockText: "Modular Block",
        modularBlocksText: "Modular Blocks",
        block: "block",
        blocks: "blocks",
        Block: "Block",
        Blocks: "Blocks",
      },
      fileText: {
        file: "file",
        files: "files",
        File: "File",
        Files: "Files",
      },
    },

    EditableCell: {
      cancelButton: "Cancel",
      saveButton: "Save",
      updateButton: "Update",
      editButton: "Edit",
      deleteButton: "Delete",
      viewButton: "View",
      unpublishButton: "Unpublish",
      publishButton: "Publish",
      updateAndPublishButton: "Update & Publish",
      noValueText: "No Value",
      doubleClickToEdit: "Double click to edit",
      noData: "No Data",
      noDataAvailable: "No Data Available",
      noDataAvailableForField: "No Data Available for this field",
      master: "Master",
      noDataAvailableForLocale: "No Data Available for this locale",
    },

    SelectTag: {
      placeHolder: "Select ContentType",
      noData: "No Data Available",
      loading: "Fetching Content Types from Config...",
      button: {
        label: "Reset",
        icon: "v2-Refresh",
      },
    },

    PublishModal: {
      title: "Publish Modal",
      envLabel: {
        label: "Select Environment(s)",
        requiredText: "(required)",
      },
      chkbox: {
        checkboxDisplayType: "inline-block",
        isLabelFullWidth: false,
      },
      languagesLabel: {
        label: "Select Languages(s)",
        requiredText: "(required)",
      },
      button: {
        cancelButton: "Cancel",
        sendButton: "Send",
      },
    },

    FieldDialog: {
      title: "Field Details:",
      body: "Click the edit button to modify values.",
      referencedBody: "This is a reference field. Click view to see the full entry.",
      button: {
        saveButton: "Save",
        cancelButton: "Cancel",
        updateButton: "Update",
        closeButton: "Close",
      },
      noReference: "No reference items found in the data",
      valueEmpty: "Value cannot be empty",
    },
    table: {
      searchPlaceholder: "Search across all fields...",
      EmptyState: {
        noSearchResults: {
          heading: "No Matching Results Found",
          description: "Try changing your search query to find what you're looking for",
          moduleIcon: "NoSearchResult",
        },
        noEntriesFound: {
          heading: "No Entries Found",
          description: "There are no entries in this content type.",
          moduleIcon: "NoEntriesFound",
        },
        noContentTypeSelected: {
          heading: "No Content Type Selected",
          description: "Please select a content type from the dropdown above",
          moduleIcon: "NoDataEmptyState",
        },
      },
      actions: {
        selected: {
          label: "Show Selected",
          showAll: "Show All",
          icon: "v2-Eye",
          iconAll: "v2-EyeOff",
        },
        update: {
          label: "Update",
          icon: "v2-Update",
        },
        updateAndPublish: {
          label: "Update & Publish",
          icon: "v2-PublishIcon",
        },
        unpublish: {
          label: "Unpublish",
          icon: "Unpublish",
        },
        delete: {
          label: "Delete",
          icon: "Delete",
          type: "bulk-delete",
        },
        view: {
          publishQueue: "View In Publish Queue",
          entry: "View Entry",
          trash: "View in Trash",
          backToEntries: "Back to All Entries",
        },
      },

      columns: {
        header: "Title",
        contentType: "Content Type",
        accessor: "title",
        environment: "Environment",
        status: "Status",
        actions: "Actions",
      },
    },

    RefreshModal: {
      refreshText: "You have unsaved changes. Are you sure you want to refresh? Your changes will be lost.",
      button: {
        refresh: "Continue Refresh",
        cancel: "Cancel",
      },
    },

    Notification: {
      success: "success",
      error: "error",
      updateSuccess: "Entries have been updated successfully.",
      updateFailure: "Failed to update entries. Please try again.",
      refreshSuccess: { message: "Entry has been refreshed successfully.", type: "success" },
      refreshFailure: { message: "Failed to refresh entry. Please try again.", type: "error" },
      publishSuccess: {
        error: "error",
        type: "success",
        message: "Entries have been published successfully.",
      },
      publishFailure: {
        type: "error",
      },
      publishError: "Failed to publish entries. Please try again.",
    },
    ReferenceText: {
      reference: "Reference",
      references: "References",
    },
    assetDialog: {
      updateButton: "Update Asset",
      closeButton: "Close",
      footerText: "Click 'Update Asset' to change this Asset",
    },
    assetCell: {
      noImage: "No Asset",
    },
  },
  FieldModifier: {
    title: "Field Modifier App",
    body: "This is the location that contains your Field Modifier app.",
    button: {
      text: "Learn More",

      url: "https://www.contentstack.com/docs/developers/developer-hub/field-modifier-location/",
    },
  },

  AppFailed: {
    Message1: "The App was loaded outside Contentstack Dashboard.",
    Message2: "Please navigate to Your Stack in Contentstack where you just installed the Application ",
    body: "For Assistance, please reach out to us at support@contentstack.com",
    button: {
      text: "Learn More",
      url: "https://www.contentstack.com/docs/developers/developer-hub/marketplace-app-boilerplate/",
    },
  },
  operation: {
    update: {
      success: {
        status: 200,
        notice: "The requested Action has been performed.",
      },
      failed: {
        status: 400,
        notice: "Failed to update entries",
      },
    },
  },
  Icons: {
    edit: "v2-Edit",
    view: "v2-Eye",
    delete: "Delete",
    unpublish: "v2-Unpublish",
    publish: "v2-PublishIcon",
    update: "v2-Update",
    close: "v2-CloseNoborder",
    eye: "v2-Eye",
    eyeOff: "v2-EyeOff",
    link: "Link",
    save: "v2-Save",
    cancel: "v2-Cancel",
  },
};

export default localeTexts;
