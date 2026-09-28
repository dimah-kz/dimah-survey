import defaultMdxComponents from "fumadocs-ui/mdx";
import * as AccordionComponents from "fumadocs-ui/components/accordion";
import * as TabsComponents from "fumadocs-ui/components/tabs";
import * as CardComponents from "fumadocs-ui/components/card";
import * as StepsComponents from "fumadocs-ui/components/steps";
import { TypeTable } from "fumadocs-ui/components/type-table";
import { AutoTypeTable, type AutoTypeTableProps } from "fumadocs-typescript/ui";
import { Flow } from "@/components/flow";
import {
  DrizzleMark,
  KyselyMark,
  PrismaMark,
  StoreLinks,
} from "@/components/store-links";
import {
  typeTableBasePath,
  typeTableGeneratorFor,
} from "@/lib/type-table-generator";
import type { MDXComponents } from "mdx/types";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Flow,
    StoreLinks,
    DrizzleMark,
    PrismaMark,
    KyselyMark,
    ...AccordionComponents,
    ...TabsComponents,
    ...CardComponents,
    ...StepsComponents,
    TypeTable,
    AutoTypeTable: (props: Partial<AutoTypeTableProps>) => (
      <AutoTypeTable
        {...props}
        generator={typeTableGeneratorFor(props.path)}
        options={{ basePath: typeTableBasePath, ...props.options }}
      />
    ),
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
