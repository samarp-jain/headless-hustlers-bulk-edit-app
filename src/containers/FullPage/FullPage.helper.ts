import { FIELDTYPES } from "../../common/constants";
import localeTexts from "../../common/locales/en-us";

const IMAGETYPES = ["jpg", "jpeg", "png", "gif", "webp", "svg"];

const IMAGE_REGEX = new RegExp(`\\.(${IMAGETYPES.join("|")})$`, "i");

const IMAGE_REGEX_1 = new RegExp(`\\.(${IMAGETYPES.join("|")})`, "i");

const imageTypes = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
const headerArrayTypes = [
  "string",
  "number",
  "date",
  FIELDTYPES.dateTimeType,
  "boolean",
  FIELDTYPES.singleSelectType,
  "actions",
  "custom",
];

const createData = (data: any[], headers: string[], headerTypes: (string | object)[]) => {
  if (!headers.includes("locale")) {
    headers.push("locale");
    headerTypes.push("text");
  }
  const header = headers?.map?.((value: string, index: number) => ({
    value,
    type: headerTypes?.[index],
  }));
  const rows = data?.map?.((entry: any) =>
    headers.map((key) => ({
      value: entry?.[key] ?? "",
    }))
  );

  return [header, ...(rows || [])];
};

export const getReferenceFieldData = async (
  entryContentTypeUid: string,
  contentTypeUid: string,
  referenceFieldPath: string,
  appSdk: any
) => {
  try {
    if (!entryContentTypeUid || !contentTypeUid || !referenceFieldPath || !appSdk) {
      console.warn("Missing required parameters for getReferenceFieldData");
      return null;
    }

    const referenceEntry = await appSdk?.stack
      ?.ContentType?.(contentTypeUid)
      ?.Entry?.(entryContentTypeUid)
      ?.includeReference?.([referenceFieldPath])
      ?.only?.([referenceFieldPath])
      ?.fetch?.();

    return {
      entryUid: entryContentTypeUid,
      data: referenceEntry,
    };
  } catch (error) {
    console.error("Error fetching reference data:", error);
    return null;
  }
};

const extractReferenceFields = (schema: any[]): { path: string; field: any }[] => {
  const referenceFields: { path: string; field: any }[] = [];

  const processSchema = (schemaItems: any[], parentPath: string = "") => {
    schemaItems?.forEach?.((field) => {
      const currentPath = parentPath ? `${parentPath}.${field?.uid}` : field?.uid;

      if (field?.data_type === localeTexts?.FullPage?.constants?.referenceText?.reference) {
        referenceFields?.push?.({
          path: currentPath,
          field: {
            ...field,
            reference_to: Array?.isArray?.(field?.reference_to) ? field?.reference_to : [field?.reference_to],
          },
        });
      } else if (field?.data_type === FIELDTYPES?.groupType && field?.schema) {
        processSchema(field?.schema, currentPath);
      } else if (field?.blocks && Array?.isArray?.(field?.blocks)) {
        field?.blocks?.forEach?.((block: any) => {
          if (block?.schema) {
            processSchema(block?.schema, currentPath);
          }
        });
      }
    });
  };

  processSchema(schema);
  return referenceFields;
};

export const openFileUploadDialog = (onFileSelect: (file: File) => void, accept: string = "image/*") => {
  const fileInput = document?.createElement?.("input");
  fileInput.type = FIELDTYPES?.fileType;
  fileInput.accept = accept;

  fileInput.onchange = (e: Event) => {
    const target = e?.target as HTMLInputElement;
    const file = target?.files?.[0];

    if (file) {
      onFileSelect?.(file);
    }
  };

  fileInput?.click?.();
};

const validateHeaderTypes = (type: string): string => {
  if (type === FIELDTYPES?.textType) return "string";
  else if (type === "isodate") return FIELDTYPES?.dateTimeType;
  else if (!headerArrayTypes?.includes?.(type)) return "string";
  else return type;
};

