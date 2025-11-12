export const handleLocaleChangeEntry = async (
  entryContentTypeUid: string,
  contentTypeUid: string,
  appSdk: any,
  setData: React.Dispatch<React.SetStateAction<any[]>>,
  field: string,
  selectedLocale?: string,
  allLocales?: { label: string; value: string }[]
) => {
  try {
    const allLocalesData: Record<string, any> = {};

    if (allLocales && allLocales.length > 0) {
      const localePromises = allLocales.map(async (locale) => {
        try {
          try {
            const entry = await appSdk?.stack
              ?.ContentType?.(contentTypeUid)
              .Entry?.(entryContentTypeUid)
              ?.language(locale?.value)
              .fetch?.();

            if (entry && (entry[field] !== undefined || (entry.entry && entry.entry[field] !== undefined))) {
              return { locale: locale?.value, data: entry };
            }
          } catch (error) {
            console.error(`Error fetching entry for locale ${locale?.value}:`, error);
          }

          try {
            const queryResult = await appSdk?.stack
              ?.ContentType?.(contentTypeUid)
              .Entry.Query()
              ?.equalTo("uid", entryContentTypeUid)
              ?.language(locale?.value)
              .find?.();

            if (queryResult && queryResult.entries && queryResult.entries.length > 0) {
              return { locale: locale.value, data: queryResult.entries[0] };
            }
          } catch (queryError) {
            console.error(`Error with query for locale ${locale?.value}:`, queryError);
          }

          return { locale: locale?.value, data: null };
        } catch (error) {
          console.error(`Error fetching data for locale ${locale?.value}:`, error);
          return { locale: locale?.value, data: null };
        }
      });

      const results = await Promise.all(localePromises);

      results.forEach((result) => {
        if (result?.data) {
          allLocalesData[result?.locale] = result?.data;
        }
      });

      const selectedLocaleData =
        selectedLocale && allLocalesData[selectedLocale]
          ? allLocalesData[selectedLocale]
          : allLocalesData[Object?.keys(allLocalesData)[0]];

      if (selectedLocaleData) {
        setData(selectedLocaleData);
      }

      return {
        setData,
        allLocalesData,
      };
    } else if (selectedLocale) {
      try {
        const entry = await appSdk?.stack
          ?.ContentType?.(contentTypeUid)
          .Entry?.(entryContentTypeUid)
          ?.language(selectedLocale)
          .fetch?.();

        if (entry) {
          allLocalesData[selectedLocale] = entry;
          setData(entry);
          return {
            setData,
            allLocalesData,
          };
        }
      } catch (error) {
        console.error(`Error fetching entry for selected locale ${selectedLocale}:`, error);
      }

      try {
        const queryResult = await appSdk?.stack
          ?.ContentType?.(contentTypeUid)
          ?.Entry?.Query()
          ?.equalTo("uid", entryContentTypeUid)
          ?.language(selectedLocale)
          .find?.();

        if (queryResult && queryResult.entries && queryResult.entries.length > 0) {
          allLocalesData[selectedLocale] = queryResult.entries[0];
          setData(queryResult.entries[0]);
        } else {
          console.error("No entry found for the given content type and locale.");
        }
      } catch (queryError) {
        console.error(`Error with query for selected locale ${selectedLocale}:`, queryError);
      }

      return {
        setData,
        allLocalesData,
      };
    }

    return {
      setData,
      allLocalesData,
    };
  } catch (error) {
    console.error("Error in handleLocaleChangeEntry:", error);
    return {
      setData,
      allLocalesData: {},
    };
  }
};
