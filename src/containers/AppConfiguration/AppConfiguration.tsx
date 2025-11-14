/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo } from "react";
import { Accordion, FieldLabel, Button, Icon, cbModal, Tooltip, Checkbox } from "@contentstack/venus-components";
import ContentstackAppSdk from "@contentstack/app-sdk";
import debounce from "lodash/debounce";
import { mergeObjects } from "../../common/utils";
import { IMapperConfig, TypeSelectOption } from "../../common/types";
import MapperModal from "../../components/Mapper/MapperModal/MapperModal";
import localeTexts from "../../common/locales/en-us";
import { FIELDTYPES, TIMEOUTS } from "../../common/constants";
import "@contentstack/venus-components/build/main.css";
import "./AppConfiguration.module.scss";
import DeleteModal from "../../components/DeleteModal/DeleteModal";
import ContentModelSettingsModal from "../../components/ContentModelSettingsModal";

const AppConfigurationExtension: React.FC = function () {
  const [state, setState] = useState<any>({
    installationData: {
      configuration: {
        envs: [],
        defaultEnv: {},
        additionalSettings: false,
        checkValue: true,
        includeAssets: true,
        mapper: {} as IMapperConfig,
      },
      serverConfiguration: {},
      webhooks: [
        {
          channels: [],
          webhookUid: "",
        },
      ],
    },
    setInstallationData: (): any => {},
    appSdkInitialized: false,
  });
  const [configData, setConfigData] = useState<any>({});
  const [serverConfigData, setServerConfigData] = useState<any>({});
  const [contentTypeOptions, setContentTypeOptions] = useState<TypeSelectOption[]>([]);
  const [contentSchemaOptions, setContentSchemaOptions] = useState<any>({});
  const [allContentTypes, setAllContentTypes] = useState<boolean>(true);
  const [includeAssets, setIncludeAssets] = useState<boolean>(false);
  const [isMapperModalOpen, setIsMapperModalOpen] = useState<boolean>(false);
  const [defaultKey, setDefaultKey] = useState<string>("");
  const [expandedFieldPreviews, setExpandedFieldPreviews] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const initializeAppSdk = async () => {
      try {
        const appSdk: any = await ContentstackAppSdk.init();
        const { stack, installation: sdkConfigData } = appSdk?.location?.AppConfigWidget || {};

        if (sdkConfigData) {
          const installationDataFromSDK = await sdkConfigData?.getInstallationData?.();
          const setInstallationDataOfSDK = sdkConfigData?.setInstallationData;
          const serverConfigKeys = Object.keys(installationDataFromSDK?.serverConfiguration ?? {}) || [];
          const { content_types: contenttypes } = (await stack?.getContentTypes?.()) || {};
          const mapperConfig = installationDataFromSDK?.configuration?.mapper || {};
          const { contentKeyOptions, contentValueOptions } = processContentTypes(contenttypes, mapperConfig);

          setContentTypeOptions(contentKeyOptions);
          setContentSchemaOptions(contentValueOptions);

          const installationData = mergeObjects(state?.installationData, installationDataFromSDK);
          setServerConfigData(installationData?.serverConfiguration);
          const config = installationData?.configuration;
          setConfigData(config);
          setAllContentTypes(config?.checkValue ?? false);
          setIncludeAssets(config?.includeAssets ?? false);
          setState({
            ...state,
            installationData,
            setInstallationData: setInstallationDataOfSDK,
            appSdkInitialized: true,
            appSdk: appSdk,
          });

          // Set initial validity state
          validateMappings(mapperConfig, sdkConfigData);
        }
      } catch (error) {
        console.error("Something Went Wrong While Loading App SDK", error);
      }
    };

    initializeAppSdk();
  }, []);

  const schemaLenght = 3;

  const handleSchema = (schema: any, parentUid = "") => {
    const items = schema?.flatMap?.((item: any) => {
      switch (item?.data_type) {
        case FIELDTYPES?.linkType:
          return [
            {
              label: `${parentUid}${item?.uid}.title`,
              value: `${parentUid}${item?.uid}.title`,
            },
            {
              label: `${parentUid}${item?.uid}.url`,
              value: `${parentUid}${item?.uid}.url`,
            },
          ];

        case FIELDTYPES?.groupType:
          if (item?.multiple) {
            return Array.from({ length: schemaLenght })?.flatMap?.((_, index) => {
              return handleSchema(item?.schema, `${parentUid}${item?.uid}[${index}].`);
            });
          }
          return handleSchema(item?.schema, `${parentUid}${item?.uid}.`);

        case FIELDTYPES?.blocksType:
          return item?.blocks?.flatMap?.((block: any, index: number) => {
            return handleSchema(block?.schema, `${parentUid}${item?.uid}[${index}].${block?.uid}.`);
          });

        case FIELDTYPES?.fileType:
          return [
            {
              label: `${parentUid}${item?.uid}`,
              value: `${parentUid}${item?.uid}`,
            },
          ];

        case FIELDTYPES?.globalFieldType:
          return {
            label: `${parentUid}${item?.uid}`,
            value: `${parentUid}${item?.uid}`,
          };

        case FIELDTYPES?.referenceType:
          return {
            label: `${parentUid}${item?.uid}`,
            value: `${parentUid}${item?.uid}`,
          };

        case FIELDTYPES?.richTextType:
          return false;

        default:
          return {
            label: `${parentUid}${item?.uid}`,
            value: `${parentUid}${item?.uid}`,
          };
      }
    });

    return items;
  };

  const handleSchemaForBlocks = (schema: any, parentUid = "", items: any) => {
    items?.forEach?.((item: any) => {
      if (item?.data_type === FIELDTYPES?.blocksType) {
        handleSchemaForBlocks(schema?.schema, `${parentUid}${item?.uid}.`, item?.blocks);
      } else {
        return {
          label: `${parentUid}${item?.uid}`,
          value: `${parentUid}${item?.uid}`,
          index: item?.index,
        };
      }
    });
  };

  const processContentTypes = (contenttypes: any[], mapperConfig: any) => {
    const contentKeyOptions: TypeSelectOption[] = [];
    const contentValueOptions: any = {};

    contenttypes?.forEach?.((content: any) => {
      contentKeyOptions.push({
        label: content?.uid,
        value: content?.uid,
      });

      contentValueOptions[content?.uid] = handleSchema(content?.schema)
        ?.filter?.((item: any) => item)
        ?.flat?.();

      mapperConfig?.[`${content?.uid}`]?.forEach?.((item: any) => {
        if (!contentValueOptions[content?.uid]?.some?.((opt: any) => opt?.value === item)) {
          contentValueOptions[content?.uid]?.push?.({
            label: item,
            value: item,
          });
        }
      });
    });

    return { contentKeyOptions, contentValueOptions };
  };

  // Function to validate mappings and set button state
  const validateMappings = (mapper: any, sdkConfigData: any) => {
    const hasMapper = mapper && Object.keys(mapper)?.length > 0;

    let hasValidMappings = true;

    if (hasMapper) {
      const mapperEntries = Object.entries(mapper);
      const hasEmptySelection = mapperEntries?.some?.(([contentType, fieldSelections]: [string, any]) => {
        return !fieldSelections || (Array.isArray(fieldSelections) && fieldSelections.length === 0);
      });

      hasValidMappings = !hasEmptySelection;
    }

    if (hasMapper && hasValidMappings) {
      sdkConfigData?.setValidity?.(true);
    } else {
      sdkConfigData?.setValidity?.(false, {
        message: hasMapper
          ? localeTexts?.ConfigScreen?.mapper?.selectFieldText
          : localeTexts?.ConfigScreen?.mapper?.configureFieldText,
      });
    }
  };

  const setDataInConfig = useMemo(
    () =>
      debounce(async (updatedInstallationData) => {
        setState({
          ...state,
          installationData: updatedInstallationData,
        });

        if (typeof state?.setInstallationData !== "undefined") {
          await state?.setInstallationData?.(updatedInstallationData);

          if (state?.appSdk?.location?.AppConfigWidget?.installation) {
            validateMappings(
              updatedInstallationData?.configuration?.mapper,
              state?.appSdk?.location?.AppConfigWidget?.installation
            );
          }
        }
      }, TIMEOUTS.debounceConfig),
    [state]
  );

  const saveData = (data: any, configuration?: any) => {
    const config: any = configuration || {
      ...state?.installationData?.configuration,
    };
    config.envs = Object.keys(data ?? {});
    setConfigData(config);
    const updatedInstallationData = {
      ...state?.installationData,
      configuration: config,
      serverConfiguration: {
        ...(data ?? {}),
        custom_serverconfig: state?.installationData?.serverConfiguration?.custom_serverconfig,
      },
    };

    setDataInConfig(updatedInstallationData);
  };

  const getMapper = (mapper: any) => {
    if (state?.appSdk?.location?.AppConfigWidget?.installation) {
      validateMappings(mapper, state?.appSdk?.location?.AppConfigWidget?.installation);
    }

    saveData(serverConfigData, {
      ...configData,
      mapper,
    });
  };

  const handleMapperConfig = (contentType: string) => {
    const updatedMapper: IMapperConfig = {
      ...state?.installationData?.configuration?.mapper,
      [contentType]: [],
    };

    saveData(serverConfigData, {
      ...configData,
      mapper: updatedMapper,
    });
  };

  const handleFieldsChange = (contentType: string, fields: string[]) => {
    const updatedMapper: IMapperConfig = {
      ...state?.installationData?.configuration?.mapper,
      [contentType]: fields,
    };

    saveData(serverConfigData, {
      ...configData,
      mapper: updatedMapper,
    });
  };

  const handleDeleteContentType = (contentType: string) => {
    const updatedMapper: IMapperConfig = { ...state?.installationData?.configuration?.mapper };
    delete updatedMapper?.[contentType];

    saveData(serverConfigData, {
      ...configData,
      mapper: updatedMapper,
    });
  };

  const mapperEntries = Object.entries((state?.installationData?.configuration?.mapper || {}) as IMapperConfig)?.map?.(
    ([contentType, fields]) => [contentType, Array.isArray(fields) ? fields : []] as [string, string[]]
  );

  const handleDefaultConfigFn = (e: any, acckey: string) => {
    if (e?.target?.checked) {
      setDefaultKey(acckey);
      setState({
        ...state,
        installationData: {
          ...state?.installationData,
          configuration: {
            ...state?.installationData?.configuration,
            default_multi_config_key: acckey,
          },
        },
      });
    }
  };

  const handleOpenFieldsModal = async (contentType: string) => {
    // Fetch the schema for the content type
    try {
      const contentTypeSchema = await state?.appSdk?.stack?.getContentType?.(contentType, {
        include_global_field_schema: true,
      });

      cbModal({
        component: (props: any) => {
          // Create a temporary state structure for the modal
          const modalState = {
            installationData: {
              configuration: {
                ...state?.installationData?.configuration,
                manageFields: [
                  {
                    contentType: contentType,
                    selectedFieldsUID: state?.installationData?.configuration?.mapper?.[contentType] || [],
                    isEnabled: true,
                    extraFields: [],
                  },
                ],
                excludeKeys: {},
                excludedFieldTypes: [],
              },
            },
            setInstallationData: async (updatedData: any) => {
              // Extract the selected fields from the manageFields structure
              const manageFieldsEntry = updatedData?.configuration?.manageFields?.find?.(
                (entry: any) => entry?.contentType === contentType
              );

              if (manageFieldsEntry) {
                // Update the mapper with the selected fields
                handleFieldsChange(contentType, manageFieldsEntry?.selectedFieldsUID || []);
              }

              // Don't call the main setInstallationData here,
              // as handleFieldsChange already does the update
            },
          };

          return (
            <ContentModelSettingsModal
              contentTypes={[
                {
                  label: contentType,
                  value: contentType,
                },
              ]}
              closeModal={props.closeModal}
              state={modalState}
              appSDK={state?.appSdk}
              fieldTypesToExclude={[]}
            />
          );
        },
        modalProps: {
          size: "customSize",
        },
      });
    } catch (error) {
      console.error("Error opening fields modal:", error);
    }
  };

  return (
    <>
      <div className="appConfigurationHeader">
        <div className="header-content">
          <div className="header-main">
            <Icon icon="Settings" size="large" version="v2" className="header-icon" />
            <div className="header-text">
              <h1 className="header-title">{localeTexts?.ConfigScreen?.headerTitle}</h1>
              <p className="header-subtitle">Bulk Update Configuration</p>
            </div>
          </div>
          {/* <div className="header-description">
            <p className="description-text">
              Configure which content types and fields you want to enable for bulk editing. Select content types and
              choose specific fields that will be available for bulk updates in your entries.
            </p>
          </div> */}
        </div>
      </div>

      <div className="appConfigurationLayout">
        <div className="appConfigurationPage">
          {state?.appSdkInitialized ? (
            <div className="appConfigurationContent">
              <div className="info-banner">
                <Icon icon="InformationCircle" size="small" version="v2" className="info-icon" />
                <div className="info-content">
                  <p className="info-title">Getting Started:- </p>
                  <p className="info-description">
                    Add content types below and click the "Manage Fields" button to select which fields you want to make
                    editable in bulk. At least one content type with selected fields is required to enable the bulk
                    update feature.
                  </p>
                </div>
              </div>

              <div className="multi-config-accordian-wrapper">
                <div className="content-type-count-header">
                  <div className="header-left">
                    <Icon icon="ContentType" size="small" version="v2" className="section-icon" />
                    <h3>{localeTexts?.ConfigScreen?.Accordion?.title}</h3>
                  </div>
                  <span className="content-type-count">
                    {mapperEntries?.length} {mapperEntries?.length === 1 ? "Content Type" : "Content Types"}
                  </span>
                </div>

                {mapperEntries?.length === 0 && (
                  <div className="empty-state-card">
                    <Icon icon="ContentType" size="large" version="v2" className="empty-icon" />
                    <h4 className="empty-title">No Content Types Configured</h4>
                    <p className="empty-description">
                      Start by adding a content type to enable bulk editing. Click the button below to get started.
                    </p>
                  </div>
                )}

                {mapperEntries?.map?.(([contentType, fields]) => (
                  <div key={contentType} className="multi-config-wrapper">
                    <Accordion
                      version="v2"
                      title={
                        <div className="content-type-header">
                          <span>{contentType}</span>
                          <span className="selected-fields-count">
                            {fields?.length} {localeTexts?.ConfigScreen?.mapper?.fieldSelector}
                          </span>
                        </div>
                      }
                      className="content-type-accordion"
                      isContainerization
                      actions={[
                        {
                          actionClassName: "font-color-tertiary",
                          component: (
                            <Tooltip content="Delete" position="top">
                              <Icon icon={localeTexts?.Icons?.delete} size="small" version="v2" />
                            </Tooltip>
                          ),
                          onClick: () => {
                            cbModal?.({
                              component: (props: any) => (
                                <DeleteModal
                                  onConfirm={() => {
                                    handleDeleteContentType(contentType);
                                    props?.closeModal?.();
                                  }}
                                  closeModal={props?.closeModal}
                                  title={localeTexts?.DeleteModal?.title}
                                  message={localeTexts?.DeleteModal?.dialogMessage?.replace?.(/\$/g, contentType)}
                                  itemToDelete={contentType}
                                />
                              ),
                              modalProps: {
                                className: "delete-dialog-modal",
                                modalWidth: "medium",
                                shouldCloseOnOverlayClick: false,
                                closeOnEscapeKey: true,
                              },
                            });
                          },
                        },
                      ]}>
                      <div className="field-management-section">
                        <div className="field-info">
                          <div className="field-stats">
                            <Icon icon="CheckedBox" size="small" version="v2" className="stats-icon" />
                            <span className="stats-text">
                              {fields?.length} field{fields?.length !== 1 ? "s" : ""} selected
                            </span>
                          </div>
                          {fields?.length > 0 && (
                            <div className="selected-fields-preview">
                              {(expandedFieldPreviews[contentType] ? fields : fields?.slice(0, 3))?.map(
                                (field, idx) => (
                                  <span key={idx} className="field-tag">
                                    {field}
                                  </span>
                                )
                              )}
                              {fields?.length > 3 && !expandedFieldPreviews[contentType] && (
                                <span
                                  className="field-tag more-fields clickable"
                                  onClick={() =>
                                    setExpandedFieldPreviews({
                                      ...expandedFieldPreviews,
                                      [contentType]: true,
                                    })
                                  }>
                                  +{fields?.length - 3} more
                                </span>
                              )}
                              {expandedFieldPreviews[contentType] && fields?.length > 3 && (
                                <span
                                  className="field-tag show-less clickable"
                                  onClick={() =>
                                    setExpandedFieldPreviews({
                                      ...expandedFieldPreviews,
                                      [contentType]: false,
                                    })
                                  }>
                                  Show less
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <Button
                          className="manage-fields-btn"
                          icon="ContentModelsMediumActive"
                          buttonType="secondary"
                          onClick={() => handleOpenFieldsModal(contentType)}
                          size="small">
                          Manage Fields
                        </Button>
                      </div>
                    </Accordion>
                  </div>
                ))}

                <Button
                  className="multi-config-button"
                  buttonType="secondary"
                  icon="Plus"
                  size="small"
                  onClick={() => setIsMapperModalOpen(true)}>
                  {localeTexts?.ConfigScreen?.Accordion?.button?.addText}
                </Button>
              </div>
              {isMapperModalOpen && (
                <MapperModal
                  handleMapperConfig={handleMapperConfig}
                  contentTypeOptions={contentTypeOptions?.filter?.(
                    (option) => !mapperEntries?.some?.(([ct]) => ct === option?.value)
                  )}
                  closeModal={() => setIsMapperModalOpen(false)}
                />
              )}
            </div>
          ) : (
            <div className="appConfigurationLoading">
              <FieldLabel version="v2" className="text-base text-gray-500" htmlFor="loading" testId="loading-text">
                {localeTexts?.ConfigScreen?.LoadingState?.title}
              </FieldLabel>
              <p className="text-gray-500">{localeTexts?.ConfigScreen?.LoadingState?.body}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AppConfigurationExtension;