const validateHeadersAndHeaderTypes = (headers: string[], schema: any, headerTypes: (string | object)[]) => {
  return headers?.filter?.((header: string) => {
    const uids = header?.split?.(".");
    const uid = uids?.[0]?.replace?.(/\[\d+\]/g, "");

    return schema?.some?.((item: any) => {
      if (item?.uid === uid && item?.data_type === FIELDTYPES?.fileType) {
        const isImage =
          item?.file_size &&
          (item?.format?.some?.((fmt: string) => imageTypes?.includes?.(fmt?.toLowerCase?.())) ||
            item?.extensions?.some?.((ext: string) => imageTypes?.includes?.(ext?.toLowerCase?.())));

        if (isImage) {
          headerTypes?.push?.({
            type: FIELDTYPES?.fileType,
            fileType: FIELDTYPES?.imageType,
            formats: item?.format || item?.extensions,
          });
          return true;
        }

        headerTypes?.push?.({ type: FIELDTYPES?.fileType, fileType: "other" });
        return true;
      }

      if (item?.uid === uid && !(uids?.length > 1)) {
        if (item?.enum && item?.multiple === false) {
          headerTypes?.push?.({
            type: FIELDTYPES?.singleSelectType,
            options: item?.enum?.choices?.map?.((choice: any) => choice?.value),
          });
          return true;
        } else if (item?.enum && item?.multiple === true) {
          headerTypes?.push?.({
            type: FIELDTYPES?.multiSelectType,
            options: item?.enum?.choices?.map?.((choice: any) => choice?.value),
          });
          return true;
        }
        headerTypes?.push?.(validateHeaderTypes(item?.data_type));
        return true;
      } else if (item?.data_type === FIELDTYPES?.groupType) {
        const groupSchema = item?.schema;
        const groupHeaders = validateHeadersAndHeaderTypes([uids?.slice?.(1)?.join?.(".")], groupSchema, headerTypes);
        return groupHeaders?.length > 0;
      } else if (item?.data_type === FIELDTYPES?.blocksType) {
        const blockIndexMatch = uid?.match?.(/\[(\d+)\]/);
        const blockIndex = blockIndexMatch ? parseInt(blockIndexMatch?.[1]) : null;
        const baseFieldName = uid?.replace?.(/\[\d+\]/g, "");

        if (baseFieldName === item?.uid) {
          if (uids?.length > 1) {
            const remainingPath = uids?.slice?.(1)?.join?.(".");
            const blockTypeMatch = remainingPath?.match?.(/^([^.]+)/);
            const blockType = blockTypeMatch ? blockTypeMatch?.[1] : null;

            const matchingBlock = item?.blocks?.find?.(
              (block: any) => block?.uid === blockType || block?.unique_id === blockType
            );

            if (matchingBlock) {
              const fieldPath = remainingPath?.split?.(".")?.slice?.(1)?.join?.(".");
              if (fieldPath) {
                const blockFieldSchema = matchingBlock?.schema;
                const blockFieldHeaders = validateHeadersAndHeaderTypes([fieldPath], blockFieldSchema, headerTypes);
                return blockFieldHeaders?.length > 0;
              }

              headerTypes?.push?.("string");
              return true;
            }
          }

          headerTypes?.push?.({ type: "custom", blockTypes: item?.blocks?.map?.((b: any) => b?.uid || b?.unique_id) });
          return true;
        }

        return false;
      } else if (
        item?.data_type === "link" &&
        (uids?.slice?.(1)?.[0] === "title" || uids?.slice?.(1)?.[0] === "url" || uids?.slice?.(1)?.[0] === "href")
      ) {
        headerTypes?.push?.("string");
        return true;
      }
      return false;
    });
  });
};

function entryObjectMapper(entry: any) {
  const keysWithDot = Object?.keys?.(entry)?.filter?.((key: any) => key?.includes?.("."));
  const keyValueObject = keysWithDot?.reduce?.((acc: any, key: any) => {
    const keySplit = key?.split?.(".");
    const newValue = entry?.[key];

    const isImageObject =
      typeof newValue === "object" &&
      newValue !== null &&
      (newValue?.url || newValue?.content_type?.startsWith?.("image/"));

    if (isImageObject) {
      acc[keySplit?.[0]] = newValue;
      return acc;
    }

    let currentObj = acc;
    for (let i = 0; i < keySplit?.length; i++) {
      const part = keySplit?.[i];
      if (i === keySplit?.length - 1) {
        currentObj[part] = newValue;
      } else {
        if (part?.match?.(/\[\d+\]/)) {
          const arrayName = part.slice(0, part.indexOf("["));
          const index = parseInt(part.slice(part.indexOf("[") + 1, part.indexOf("]")));
          if (!currentObj?.[arrayName]) {
            currentObj[arrayName] = [];
          }
          if (!currentObj?.[arrayName]?.[index]) {
            currentObj[arrayName][index] = {};
          }
          currentObj = currentObj[arrayName][index];
        } else {
          if (!currentObj[part]) {
            currentObj[part] = {};
          }
          currentObj = currentObj[part];
        }
      }
    }

    return acc;
  }, {});

  keysWithDot?.forEach?.((key: any) => {
    delete entry?.[key];
  });

  return { ...entry, ...keyValueObject };
}

