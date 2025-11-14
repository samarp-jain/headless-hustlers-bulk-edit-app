import { Notification } from "@contentstack/venus-components";
import { uniq, get } from "lodash";
import { TypePopupWindowDetails } from "../../common/types";
// import localeTexts from "../../common/locale/en-us";

/* eslint-disable */

const popupWindow = (windowDetails: TypePopupWindowDetails) => {
  const left = window.screen.width / 2 - windowDetails.w / 2;
  const top = window.screen.height / 2 - windowDetails.h / 2;
  return window.open(
    windowDetails.url,
    windowDetails.title,
    "toolbar=no, location=no, directories=no, " +
      "status=no, menubar=no, scrollbars=no, resizable=no, " +
      `copyhistory=no, width=${windowDetails.w}, ` +
      `height=${windowDetails.h}, ` +
      `top=${top}, left=${left}`
  );
};

const containsValidURL = (text: string) => {
  const comprehensiveUrlRegex = /https?:\/\/(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+(:\d+)?(\/[^\s]*)?/;
  return comprehensiveUrlRegex.test(text);
};

const mergeObjects = (target: any, source: any) => {
  // Iterate through `source` properties and if an `Object` then
  // set property to merge of `target` and `source` properties
  Object.keys(source)?.forEach((key) => {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], mergeObjects(target[key], source[key]));
    }
  });

  // Join `target` and modified `source`
  Object.assign(target || {}, source);

  return target;
};

const createSchemaOptions = (schemaArr: any[]) => {
  return schemaArr?.map((item) => ({ label: item?.uid, value: item?.uid }));
};

const parseToJSONIfString = (stringObject: any) => {
  try {
    if (typeof stringObject === "string") {
      return JSON.parse(stringObject);
    }
    return stringObject;
  } catch (error) {
    return stringObject;
  }
};

const getMsgByStatus = (status: any, data: any) => {
  switch (status) {
    case 401:
      return data;
    case 503:
      return "Internal Server Error";
    case 511:
      return "Internal Server Error 511";
    default:
      return "Error";
  }
};

const showNotification = (type: any, errorMessage: any) => {
  Notification({
    displayContent: {
      error: {
        error_message: errorMessage,
      },
    },
    notifyProps: {
      hideProgressBar: true,
    },
    type: type,
  });
};

const loadTableElements = ({ items = {}, state, startIndex, stopIndex }: any) => {
  const mappedItems: any = { ...items };
  for (let i = startIndex; i <= stopIndex; i += 1) {
    mappedItems[i] = state;
  }
  return mappedItems;
};

// Helper function to convert file to base64
const convertFileToBase64 = (
  file: File
): Promise<{
  filename: string;
  content: string;
  mimeType: string;
  size: number;
}> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader?.result as string;
      const base64Data = base64?.split(",")[1];
      resolve({
        filename: file?.name,
        content: base64Data,
        mimeType: file?.type,
        size: file?.size,
      });
    };
    reader.readAsDataURL(file);
  });
};

