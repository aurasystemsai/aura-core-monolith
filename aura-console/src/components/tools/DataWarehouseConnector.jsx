import React from "react";
import ConnectAccount from "./ConnectAccount.jsx";

export default function DataWarehouseConnector() {
  return <ConnectAccount api="/api/data-warehouse-connector" title="Data Warehouse Connector" />;
}
