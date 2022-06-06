import * as t from '@babel/types';

/**
 * A callback function for a specific node type.
 */
export type VisitorFn<T extends t.Node = t.Node> = (
  node: T,
  parent?: t.Node
) => void;

/**
 * Callbacks for visiting AST nodes.
 */
export type Visitor = {
  [Type in t.Node['type']]?: VisitorFn<Extract<t.Node, { type: Type }>>;
};

type QueueItem = [parent: t.Node | undefined, node: t.Node];

/**
 * Traverse `ast` with `visitor`. Similar to `@babel/traverse` but much simpler.
 */
export function traverse(ast: t.File, visitor: Visitor): void {
  const queue: Array<QueueItem> = [[undefined, ast]];

  while (queue.length) {
    const next = queue.shift();

    if (next) {
      const [parent, node] = next;
      const { type } = node;

      if (type in visitor) {
        const visitorFn = visitor[type] as VisitorFn;
        visitorFn(node as t.Node, parent);
      }

      if (!(type in t.NODE_FIELDS)) {
        continue;
      }

      const fields = Object.keys(t.NODE_FIELDS[type]);

      for (const field of fields) {
        const value = node[field];

        if (Array.isArray(value)) {
          queue.push(...value.map<QueueItem>((child) => [node, child]));
        } else if (value) {
          queue.push([node, value]);
        }
      }
    }
  }
}
