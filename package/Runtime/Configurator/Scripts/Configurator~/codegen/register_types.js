import { TypeStore } from "@needle-tools/engine"

// Import types
import { ConfigurationElement } from "../ConfigurationElement";
import { Configurator } from "../Configurator";
import { ConfiguratorControls } from "../ConfiguratorControls";
import { MaterialConfigurator } from "../MaterialConfigurator";
import { MaterialPropertyConfigurator } from "../MaterialPropertyConfigurator";
import { ObjectConfigurator } from "../ObjectConfigurator";
import { SyncConfiguratorTransform } from "../SyncConfiguratorTransform";
import { ColorPropertyModule } from "../Material-property-modules/ColorPropertyModule";
import { PropertyModule } from "../Material-property-modules/PropertyModule";
import { TexturePropertyModule } from "../Material-property-modules/TexturePropertyModule";

// Register types
TypeStore.add("ConfigurationElement", ConfigurationElement);
TypeStore.add("Configurator", Configurator);
TypeStore.add("ConfiguratorControls", ConfiguratorControls);
TypeStore.add("MaterialConfigurator", MaterialConfigurator);
TypeStore.add("MaterialPropertyConfigurator", MaterialPropertyConfigurator);
TypeStore.add("ObjectConfigurator", ObjectConfigurator);
TypeStore.add("SyncConfiguratorTransform", SyncConfiguratorTransform);
TypeStore.add("ColorPropertyModule", ColorPropertyModule);
TypeStore.add("PropertyModule", PropertyModule);
TypeStore.add("TexturePropertyModule", TexturePropertyModule);
