export interface TableDataItem {
  uid?: string;
  name?: string;
  display_name?: string;
  display_type?: string;
  data_type?: string;
  missingRefs?: string[] | string;
  treeStr?: string;
  fixStatus?: string;
  missingCTSelectFieldValues?: string;
  parentKey?: string;
  ct_uid?: string;
  [key: string]: any;
}
