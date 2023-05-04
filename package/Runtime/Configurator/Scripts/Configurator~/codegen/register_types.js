import { TypeStore } from "@needle-tools/engine"

// Import types
import { ConfigurationElement } from "../ConfigurationElement";
import { Configurator } from "../Configurator";
import { ConfiguratorControls } from "../ConfiguratorControls";
import { MaterialConfigurator } from "../MaterialConfigurator";
import { ObjectConfigurator } from "../ObjectConfigurator";
import { SyncConfiguratorTransform } from "../SyncConfiguratorTransform";

// Register types
TypeStore.add("ConfigurationElement", ConfigurationElement);
TypeStore.add("Configurator", Configurator);
TypeStore.add("ConfiguratorControls", ConfiguratorControls);
TypeStore.add("MaterialConfigurator", MaterialConfigurator);
TypeStore.add("ObjectConfigurator", ObjectConfigurator);
TypeStore.add("SyncConfiguratorTransform", SyncConfiguratorTransform);
