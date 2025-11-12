const TIMEOUTS = {
  autoClose: 3000,
  showMessage: 1000,
  showError: 2500,
  debounce: 300,
  debounceConfig: 500,
};

const referenceText = {
  reference: "reference",
  references: "references",
};

const FIELDTYPES = {
  fileType: "file",
  photoType: "photo",
  modularBlocksType: "module_blocks",
  bannerImageType: "banner_image",
  blocksType: "blocks",
  groupType: "group",
  globalFieldType: "global_field",
  imageType: "image",
  bannerType: "banner",
  multiSelectType: "multiSelect",
  referenceType: "reference",
  textType: "text",
  dateTimeType: "dateTime",
  singleSelectType: "singleSelect",
  linkType: "link",
  richTextType: "rich_text",
};

const constants = {
  referenceText,
  FIELDTYPES,
  TIMEOUTS,
};

export { TIMEOUTS, FIELDTYPES };
export default constants;
