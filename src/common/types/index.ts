export interface KeyValueObj {
  [key: string]: string;
}

export interface TypeSelectOption {
  label: string;
  value: string;
}

export interface TypePopupWindowDetails {
  url: string;
  title: string;
  w: number;
  h: number;
}

export type Props = {
  [key: string]: any;
};

export interface TypeAppSdkConfigState {
  configuration: Props;
  serverConfiguration: Props;
}

export interface TypeSDKData {
  config: any;
  contentTypeConfig?: any;
  location: any;
  appSdkInitialized: boolean;
}

export interface TypeAsset {
  id: string;
  type: string;
  name: string;
  width: string;
  height: string;
  size: string;
  thumbnailUrl: string;
  previewUrl?: string; // if you don't want "preview" platform option don't provide this parameter
  platformUrl?: string; // if you don't want "open in DAM" platform option don't provide this parameter
}

export interface TypeCardContainer {
  sensors: any;
  onDragEnd: (event: any) => void;
  onDragCancel: () => void;
  onDragStart: ({ active }: any) => void;
  activeId: string | null;
}

export interface TypeSelectorContainer {
  containerRef: any;
  containerClass: string;
  containerId: string;
}

export interface TypeAssetCard {
  id: string;
}

export interface TypeAssetList {
  id: string;
}

export interface TypeOption {
  label: string;
  value: string;
}

export interface TypeConfigComponent {
  objKey: string;
  objValue: any;
  updateConfig?: Function;
}

export interface TypeRadioOption {
  fieldName: string;
  mode: TypeOption;
  index: number;
  radioOption: TypeOption;
  updateRadioOptions: Function;
}

export type TypeWarningtext = {
  error: boolean;
  data: any;
};

export interface TypeRootDamEnv {
  IS_DAM_SCRIPT?: boolean;
  DAM_APP_NAME: string;
  CONFIG_FIELDS: string[];
  ASSET_UNIQUE_ID: string;
  DAM_SCRIPT_URL?: string;
  SELECTOR_PAGE_LOGO?: any;
  DIRECT_SELECTOR_PAGE: string;
}

export interface TypeRootConfigSreen {
  configureConfigScreen?: Function;
  customConfigComponent?: Function;
  customWholeJson?: Function;
}

export interface TypeRootCustomField {
  filterAssetData?: Function;
  getSelectorWindowUrl?: Function;
  handleConfigtoSelectorPage?: Function;
  handleSelectorPageData?: Function;
  handleSelectorWindow?: Function;
}

export interface TypeRootSelector {
  openComptactView?: Function;
  customSelectorComponent?: Function;
}

export interface TypeRootConfig {
  configureConfigScreen?: Function;
  customConfigComponent?: Function;
  customWholeJson?: Function;
}

export interface TypeCustomConfigUpdateParams {
  fieldName: string;
  fieldValue: string;
  saveConfig: boolean;
  saveServerConfig: boolean;
}

export interface TypeErrorFn {
  isErr: boolean;
  errorText: string;
}

export interface TypeRootConfigSreen {
  configureConfigScreen?: Function;
  checkConfigValidity?: Function;
  customWholeJson?: Function;
}

export interface IMapperModalProps {
  handleMapperConfig: (contentType: string, includeAllFields?: boolean) => void;
  contentTypeOptions: TypeSelectOption[];
  closeModal: () => void;
}

export interface IMapperConfigState {
  contentType: string;
  fields: string[];
}

export interface IDeleteModalProps {
  onConfirm: () => void;
  closeModal: () => void;
  title?: string;
  message?: string;
  itemToDelete?: string;
}

export interface IFieldModalProps {
  setReferenceData: React.Dispatch<React.SetStateAction<any>>;
  entryContentTypeUid: string;
  contentTypeUid: string;
  referenceFieldPath: string;
  fieldType: string;
  selectedField: {
    field: string;
    value: any;
    rowId: number;
    path?: string;
    type?: string;
    referenceTitle?: string;
    referenceData?: any;
  } | null;
  isEditing: boolean;
  editedValue: {
    key: string;
    value: any;
    path?: string;
    index?: number;
  } | null;
  onClose: () => void;
  onEdit: (key: string, value: any, path?: string, index?: number) => void;
  onSave: (path?: string) => void;
  onCancelEdit: () => void;
  onViewEntry?: (uid: string, contentTypeUid: string) => void;
  parentReferenceData?: any;
  locales?: { label: string; value: string }[];
  setAllLocalesData?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export interface IReferenceItem {
  title: string;
  uid?: string;
  contentTypeUid?: string;
  data?: any;
}

export interface IReferenceProps {
  uid: string;
  _content_type_uid: string;
}

export interface IFieldSelectorProps {
  contentType: string;
  selectedFields: string[];
  availableFields: TypeSelectOption[];
  onFieldsChange: (fields: string[]) => void;
}

export interface IMapperConfig {
  [key: string]: string[];
}

export interface IAssetModalProps {
  selectedImage: {
    url: string;
    title: string;
  } | null;
  onClose: () => void;
  onUpdate: () => void;
}

export interface IAssetCellProps {
  imageUrl: string;
  fieldName: string;
  onView: () => void;
}

export interface ContentModelSetting {
  contentType: string;
  selectedFieldsUID: string[];
  isEnabled?: boolean;
  extraFields?: string[];
}

export interface ManageFieldSetting {
  contentType: string;
  selectedFieldsUID: string[];
  isEnabled?: boolean;
  extraFields?: string[];
}

export interface TypePopupWindowDetails {
  url: string;
  title: string;
  w: number;
  h: number;
}
