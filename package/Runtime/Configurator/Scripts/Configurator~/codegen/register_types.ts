/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { ConfigurationElement } from "../ConfigurationElement.js";
import { Configurator } from "../Configurator.js";
import { ConfiguratorControls } from "../ConfiguratorControls.js";
import { MaterialConfigurator } from "../MaterialConfigurator.js";
import { ObjectConfigurator } from "../ObjectConfigurator.js";
import { SyncConfiguratorTransform } from "../SyncConfiguratorTransform.js";

// Register types
TypeStore.add("ConfigurationElement", ConfigurationElement);
TypeStore.add("Configurator", Configurator);
TypeStore.add("ConfiguratorControls", ConfiguratorControls);
TypeStore.add("MaterialConfigurator", MaterialConfigurator);
TypeStore.add("ObjectConfigurator", ObjectConfigurator);
TypeStore.add("SyncConfiguratorTransform", SyncConfiguratorTransform);