const processModularBlocksForDisplay = (entries: any[], schema: any) => {
  return entries?.map?.((entry) => {
    const result = { ...entry };
    const processedKeys = new Set();

    schema?.forEach?.((field: any) => {
      if (field?.data_type === FIELDTYPES?.blocksType && entry?.[field?.uid]) {
        const blocks = entry?.[field?.uid];

        if (Array?.isArray?.(blocks)) {
          blocks?.forEach?.((block: any, index: number) => {
            const blockType = block?.block_type || block?._content_type_uid;

            const blockTypeKey = `${field?.uid}[${index}].block_type`;
            if (!processedKeys?.has?.(blockTypeKey)) {
              result[blockTypeKey] = blockType;
              processedKeys?.add?.(blockTypeKey);
            }

            const blockSchema = field?.blocks?.find?.(
              (b: any) => b?.uid === blockType || b?.unique_id === blockType
            )?.schema;

            if (blockSchema && block) {
              Object?.entries?.(block)?.forEach?.(([key, value]) => {
                // Handle nested objects recursively
                if (value && typeof value === "object" && !Array?.isArray?.(value)) {
                  Object?.entries?.(value)?.forEach?.(([nestedKey, nestedValue]) => {
                    const fullKey = `${field?.uid}[${index}].${key}.${nestedKey}`;
                    if (!processedKeys?.has?.(fullKey)) {
                      result[fullKey] = nestedValue;
                      processedKeys?.add?.(fullKey);
                    }
                  });
                } else {
                  const fullKey = `${field?.uid}[${index}].${key}`;
                  if (!processedKeys?.has?.(fullKey) && key !== "_metadata") {
                    result[fullKey] = value;
                    processedKeys?.add?.(fullKey);
                  }
                }
              });
            }
          });
        }
      }
    });
    return result;
  });
};

const filterUnwantedFields = (
  headers: string[],
  headerTypes: (string | object)[],
  unwantedPatterns: RegExp[] = [/\._metadata/]
) => {
  const filteredResult = headers?.reduce?.(
    (result: { filteredHeaders: string[]; filteredTypes: (string | object)[] }, header, index) => {
      const shouldInclude = !unwantedPatterns?.some?.((pattern) => pattern?.test?.(header));

      if (shouldInclude) {
        result?.filteredHeaders?.push?.(header);
        result?.filteredTypes?.push?.(headerTypes?.[index]);
      }

      return result;
    },
    { filteredHeaders: [], filteredTypes: [] }
  );

  return filteredResult;
};

const extractModularBlockHeaders = (schema: any, entries: any[] = [], configuredFields: string[] = []) => {
  const headers: string[] = [];
  const headerTypes: (string | object)[] = [];
  const processedHeaders = new Set();

  const blockFieldsMap = new Map();

  const detectImageField = (key: string, value: any): boolean => {
    return (
      (typeof value === "object" && (value?.url || value?.href || (value?.asset && value?.asset?.url))) ||
      key?.includes?.(FIELDTYPES?.imageType) ||
      key?.includes?.("img") ||
      key?.includes?.(FIELDTYPES?.photoType) ||
      (typeof value === "string" &&
        (value?.match?.(IMAGE_REGEX) || (value?.startsWith?.("http") && value?.match?.(IMAGE_REGEX_1))))
    );
  };

  entries?.forEach?.((entry) => {
    schema?.forEach?.((field: any) => {
      if (
        field?.data_type === FIELDTYPES?.blocksType &&
        entry?.[field?.uid] &&
        Array?.isArray?.(entry?.[field?.uid]) &&
        configuredFields?.includes?.(field?.uid)
      ) {
        entry?.[field?.uid]?.forEach?.((block: any, index: number) => {
          Object?.entries?.(block)?.forEach?.(([key, value]) => {
            if (value && typeof value === "object" && !Array?.isArray?.(value) && key !== "_metadata") {
              Object?.entries?.(value as object)?.forEach?.(([nestedKey, nestedValue]) => {
                const headerKey = `${field?.uid}[${index}].${key}.${nestedKey}`;
                if (configuredFields?.some?.((configField) => headerKey?.startsWith?.(configField))) {
                  if (detectImageField?.(nestedKey, nestedValue)) {
                    blockFieldsMap?.set?.(headerKey, {
                      type: FIELDTYPES?.fileType,
                      fileType: FIELDTYPES?.imageType,
                    });
                  } else {
                    blockFieldsMap?.set?.(headerKey, "string");
                  }
                }
              });
            } else if (key !== "_metadata") {
              const headerKey = `${field?.uid}[${index}].${key}`;
              if (configuredFields?.some?.((configField) => headerKey?.startsWith?.(configField))) {
                if (detectImageField?.(key, value)) {
                  blockFieldsMap?.set?.(headerKey, {
                    type: FIELDTYPES?.fileType,
                    fileType: FIELDTYPES?.imageType,
                  });
                } else {
                  blockFieldsMap?.set?.(headerKey, "string");
                }
              }
            }
          });
        });
      }
    });
  });

  blockFieldsMap?.forEach?.((type, header) => {
    if (!processedHeaders?.has?.(header)) {
      headers?.push?.(header);
      headerTypes?.push?.(type);
      processedHeaders?.add?.(header);
    }
  });

  return { headers, headerTypes };
};

