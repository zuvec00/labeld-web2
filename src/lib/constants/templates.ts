import { Template } from "@/lib/models/site-customization";
import { STOREFRONT_TEMPLATE_MANIFEST } from "./storefront-template-manifest";

export const AVAILABLE_TEMPLATES = STOREFRONT_TEMPLATE_MANIFEST as unknown as Template[];
