export interface TypeMiniTable {
  labelObj: any;
  mapper: any;
  keyOptions: Array<any>;
  mapperKeyOptions: Array<any>;
  mapperValueOptions: any;
  updateMappingKey: Function;
  updateMappingValue: Function;
  deleteVariationRow: Function;
  addVariationRow: Function;
  handleModalValue: Function;
}

export interface TypeModalComp {
  props: any;
  handleModalValue: Function;
  indexKey: string;
  labelObj: any;
}

export interface TypeMapperComponent {
  initialValue: any;
  labels: any;
  keyOptions: any[];
  valueOptions: any;
  getMapper: Function;
}
