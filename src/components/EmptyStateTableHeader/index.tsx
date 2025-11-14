import React from "react";
import { EmptyState } from "@contentstack/venus-components";
import "./styles.scss";

function EmptyStateTableHeader({
  heading,
  description,
  moduleIcon,
  customClass,
}: any) {
  return (
    <EmptyState
      heading={heading}
      headingType="large"
      moduleIcon={moduleIcon}
      description={description}
      className={customClass}
    />
  );
}

export default EmptyStateTableHeader;