const getValueAtPath = (obj: any, path: string) => {
  const parts = path?.split?.(".");
  let current = obj;
  for (const part of parts || []) {
    if (!current) return undefined;
    current = current?.[part];
  }
  return current;
};

const extractGlobalFields = (schema: any[]) => {
  const globalFields: { path: string; field: any }[] = [];

  const traverse = (fields: any[], parentPath = "") => {
    fields?.forEach?.((field) => {
      const currentPath = parentPath ? `${parentPath}.${field?.uid}` : field?.uid;

      if (field?.data_type === FIELDTYPES?.globalFieldType) {
        globalFields?.push?.({
          path: currentPath,
          field: {
            ...field,
            schema: field?.schema || [],
          },
        });
      }

      // Recursively check nested
      if (field?.schema) {
        traverse(field?.schema, currentPath);
      }

      // Check blocks schemas
      if (field?.blocks) {
        field?.blocks?.forEach?.((block: any) => {
          if (block?.schema) {
            traverse(block?.schema, `${currentPath}.${block?.uid}`);
          }
        });
      }
    });
  };

  traverse(schema);
  return globalFields;
};

export const handleContentTypeChange = async (
  selectedOption: any,
  setSelectedContentType: React.Dispatch<React.SetStateAction<any>>,
  appSdk: any,
  mapper: Record<string, any>,
  setData: React.Dispatch<React.SetStateAction<any[]>>,
  setReferenceData: React.Dispatch<React.SetStateAction<any>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  defaultLocale: any
) => {
  setSelectedContentType(selectedOption);
  setLoading(true);

  if (selectedOption) {
    const entry = await appSdk?.stack
      ?.ContentType?.(selectedOption.label)
      .Entry.Query()
      .language(defaultLocale)
      .addQuery("include_count", "true")
      .includeSchema()
      .find?.();

    // Extract both reference and global fields
    const referenceFields = extractReferenceFields(entry?.schema || []);
    const globalFields = extractGlobalFields(entry?.schema || []);

    // Handle reference fields
    if (referenceFields.length > 0 && entry?.entries?.length > 0) {
      const allReferenceData = new Map();

      for (const { path, field } of referenceFields) {
        // Fetch reference data for each unique entry
        for (const e of entry?.entries) {
          const entryUid = e?.uid;
          const referenceResponse = await getReferenceFieldData(entryUid, selectedOption.label, path, appSdk);

          if (referenceResponse) {
            // Store reference data with a unique key combining entry UID and path
            const key = `${entryUid}_${path}`;
            allReferenceData?.set?.(key, referenceResponse?.data);
          }
        }

        // Update entries with their respective reference data
        entry.entries = entry?.entries?.map?.((e: any) => {
          const pathParts = path?.split?.(".");
          let current = e;

          for (let i = 0; i < pathParts?.length - 1; i++) {
            if (!current?.[pathParts[i]]) {
              current[pathParts[i]] = {};
            }
            current = current?.[pathParts[i]];
          }

          const lastPart = pathParts?.[pathParts?.length - 1];
          const key = `${e?.uid}_${path}`;
          const entryReferenceData = allReferenceData?.get?.(key);

          if (entryReferenceData?.[lastPart]) {
            const referenceValue = getValueAtPath(e, path);

            const references = Array?.isArray?.(entryReferenceData[lastPart])
              ? entryReferenceData[lastPart]?.map?.((ref: any) => ({
                  ...ref,
                  _content_type_uid: ref?._content_type_uid || field?.reference_to?.[0],
                  title: ref?.title || ref?.name || localeTexts?.FullPage?.constants?.referenceText?.referenceditem,
                }))
              : {
                  ...entryReferenceData?.[lastPart],
                  _content_type_uid: entryReferenceData?.[lastPart]?._content_type_uid || field?.reference_to?.[0],
                  title:
                    entryReferenceData?.[lastPart]?.title ||
                    entryReferenceData?.[lastPart]?.name ||
                    localeTexts?.FullPage?.constants?.referenceText?.referenceditem,
                };

            current[lastPart] = references;
          }

          return {
            ...e,
            __fieldTypes: {
              ...e?.__fieldTypes,
              [path]: {
                type: FIELDTYPES?.referenceType,
                reference_to: field?.reference_to,
                referenceTitle:
                  getValueAtPath(e, path)?.title ||
                  getValueAtPath(e, `${path}.name`) ||
                  localeTexts?.FullPage?.constants?.referenceText?.referenceditem,
                referenceData: allReferenceData?.get?.(key),
              },
            },
          };
        });

        // Store the combined reference data for all entries
        const combinedReferenceData = Object?.fromEntries?.(
          Array?.from?.(allReferenceData?.entries?.())?.map?.(([key, value]) => {
            const [entryUid, fieldPath] = key?.split?.(/_/);
            return [key, { entryUid, path: fieldPath, data: value }];
          })
        );
        setReferenceData?.(combinedReferenceData);
      }
    }

    // Handle global fields
    if (globalFields.length > 0 && entry?.entries?.length > 0) {
      entry.entries = entry.entries?.map?.((e: any) => {
        globalFields?.forEach?.(({ path, field }) => {
          const pathParts = path?.split?.(".");
          let current = e;

          for (let i = 0; i < pathParts?.length - 1; i++) {
            if (!current?.[pathParts[i]]) {
              current[pathParts[i]] = {};
            }
            current = current[pathParts[i]];
          }

          const lastPart = pathParts?.[pathParts?.length - 1];
          if (current[lastPart]) {
            e.__fieldTypes = {
              ...e.__fieldTypes,
              [path]: {
                type: FIELDTYPES?.globalFieldType,
                reference_to: field?.reference_to,
                schema: field?.schema,
              },
            };
          }
        });
        return e;
      });
    }

    let headerTypes: (string | object)[] = [];
    let headers = validateHeadersAndHeaderTypes(
      Object?.values?.(mapper)?.[selectedOption.value] || [],
      entry?.schema,
      headerTypes
    );

    globalFields?.forEach?.(({ path, field }) => {
      if (!headers?.includes?.(path)) {
        headers?.push?.(path);
        headerTypes?.push?.({
          type: FIELDTYPES?.globalFieldType,
          reference_to: field?.reference_to,
          schema: field?.schema,
        });
      }
    });

    referenceFields?.forEach?.(({ path, field }) => {
      if (!headers?.includes?.(path)) {
        const referenceValue = getValueAtPath(entry?.entries?.[0], path);
        headers?.push?.(path);
        headerTypes?.push?.({
          type: FIELDTYPES?.referenceType,
          reference_to: field?.reference_to,
          referenceTitle:
            referenceValue?.title ||
            referenceValue?.name ||
            localeTexts?.FullPage?.constants?.referenceText?.referenceditem,
        });
      }
    });

    const expandArrayHeaders = (entries: any[]) => {
      const expandedHeaders: string[] = [];
      const expandedHeaderTypes: (string | object)[] = [];

      headers?.forEach?.((header, index) => {
        let foundArray = false;

        for (const entry of entries) {
          if (entry[header] && Array?.isArray?.(entry[header])) {
            foundArray = true;

            for (let i = 0; i < entry[header]?.length; i++) {
              const indexedHeader = `${header}.${i}`;
              if (!expandedHeaders?.includes?.(indexedHeader)) {
                expandedHeaders?.push?.(indexedHeader);
                expandedHeaderTypes?.push?.(headerTypes?.[index]);
              }
            }
            break;
          }
        }
        if (!foundArray) {
          expandedHeaders?.push?.(header);
          expandedHeaderTypes?.push?.(headerTypes?.[index]);
        }
      });
      return { expandedHeaders, expandedHeaderTypes };
    };

    const processedEntries =
      entry?.entries?.length > 0 ? processModularBlocksForDisplay(entry.entries, entry.schema) : [];

    if (processedEntries?.length > 0) {
      const { expandedHeaders, expandedHeaderTypes } = expandArrayHeaders(processedEntries);
      headers = expandedHeaders;
      headerTypes = expandedHeaderTypes;
    }

    const { headers: moduleHeaders, headerTypes: moduleHeaderTypes } = extractModularBlockHeaders(
      entry?.schema,
      processedEntries
    );

    const combinedHeaders = [...headers];
    const combinedHeaderTypes = [...headerTypes];

    moduleHeaders?.forEach?.((header, index) => {
      if (!combinedHeaders?.includes?.(header)) {
        combinedHeaders?.push?.(header);
        combinedHeaderTypes?.push?.(moduleHeaderTypes?.[index]);
      }
    });

    headers = combinedHeaders;
    headerTypes = combinedHeaderTypes;

    const { filteredHeaders, filteredTypes } = filterUnwantedFields(headers, headerTypes);
    headers = filteredHeaders;
    headerTypes = filteredTypes;

    if (!headers?.includes?.("uid")) {
      headers.push("uid");
      headerTypes.push("string");
    } else {
      const uidIndex = headers.indexOf("uid");
      if (uidIndex !== -1) {
        headers.splice(uidIndex, 1);
        headerTypes.splice(uidIndex, 1);
      }
      headers.push("uid");
      headerTypes.push("string");
    }

    const entries: any = [];

    const flatten = (obj: any, prefix = "") => {
      let result: Record<string, any> = {};

      if (obj === null || obj === undefined) {
        return result;
      }

      if (typeof obj !== "object") {
        result[prefix] = obj;
        return result;
      }

      if (prefix && obj?.__fieldTypes?.[prefix]?.type === FIELDTYPES?.globalFieldType) {
        const globalFieldKey = prefix?.split?.(".")?.pop?.() || prefix;
        const globalFieldValue = Object?.entries?.(obj)?.reduce?.((acc: any, [key, value]) => {
          if (key !== "__fieldTypes") {
            acc[key] = value;
          }
          return acc;
        }, {});
        result[globalFieldKey] = globalFieldValue;
        return result;
      }

      if (obj._content_type_uid && obj.uid) {
        result[prefix] = { ...obj };
        return result;
      }

      if (Array?.isArray?.(obj) && prefix?.includes?.(FIELDTYPES?.modularBlocksType)) {
        obj?.forEach?.((item, index) => {
          const blockPrefix = `${prefix}[${index}]`;
          if (typeof item === "object" && item !== null) {
            result[`${blockPrefix}.block_type`] = item.block_type;
            Object?.entries?.(item)?.forEach?.(([key, value]) => {
              if (key !== "block_type") {
                const newPrefix = `${blockPrefix}.${key}`;
                const flattenedValue = flatten(value, newPrefix);
                Object?.assign?.(result, flattenedValue);
              }
            });
          }
        });
        return result;
      }

      // Regular array handling
      if (Array?.isArray?.(obj)) {
        obj?.forEach?.((item, index) => {
          if (typeof item === "object" && item !== null) {
            const flatItem = flatten(item, `${prefix}[${index}]`);
            Object?.assign?.(result, flatItem);
          } else {
            result[`${prefix}[${index}]`] = item;
          }
        });
        return result;
      }

      if (
        obj?.url &&
        obj?.content_type &&
        (obj?.content_type?.startsWith?.("image/") || obj?.filename?.match?.(/\.(jpg|jpeg|png|gif|webp|svg)$/i))
      ) {
        result[prefix] = { ...obj };
        result[`${prefix}.url`] = obj?.url;
        return result;
      }

      for (const key in obj) {
        if (Object?.prototype?.hasOwnProperty?.call?.(obj, key)) {
          const value = obj[key];
          const newKey = prefix ? `${prefix}.${key}` : key;

          if (obj.__fieldTypes?.[key]?.type === FIELDTYPES?.globalFieldType) {
            result[key] = value;
            continue;
          }

          // Handle image fields
          if (
            value &&
            typeof value === "object" &&
            ((value?.url &&
              value?.content_type &&
              (value?.content_type?.startsWith?.("image/") || value?.filename?.match?.(IMAGE_REGEX))) ||
              key?.includes?.(FIELDTYPES?.imageType) ||
              key?.includes?.(FIELDTYPES?.bannerImageType))
          ) {
            result[newKey] = { ...value };
            if (value?.url) {
              result[`${newKey}.url`] = value?.url;
            }
          }
          // Handle nested objects and arrays
          else if (value && typeof value === "object") {
            if (key === FIELDTYPES?.modularBlocksType || key?.includes?.(FIELDTYPES?.blocksType)) {
              const nested = flatten(value, newKey);
              Object?.assign?.(result, nested);
            } else {
              const nested = flatten(value, newKey);
              Object?.assign?.(result, nested);

              if (
                Array?.isArray?.(value) ||
                value?._content_type_uid ||
                value?.url ||
                obj?.__fieldTypes?.[key]?.type === FIELDTYPES?.globalFieldType
              ) {
                result[newKey] = value;
              }
            }
          } else {
            result[newKey] = value;
          }
        }
      }

      return result;
    };

    if (processedEntries?.length > 0) {
      processedEntries?.forEach?.((item: any) => {
        const flattenedItem = flatten(item);

        // Only process entries that match the selected locale
        if (flattenedItem?.locale === defaultLocale) {
          const fieldData = Object?.fromEntries?.(
            headers?.map?.((key: any, index: number) => {
              if (
                flattenedItem[key] &&
                typeof flattenedItem[key] === "object" &&
                flattenedItem[key]._content_type_uid &&
                flattenedItem[key]?.uid
              ) {
                return [key, flattenedItem[key]];
              }

              // Handle modular blocks and nested fields
              if (key?.includes?.(FIELDTYPES?.modularBlocksType) || key?.includes?.(".")) {
                const pathParts = key?.split?.(".");
                const blockType = pathParts?.[0]?.split?.("[")?.[0];
                const fieldPath = pathParts?.slice?.(1)?.join?.(".");

                const matchingKey = Object?.keys?.(flattenedItem)?.find?.((itemKey) => {
                  if (!itemKey?.includes?.(blockType)) return false;

                  const itemPathParts = itemKey?.split?.(".");
                  const itemFieldPath = itemPathParts?.slice?.(1)?.join?.(".");
                  return itemFieldPath === fieldPath;
                });

                if (matchingKey) {
                  return [key, flattenedItem[matchingKey]];
                }
              }

              const baseField = key?.split?.(".")?.[0];
              if (flattenedItem?.[baseField] && Array?.isArray?.(flattenedItem?.[baseField])) {
                const arrayIndex = key?.split?.(".")?.[1];
                if (arrayIndex !== undefined) {
                  return [key, flattenedItem?.[baseField][parseInt(arrayIndex)] ?? ""];
                }
              }

              if (
                headerTypes?.[index] &&
                typeof headerTypes?.[index] === "object" &&
                (headerTypes?.[index] as { type: string })?.type === FIELDTYPES?.multiSelectType
              ) {
                return [key, flattenedItem[key] ?? ""];
              }

              const headerType = headerTypes?.[index];
              const isImageField =
                typeof headerType === "object" &&
                (headerType as any)?.type === FIELDTYPES?.fileType &&
                ((headerType as any)?.fileType === FIELDTYPES?.imageType ||
                  key?.includes?.(FIELDTYPES?.imageType) ||
                  key?.includes?.("img"));

              if (key?.endsWith?.(".url")) {
                return [key, flattenedItem[key] ?? ""];
              }

              if (
                isImageField ||
                (flattenedItem[key] &&
                  typeof flattenedItem[key] === "object" &&
                  (flattenedItem[key]?.url || flattenedItem[key]?.content_type?.startsWith?.("image/")))
              ) {
                if (
                  flattenedItem[key] &&
                  typeof flattenedItem[key] === "object" &&
                  (flattenedItem[key]?.url || flattenedItem[key]?.href)
                ) {
                  return [key, flattenedItem[key]];
                }

                const directPath = Object?.keys?.(flattenedItem)?.find?.(
                  (k) => k?.startsWith?.(key) && typeof flattenedItem?.[k] === "object" && flattenedItem?.[k]?.url
                );

                if (directPath) {
                  return [key, flattenedItem[directPath]];
                }

                for (const k of Object?.keys?.(flattenedItem)) {
                  if (k?.includes?.(key) && typeof flattenedItem?.[k] === "object" && flattenedItem?.[k]?.url) {
                    return [key, flattenedItem[k]];
                  }
                }

                return [
                  key,
                  {
                    uid: "",
                    url: "",
                    content_type: "",
                    file_size: "",
                    filename: "",
                    title: "",
                    locale: flattenedItem?.locale,
                  },
                ];
              }

              return [key, flattenedItem[key] ?? ""];
            })
          );

          const newEntry = {
            ...fieldData,
            locale: flattenedItem?.locale,
          };

          entries.push(newEntry);
        }
      });

      const rows = createData(entries, headers, headerTypes);
      setData(rows);
    } else {
      setData([]);
    }
  } else {
    setData([]);
  }
  setLoading(false);
};

