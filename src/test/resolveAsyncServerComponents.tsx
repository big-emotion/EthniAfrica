import React from "react";

/**
 * Resolve async Server Component functions before handing their tree to
 * jsdom. Next.js owns that resolution in production; React DOM deliberately
 * rejects async components because it treats every test render as a client
 * render.
 */
// @req REQ-019 @req REQ-054 @req REQ-097
export async function resolveAsyncServerComponents(
  node: React.ReactNode
): Promise<React.ReactNode> {
  if (Array.isArray(node)) {
    return Promise.all(node.map(resolveAsyncServerComponents));
  }
  if (!React.isValidElement(node)) {
    return node;
  }

  const type = node.type;
  if (typeof type === "function" && type.constructor.name === "AsyncFunction") {
    const asyncType = type as (props: never) => Promise<React.ReactNode>;
    const resolved = await asyncType(node.props as never);
    return resolveAsyncServerComponents(resolved);
  }

  const props = node.props as { children?: React.ReactNode };
  if (!("children" in props)) {
    return node;
  }

  const children = await resolveAsyncServerComponents(props.children);
  return React.cloneElement(node, undefined, children);
}
