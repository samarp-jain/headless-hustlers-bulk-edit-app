import React from "react";
import { KeyValueObj } from "../types";
import { Extension } from "typescript";

export type MarketplaceAppContextType = {
  appSdk: Extension | null;
  appConfig: KeyValueObj | null;
};

export const MarketplaceAppContext = React.createContext<MarketplaceAppContextType>({
  appSdk: null,
  appConfig: null,
});
