import { useMemo } from "react";
import { get, isEmpty, keys } from "lodash";
import { useAppSdk } from "./useAppSdk";
import ContentstackAppSDK from "@contentstack/app-sdk";

interface Location {
  [key: string]: any;
}

/**
 * Returns the location name (eg: CustomField) and the location instance from the SDK
 * based on active location
 * @return {locationName, location}
 */
export const useAppLocation = (): { locationName: string; location: any } => {
  const appSdk = useAppSdk() as ContentstackAppSDK;
  const locations = useMemo(() => {
    const loc = (appSdk as any).location as Location;
    return keys(loc);
  }, [appSdk]);

  /**
   * memoized locationName and location instance
   */
  const { locationName, location } = useMemo(() => {
    let locationName = "";
    let location = null;

    for (let i = 0; i < locations.length; i++) {
      if (!isEmpty(get(appSdk, `location.${locations[i]}`, undefined))) {
        locationName = locations[i];
        location = get((appSdk as any).location as Location, locationName);
        break;
      }
    }

    return { locationName, location };
  }, [appSdk, locations]);

  return { locationName, location };
};
