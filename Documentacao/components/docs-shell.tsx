import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import type { ReactNode } from "react";

export interface TocItem {
  title: string;
  url: string;
  depth?: number;
}

export function DocsShell({
  title,
  description,
  toc,
  children,
}: {
  title: string;
  description: string;
  toc?: TocItem[];
  children: ReactNode;
}) {
  return (
    <DocsPage
      toc={toc as never}
      tableOfContent={{
        style: "clerk",
      }}
      full={false}
    >
      <DocsTitle>{title}</DocsTitle>
      <DocsDescription>{description}</DocsDescription>
      <DocsBody>{children}</DocsBody>
    </DocsPage>
  );
}
