import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import AppConfigContext from "../contexts/AppConfigContext";
import rootConfig from "../../root_config";
import { TypeAppSdkConfigState } from "../types";
import useAppLocation from "../useAppLocation";
import localeTexts from "../locales/en-us/index";
import ConfigScreenUtils from "../utils/ConfigScreenUtils";

const AppConfigProvider: React.FC<React.PropsWithChildren<{}>> = function ({ children }) {
  const configInputFields = rootConfig?.configureConfigScreen?.();
  const { saveInConfig, saveInServerConfig } = ConfigScreenUtils.getSaveConfigOptions(configInputFields);
  const { jsonOptions, defaultFeilds, customJsonConfigObj } = ConfigScreenUtils.configRootUtils();

  // ref for managing the save button disable state
  const appConfig = useRef<any>();

  const { location } = useAppLocation();

  // state for error handling of empty field values
  const [errorState, setErrorState] = useState<any>([]);
  // state for configuration
  const [installation, setInstallation] = React.useState<TypeAppSdkConfigState>({
    configuration: {
      /* Add all your config fields here */
      /* The key defined here should match with the name attribute
        given in the DOM that is being returned at last in this component */
      ...Object.keys(saveInConfig)?.reduce((acc, value) => {
        if (saveInConfig?.[value]?.type === "textInputFields") return { ...acc, [value]: "" };
        return {
          ...acc,
          [value]: saveInConfig?.[value]?.defaultSelectedOption || "",
        };
      }, {}),
      ...customJsonConfigObj,
    },
    /* Use ServerConfiguration Only When Webhook is Enbaled */
    serverConfiguration: {
      ...Object.keys(saveInServerConfig)?.reduce((acc, value) => {
        if (saveInServerConfig?.[value]?.type === "textInputFields") return { ...acc, [value]: "" };
        return {
          ...acc,
          [value]: saveInServerConfig?.[value]?.defaultSelectedOption || "",
        };
      }, {}),
    },
  });

  useEffect(() => {
    if (location) {
      const sdkConfigData = location?.installation;
      appConfig.current = sdkConfigData;

      if (sdkConfigData) {
        sdkConfigData
          .getInstallationData()
          .then((installationDataFromSDK: TypeAppSdkConfigState) => {
            const installationDataOfSdk = ConfigScreenUtils.mergeObjects(installation, installationDataFromSDK);
            setInstallation(installationDataOfSdk);
            // Call checkConfigFields only when receiving installation data
            // This prevents the infinite update loop
            const skipKeys = ["dam_keys", "is_custom_json", "keypath_options"];
            const missingValues: string[] = [];

            // Check if mapper exists and has valid entries
            if (installationDataOfSdk.configuration?.mapper) {
              const mapperEntries = Object.entries(installationDataOfSdk.configuration.mapper);

              if (mapperEntries.length === 0) {
                missingValues.push("mapper");
              } else {
                // Check if any content type has no fields selected
                const hasEmptySelection = mapperEntries.some(([key, value]: [string, any]) => {
                  return !value || (Array.isArray(value) && value.length === 0);
                });

                if (hasEmptySelection) {
                  missingValues.push("mapper");
                }
              }
            } else {
              missingValues.push("mapper");
            }

            // Check other configuration and server configuration
            Object.entries({
              ...installationDataOfSdk.configuration,
              ...installationDataOfSdk.serverConfiguration,
            })?.forEach(([key, value]: any) => {
              if (!skipKeys?.includes(key) && key !== "mapper") {
                if (
                  !value ||
                  (Array.isArray(value) && !value?.length) ||
                  (!Array.isArray(value) && typeof value === "object" && !Object.keys(value)?.length)
                ) {
                  missingValues?.push(key);
                }
              }
            });

            setErrorState(missingValues);

            if (missingValues?.length) {
              appConfig?.current?.setValidity(false, {
                message: "Please fill in all required fields",
              });
            } else {
              appConfig?.current?.setValidity(true);
            }
          })
          .catch((err: Error) => {
            console.error(err);
          });
      }
    }
  }, [location]);

  // Redefine checkConfigFields to use the current installation data from useCallback arguments
  // instead of relying on state which can cause update loops
  const checkConfigFields = useCallback(({ configuration, serverConfiguration }: any) => {
    const skipKeys = ["dam_keys", "is_custom_json", "keypath_options"];
    const missingValues: string[] = [];

    // Check if mapper exists and has valid entries
    if (configuration?.mapper) {
      const mapperEntries = Object.entries(configuration.mapper);

      if (mapperEntries.length === 0) {
        missingValues.push("mapper");
      } else {
        // Check if any content type has no fields selected
        const hasEmptySelection = mapperEntries.some(([key, value]: [string, any]) => {
          return !value || (Array.isArray(value) && value.length === 0);
        });

        if (hasEmptySelection) {
          missingValues.push("mapper");
        }
      }
    } else {
      missingValues.push("mapper");
    }

    // Check other configuration and server configuration
    Object.entries({
      ...configuration,
      ...serverConfiguration,
    })?.forEach(([key, value]: any) => {
      if (!skipKeys?.includes(key) && key !== "mapper") {
        if (
          !value ||
          (Array.isArray(value) && !value?.length) ||
          (!Array.isArray(value) && typeof value === "object" && !Object.keys(value)?.length)
        ) {
          missingValues?.push(key);
        }
      }
    });

    setErrorState(missingValues);

    if (missingValues?.length) {
      appConfig?.current?.setValidity(false, {
        message: "Please fill in all required fields",
      });
    } else {
      appConfig?.current?.setValidity(true);
    }
  }, []);

  const setInstallationData = useCallback(
    async (data: { [key: string]: any }) => {
      const newInstallationData: TypeAppSdkConfigState = {
        ...installation,
        configuration: data?.configuration,
        serverConfiguration: data?.serverConfiguration,
      };
      await setInstallation(newInstallationData);
      await location?.installation?.setInstallationData(newInstallationData);
    },
    [location]
  );

  const StateContext = useMemo(
    () => ({
      errorState,
      installationData: installation,
      setInstallationData,
      appConfig,
      jsonOptions,
      defaultFeilds,
      saveInConfig,
      saveInServerConfig,
      checkConfigFields,
    }),
    [
      errorState,
      installation,
      setInstallationData,
      appConfig,
      jsonOptions,
      defaultFeilds,
      saveInConfig,
      saveInServerConfig,
      checkConfigFields,
    ]
  );

  return <AppConfigContext.Provider value={StateContext}>{children}</AppConfigContext.Provider>;
};
export default AppConfigProvider;