export const updateEntryData = async ({
  stack,
  contentTypeValue,
  entry,
  localeValue,
  publish,
  envs,
  locales,
  imageFields,
}: any) => {
  try {
    entry = entryObjectMapper(entry);

    const processedEntry = JSON.parse(JSON.stringify(entry));

    const SPECIAL_IMAGE_FIELDS: Record<string, string> = {
      herobanner: FIELDTYPES?.bannerImageType,
      hero_banner: FIELDTYPES?.bannerImageType,
      hero: FIELDTYPES?.bannerImageType,
      page_banner: FIELDTYPES?.bannerImageType,
    };

    const processImages = (obj: any, parent = "") => {
      if (!obj || typeof obj !== "object") return;

      if (Array?.isArray?.(obj)) {
        obj?.forEach?.((item, index) => {
          if (item && typeof item === "object") {
            processImages(item, `${parent}[${index}]`);
          }
        });
        return;
      }

      Object?.keys?.(obj)?.forEach?.((key) => {
        const fullPath = parent ? `${parent}.${key}` : key;
        const value = obj[key];

        if (SPECIAL_IMAGE_FIELDS[key] && typeof value === "string") {
          const nestedField = SPECIAL_IMAGE_FIELDS[key];
          obj[key] = { [nestedField]: value };
          return;
        }

        if (
          key === FIELDTYPES?.modularBlocksType ||
          key === FIELDTYPES?.blocksType ||
          key === FIELDTYPES?.groupType ||
          key === FIELDTYPES?.globalFieldType
        ) {
          if (typeof value === "object" && value !== null) {
            processImages(value, fullPath);
          }
          return;
        }

        if (value && typeof value === "object" && !Array?.isArray?.(value) && value?.uid && value?.url) {
          if (
            value?._content_type_uid ||
            value?.filename ||
            value?.content_type ||
            key === FIELDTYPES?.imageType ||
            key?.includes?.(FIELDTYPES?.imageType) ||
            key?.includes?.(FIELDTYPES?.bannerType) ||
            key?.includes?.(FIELDTYPES?.photoType)
          ) {
            if (SPECIAL_IMAGE_FIELDS[key]) {
              const nestedField = SPECIAL_IMAGE_FIELDS[key];
              obj[key] = { [nestedField]: value?.uid };
            } else {
              obj[key] = value?.uid;
            }
          } else {
            processImages(value, fullPath);
          }
        } else if (typeof value === "string") {
          if (SPECIAL_IMAGE_FIELDS[key]) {
            const nestedField = SPECIAL_IMAGE_FIELDS[key];
            obj[key] = { [nestedField]: value };
          }
        } else if (value && typeof value === "object") {
          processImages(value, fullPath);
        }
      });
    };

    processImages(processedEntry);

    const Entry = stack?.ContentType?.(contentTypeValue?.data)?.Entry?.(processedEntry?.uid);

    let response = await Entry?.update(
      {
        entry: processedEntry,
      },
      localeValue?.value
    );

    if (publish && envs?.length && locales?.length) {
      const publishResponse = await Entry?.publish?.({
        entry: {
          environments: envs,
          locales: locales,
        },
        locale: localeValue?.value,
        version: response?.entry?._version,
      });
      response = publishResponse;
    }
    return {
      status: response
        ? localeTexts?.operation?.update?.success?.status
        : localeTexts?.operation?.update?.failed?.status,
      notice: response ? response?.notice : localeTexts?.operation?.update?.failed?.notice,
    };
  } catch (error: any) {
    const e = JSON.parse(error?.message);
    if (e?.data?.error_message) {
      console.error("Error: Update Entries", e?.data);
      let errorKeys: string[] = [];
      if (e?.data?.errors) {
        errorKeys = Object?.keys?.(e?.data?.errors);
      }
      return {
        status: localeTexts?.operation?.update?.failed?.status,
        notice: errorKeys?.length
          ? `${e?.data?.error_message} ${JSON?.stringify?.(e?.data?.errors)}.`
          : e?.data?.error_message,
      };
    }
    return localeTexts?.operation?.update?.failed;
  }
};