const getRegionUrl = (regionCode: any) => {
  const correctedJsonString: any = process.env.REACT_APP_REGION_MAPPING?.replace(/'/g, '"');
  const regionMapping = JSON.parse(correctedJsonString);
  // eslint-disable-next-line
  if (regionMapping.hasOwnProperty(regionCode)) {
    return regionMapping?.[regionCode]?.UI_URL;
  }
  throw new Error("Invalid Region");
};

const notify = (type: string, text?: string, description?: string) => {
  Notification({
    notificationContent: {
      text,
      description,
    },
    type,
  });
};

const mapAndSortForSelectOption = (array: any[], labelProperty: string, valueProperty: string, schema?: any) => {
  const m = array
    ?.map((item: any) => {
      const result = {
        label: item?.[labelProperty],
        value: item?.[valueProperty],
        schema: schema ? item?.[schema] : undefined,
      };
      return result;
    })
    ?.sort((a: any, b: any) => a?.label?.localeCompare(b?.label));
  return m;
};

const handleTargetLanguages = (
  e: any,
  setPresetLanguage: any,
  setTargetLanguage: any,
  setTargetLocales: any,
  targetLanguages: any,
  targetLanguage: any
) => {
  setPresetLanguage("");
  let localesCode: any = [];
  const flag = e?.find((obj: any) => obj?.value === "$all_languages");
  const prevFlag = targetLanguage?.find((obj: any) => obj?.value === "$all_languages");
  if ((flag && (e?.length >= targetLanguages?.length || e?.length === 1)) || (flag && !prevFlag)) {
    setTargetLanguage(targetLanguages);
    localesCode = targetLanguages;
  } else if (prevFlag && !flag) {
    setTargetLanguage([]);
    localesCode = [];
  } else {
    // eslint-disable-next-line
    e = e?.filter((obj: any) => obj?.value !== "$all_languages");
    // eslint-disable-next-line
    if (e?.length === targetLanguages?.length - 1 && !flag) {
      setTargetLanguage(targetLanguages);
      localesCode = targetLanguages;
    } else {
      setTargetLanguage(e);
      localesCode = e;
    }
  }
  localesCode = localesCode?.filter((item: any) => item?.value !== "$all_languages")?.map((item: any) => item?.value);
  setTargetLocales(localesCode);
};

const getFormattedDate = (timestamp: number): string => {
  const date = new Date(timestamp);

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    timeZone: "UTC",
  };

  const formattedDate = date?.toLocaleString("en-US", options);

  return formattedDate;
};
const isValidProjectName = (projectName: any) => {
  const invalidChars = /[,\/:*?"<>|{}\t]/;
  return projectName && !invalidChars?.test(projectName);
};

const areRequiredFieldsFilled = (obj: any) => {
  if (
    obj?.serverConfiguration?.xtmBaseURL?.length &&
    obj?.serverConfiguration?.xtmTemplate?.value &&
    obj?.serverConfiguration?.userIdentifier?.length &&
    obj?.serverConfiguration?.userCompanyName?.length &&
    obj?.serverConfiguration?.xtmPassWord?.length &&
    obj?.serverConfiguration?.xtmCustomerID?.length
  ) {
    return true;
  }
  return false;
};

const findJSONRTEPaths = (obj: any, currentPath = ""): boolean => {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  for (const key in obj) {
    const newPath = currentPath ? `${currentPath}.${key}` : key;

    if (key === "type" && obj?.[key] === "doc" && "attrs" in obj) {
      return true;
    }

    const found = findJSONRTEPaths(obj?.[key], newPath);
    if (found) {
      return true;
    }
  }

  return false;
};

const getNonLocalizableFields = (schema: any, parentPath = "", level = 0, blockPath = ""): string[] =>
  schema?.reduce((list: string[], item: any) => {
    if (item?.data_type === "blocks") {
      const blocks = item?.blocks || [];
      const blockUid = item?.uid || "";
      const nestedBlockPath = parentPath + blockUid;
      const nestedList = getNonLocalizableFields(blocks, `${nestedBlockPath}.`, level, nestedBlockPath);
      return [...list, ...nestedList];
    }
    if (item?.uid) {
      const path = parentPath + item.uid;
      if (item?.non_localizable) {
        list?.push(path);
      }

      if (item?.schema?.length) {
        const nestedList = getNonLocalizableFields(item?.schema, `${path}.`, level + 1, blockPath);
        return [...list, ...nestedList];
      }
    }
    return list;
  }, []);

const getFormattedExcludedFieldTypes = (excludedFieldTypes: any) => {
  if (!excludedFieldTypes || excludedFieldTypes.length === 0) {
    return [];
  }
  if (excludedFieldTypes[0] && typeof excludedFieldTypes[0] === "object" && excludedFieldTypes[0].value) {
    return excludedFieldTypes;
  }
  return excludedFieldTypes.map((fieldType: string) => fieldType);
};

const clearAllConfigurations = (uiConfig: any, serverConfig: any, clearStateFunctions: any) => {
  const clearedUIConfig = {
    ...uiConfig,
    isToogleON: false,
    languageMapper: [],
    excludeKeys: {},
    includeKeys: {},
    excludeLocales: [],
    excludedFieldTypes: [],
    triggerEndpointUrl: "",
  };

  const clearedServerConfig = {
    ...serverConfig,
    isToogleON: false,
    languageMapper: [],
    excludeKeys: {},
    includeKeys: {},
    excludeLocales: [],
    excludedFieldTypes: [],
    triggerEndpointUrl: "",
  };

  // Clear state variables if provided
  if (clearStateFunctions) {
    clearStateFunctions.setLanguageMapperCopy([]);
    clearStateFunctions.setIncludeContentTags({});
    clearStateFunctions.setSchemaValue({});
    clearStateFunctions.setIncludeSchemaValue({});
    clearStateFunctions.setExcludeLocales([]);
    clearStateFunctions.setTriggerEndpointUrl("");
  }

  return {
    uiConfig: clearedUIConfig,
    serverConfig: clearedServerConfig,
  };
};

function findPathsToKey(options: any) {
  let results = [];
  (function findKey({ key, obj, pathToKey }) {
    const oldPath = `${pathToKey ? pathToKey + "." : ""}`;
    if (obj?.hasOwnProperty(key)) {
      results.push(`${oldPath}${key}`);
      return;
    }
    if (obj !== null && typeof obj === "object" && !Array.isArray(obj)) {
      for (const k in obj) {
        if (obj.hasOwnProperty(k)) {
          if (Array.isArray(obj[k])) {
            const objLength = obj[k].length;
            for (let j = 0; j < objLength; j++) {
              findKey({
                obj: obj[k][j],
                key,
                pathToKey: `${oldPath}${k}[${j}]`,
              });
            }
          }
          if (obj[k] !== null && typeof obj[k] === "object") {
            findKey({
              obj: obj[k],
              key,
              pathToKey: `${oldPath}${k}`,
            });
          }
        }
      }
    }
  })(options);
  const modified_path: Array<string> = [];
  results?.forEach((reach_key: any) => {
    const arr = reach_key?.split(".");
    arr?.splice(-1, 1);
    arr?.forEach((ar: string, index: any) => {
      if (ar?.includes("[")) {
        arr[index] = ar?.split("[")?.[0];
      }
    });
    modified_path.push(arr?.join("."));
  });
  let modified_path_ref = "";
  uniq(modified_path)?.forEach((pathToKey) => {
    modified_path_ref = modified_path_ref + `&include[]=${pathToKey}`;
  });

  return [modified_path, results];
}

const getEntriesRefereces = (entry: any, path: Array<string>) => {
  // Remove _content_type_uid suffix from paths
  const modifiedPaths = path?.map((pathStr: string) => {
    return pathStr?.endsWith("_content_type_uid") ? pathStr?.replace("._content_type_uid", "") : pathStr;
  });

  // Extract data using _.get for each path and return array of objects with title and uid
  const entriesData = modifiedPaths?.map((pathStr: string) => {
    const data = get(entry, pathStr);
    return {
      title: data?.title || "",
      entry_uid: data?.uid || "",
      content_type_uid: data?._content_type_uid,
      source_locale: data?.locale,
      version: data?._version,
    };
  });

  return entriesData;
};

const excludedKeys = [
  "ACL",
  "created_at",
  "updated_at",
  "_metadata",
  "uid",
  "created_by",
  "updated_by",
  "locale",
  "_version",
  "_in_progress",
  "_workflow",
  "publish_details",
  "_content_type_uid",
  "_embedded_items",
];

const findFirstTextNode = (node: any) => {
  if (node?.text) {
    return node.text;
  }

  if (Array.isArray(node?.children)) {
    // eslint-disable-next-line
    let firstTextNode: any = undefined;
    node?.children?.forEach((childNode: any) => {
      if (!firstTextNode) {
        firstTextNode = findFirstTextNode(childNode);
      }
    });
    return firstTextNode;
  }

  return undefined;
};

const flattenObject = (obj: any, entry: any, prefix = "", result: any = []) => {
  if (!obj || typeof obj !== "object") return result;
  Object?.keys(obj).forEach((key: any) => {
    if (!(key in obj)) return;

    const propName = prefix ? `${prefix}.${key}` : key;

    if (excludedKeys?.includes(key)) return;

    const value = obj?.[key];

    if (Array.isArray(value)) {
      if (value?.every((item) => typeof item === "string")) {
        result.push({
          key: propName,
          status: "active",
          value: JSON.stringify(value),
        });
      } else {
        value?.forEach((item: any, index: any) => {
          flattenObject(item, entry, `${propName}[${index}]`, result);
        });
      }
    } else if (typeof value === "object" && value !== null) {
      if ("type" in value && "children" in value && "attrs" in value) {
        // Skip RTE fields completely - exclude from translation to avoid tag processing
        return;
      } else if ("content_type" in value && "is_dir" in value) {
        result.push({ key: propName, status: "active" });
      } else {
        flattenObject(value, entry, propName, result);
      }
    } else {
      const entryValue = get(entry, propName);
      result.push({
        key: propName,
        status: "active",
        value: typeof entryValue === "string" ? entryValue : JSON.stringify(entryValue),
      });
    }
  });
  return result;
};

const findDataByKey = (data: any, keysToFind: any) => {
  const keyToSearch = keysToFind?.[0];
  // eslint-disable-next-line
  for (const item of data) {
    if (item?.uid === keyToSearch) {
      if (keysToFind?.length === 1) {
        return item;
      }
      if (item?.blocks) {
        // eslint-disable-next-line
        for (const block of item?.blocks) {
          const nestedResult: any = findDataByKey([block], keysToFind?.slice(1));
          if (nestedResult) {
            return nestedResult;
          }
        }
      }
      if (item?.schema) {
        const nestedResult: any = findDataByKey(item?.schema, keysToFind?.slice(1));
        if (nestedResult) {
          return nestedResult;
        }
      }
    }
  }
  return undefined;
};

const removeObjAndFlatten = (schema: any, obj: any, disabledUIDS: any) => {
  try {
    let data = flattenObject(obj, obj);
    const disabledUIDSCopy = disabledUIDS?.filter((key: any) => key !== undefined && key !== null);
    if (!data?.length) return false;
    const disabledValues = disabledUIDSCopy?.map((item: any) => item?.value ?? item);

    data?.forEach((key: any) => {
      const keyCopy = key;
      const modifiedKey = keyCopy?.key;
      if (!modifiedKey) return;
      const result = findDataByKey(schema, modifiedKey?.split("."));
      const isDisabledByKey = disabledUIDSCopy?.some((disabledKey: any) => {
        const disabledKeyC = disabledKey?.value ?? disabledKey;
        if (!disabledKeyC) return false;

        return (
          modifiedKey === disabledKeyC ||
          modifiedKey?.startsWith(`${disabledKeyC}.`) ||
          modifiedKey?.startsWith(`${disabledKeyC}[`) ||
          (disabledKeyC?.includes("[]") && modifiedKey?.replace(/\[\d+\]/g, "[]") === disabledKeyC)
        );
      });

      const isRadioVariant = result?.display_type === "radio";
      const isDropdownVariant = result?.display_type === "dropdown" || !result?.display_type;

      const isSelectFieldDisabled =
        result?.display_type === "radio" ||
        (result?.display_type === "dropdown" &&
          (disabledValues?.includes("select") ||
            (isRadioVariant && disabledValues?.includes("radio")) ||
            (isDropdownVariant && disabledValues?.includes("dropdown"))));

      if (isDisabledByKey || isSelectFieldDisabled) {
        keyCopy.status = "inactive";
      } else {
        keyCopy.parentPath = result?.$parentPath;
        keyCopy.data_type = result?.data_type;
        keyCopy.display_type = result?.display_type;
      }
    });
    data = data?.filter((field: any) => field.key !== "tags" && field.key !== "_rules");
    return data;
  } catch (e) {
    console.error("Error inside removeObjAndFlatten", e);
    throw e;
  }
};

const fieldTypeMapping: { [key: string]: string[] } = {
  date: ["date", "isodate"],
  select: ["select", "radio"],
  number: ["number"],
  url: ["url"],
  link: ["link"],
  taxonomies: ["taxonomies", "taxonomy"],
  text: ["text", "single_line"],
  reference: ["reference"],
  file: ["file", "image"],
  json: ["json"],
  boolean: ["boolean"],
  global_field: ["global_field"],
  group: ["group"],
  blocks: ["blocks", "modular_blocks"],
};

const traverseSchema = (schema: any, currentSettings: any, parentPath = "", level = 0, blockPath = "") =>
  schema?.reduce((list: any, item: any) => {
    if (item?.uid) {
      const path = parentPath + item.uid;
      const listItem = {
        uid: path,
        display_name: item?.display_name,
        display_type: item?.display_type || "",
        data_type: item?.data_type || "blocks",
        non_localizable: item?.non_localizable || false,
        mandatory: item?.mandatory || false,
        multiple: item?.multiple || false,
        isFieldActive: true,
      };
      if (currentSettings?.disabledUidFields?.includes(path)) {
        listItem.isFieldActive = false;
      }
      list?.push(listItem);

      if (item?.schema?.length > 0) {
        const nestedList = traverseSchema(item?.schema, currentSettings, `${path}.`, level + 1, blockPath);
        return [...list, ...nestedList];
      }
    }

    if (item?.data_type === "blocks") {
      const blocks = item?.blocks || [];
      const blockUid = item?.uid || "";
      const nestedBlockPath = parentPath + blockUid;
      const nestedList = traverseSchema(blocks, currentSettings, `${nestedBlockPath}.`, level, nestedBlockPath);
      return [...list, ...nestedList];
    }
    return list;
  }, []);

const utils = {
  popupWindow,
  mergeObjects,
  createSchemaOptions,
  parseToJSONIfString,
  getMsgByStatus,
  showNotification,
  loadTableElements,
  getRegionUrl,
  notify,
  mapAndSortForSelectOption,
  handleTargetLanguages,
  getFormattedDate,
  isValidProjectName,
  areRequiredFieldsFilled,
  containsValidURL,
  findJSONRTEPaths,
  getNonLocalizableFields,
  convertFileToBase64,
  getFormattedExcludedFieldTypes,
  clearAllConfigurations,
  findPathsToKey,
  getEntriesRefereces,
  removeObjAndFlatten,
  fieldTypeMapping,
  traverseSchema,
};

export default utils;
