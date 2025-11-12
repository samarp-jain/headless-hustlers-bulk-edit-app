import React from "react";
import { Icon, Notification } from "@contentstack/venus-components";

const toastMessage = ({ type, text }: any) => {
  Notification({
    notificationContent: {
      text,
    },
    notifyProps: {
      hideProgressBar: true,
    },
    type,
  });
};

const mapForSelectOption = (label: string, value: string) => {
  const result = {
    label,
    value,
  };
  return result;
};

const getPublishStatusEnv = (envId: string, stateEnvironments: any[]) => {
  const result = stateEnvironments?.find(({ uid }: any) => uid === envId);
  if (result) {
    return (
      <span>
        <Icon className="table-icon" icon="DefaultEnv" /> {result?.name}
      </span>
    );
  }
  return null;
};

const sortLocales = (LocalesArr: any[]) => {
  const sortedArr = [...LocalesArr]?.sort((a, b) => a?.name?.localeCompare(b?.name));
  const masterLocaleIndex = sortedArr?.findIndex((item: any) => item?.fallback_locale === null);
  const masterLocale = { ...sortedArr?.[masterLocaleIndex] };
  sortedArr?.splice(masterLocaleIndex, 1);
  sortedArr?.unshift(masterLocale);
  return sortedArr;
};

const localeDropdownData = (locales: any[], setDefaultLocale: Function) =>
  locales?.map((locale: any) => ({
    action: () => setDefaultLocale(locale?.code),
    default: locale?.fallback_locale === null,
    label: locale?.name,
    value: locale?.code,
  }));

const getLocaleName = (localeOptions: any[], defaultLocale: string) =>
  localeOptions?.find((item) => item?.value === defaultLocale)?.label;

const utils = {
  toastMessage,
  mapForSelectOption,
  getPublishStatusEnv,
  sortLocales,
  getLocaleName,
  localeDropdownData,
};

export default utils;
