import React, { Suspense } from "react";
import { MarketplaceAppProvider } from "../../common/providers/MarketplaceAppProvider";
import { HashRouter, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import ConfigLoader from "../../components/Loaders/configLoader";
import AppConfigProvider from "../../common/providers/AppConfigProvider";

/**
 * All the routes are Lazy loaded.
 * This will ensure the bundle contains only the core code and respective route bundle
 * improving the page load time
 */
const AppConfigurationExtension = React.lazy(() => import("../AppConfiguration/AppConfiguration"));
const FullPageExtension = React.lazy(() => import("../FullPage/FullPage"));
const PageNotFound = React.lazy(() => import("../404/404"));
const DefaultPage = React.lazy(() => import("../index"));

function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <MarketplaceAppProvider>
          <Routes>
            <Route path="/" element={<DefaultPage />} />

            <Route
              path="/app-configuration"
              element={
                <Suspense fallback={<ConfigLoader />}>
                  <AppConfigProvider>
                    <AppConfigurationExtension />
                  </AppConfigProvider>
                </Suspense>
              }
            />

            <Route
              path="/full-page"
              element={
                <Suspense fallback={<ConfigLoader />}>
                  <FullPageExtension />
                </Suspense>
              }
            />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </MarketplaceAppProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}

export default App;
