import rootConfigScreen from "./ConfigScreen";
import { TypeRootConfig } from "../common/types";

// <--------- CONFIG SCREEN FUNCTIONS ---------->

const configureConfigScreen = rootConfigScreen?.configureConfigScreen;

const customConfigComponent = rootConfigScreen?.customConfigComponent;

const customWholeJson = rootConfigScreen?.customWholeJson;

const checkConfigValidity = rootConfigScreen?.checkConfigValidity;

const rootConfig: TypeRootConfig = {
  configureConfigScreen,
  customConfigComponent,
  customWholeJson,
  // checkConfigValidity,
};

export default rootConfig;
