import { strict as assert } from 'assert';
import * as t from '@babel/types';
import traverse, { NodePath } from '@babel/traverse';

// This should be defined in `@babel/types` but isn't.
export interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
  loc: t.SourceLocation;
}

export interface TokenType {
  label: string;
  keyword?: string;
  beforeExpr: boolean;
  startsExpr: boolean;
  rightAssociative: boolean;
  isLoop: boolean;
  isAssign: boolean;
  prefix: boolean;
  postfix: boolean;
  binop: number | null;
  updateContext: Function | null;
}

export interface Insertion {
  index: number;
  content: string;
}

export interface Removal {
  start: number;
  end: number;
}

export interface Changes {
  insertions: Array<Insertion>;
  removals: Array<Removal>;
}

export default function process(source: string, ast: t.File): Changes {
  assert(
    ast.tokens,
    `ast must include .tokens property; pass { tokens: true } to babel.parse`
  );
  const tokens: Array<Token> = ast.tokens;
  const insertions: Array<Insertion> = [];
  const removals: Array<Removal> = [];

  traverse(ast, {
    VariableDeclaration(path: NodePath<t.VariableDeclaration>): void {
      const { node, parent } = path;
      const isForInit =
        (t.isForStatement(parent) && parent.init === node) ||
        ((t.isForInStatement(parent) || t.isForOfStatement(parent)) &&
          parent.left === node);

      if (!isForInit) {
        checkForSemicolon(node);
      }
    },

    ExpressionStatement(path: NodePath<t.ExpressionStatement>): void {
      checkForSemicolon(path.node);
    },

    ReturnStatement(path: NodePath<t.ReturnStatement>): void {
      checkForSemicolon(path.node);
    },

    ThrowStatement(path: NodePath<t.ThrowStatement>): void {
      checkForSemicolon(path.node);
    },

    DoWhileStatement(path: NodePath<t.DoWhileStatement>): void {
      checkForSemicolon(path.node);
    },

    DebuggerStatement(path: NodePath<t.DebuggerStatement>): void {
      checkForSemicolon(path.node);
    },

    BreakStatement(path: NodePath<t.BreakStatement>): void {
      checkForSemicolon(path.node);
    },

    ContinueStatement(path: NodePath<t.ContinueStatement>): void {
      checkForSemicolon(path.node);
    },

    ImportDeclaration(path: NodePath<t.ImportDeclaration>): void {
      checkForSemicolon(path.node);
    },

    ExportAllDeclaration(path: NodePath<t.ExportAllDeclaration>): void {
      checkForSemicolon(path.node);
    },

    ExportNamedDeclaration(path: NodePath<t.ExportNamedDeclaration>): void {
      if (!path.node.declaration) {
        checkForSemicolon(path.node);
      }
    },

    ExportDefaultDeclaration(path: NodePath<t.ExportDefaultDeclaration>): void {
      const { node } = path;
      const { declaration } = node;

      if (
        t.isClassDeclaration(declaration) ||
        t.isFunctionDeclaration(declaration)
      ) {
        if (!declaration.id) {
          checkForSemicolon(node);
        }
      } else {
        checkForSemicolon(node);
      }
    },

    EmptyStatement(path: NodePath<t.EmptyStatement>): void {
      const { node, parent } = path;

      if (
        !t.isForStatement(parent) &&
        !t.isForOfStatement(parent) &&
        !t.isForInStatement(parent) &&
        !t.isWhileStatement(parent) &&
        !t.isDoWhileStatement(parent)
      ) {
        remove(startOfNode(node), endOfNode(node));
      }
    },

    ClassBody(path: NodePath<t.ClassBody>): void {
      checkClassBodyForSemicolon(tokenAfterToken(firstTokenOfNode(path.node)));
    },

    ClassMethod(path: NodePath<t.ClassMethod>): void {
      checkClassBodyForSemicolon(tokenAfterToken(lastTokenOfNode(path.node)));
    },
  });

  return { insertions, removals };

  /**
   * Checks a node to see if it's followed by a semicolon.
   */
  function checkForSemicolon(node: t.Node) {
    const lastToken = lastTokenOfNode(node);

    if (sourceOfToken(lastToken) !== ';') {
      insert(endOfToken(lastToken), ';');
    }
  }

  /**
   * Class bodies don't need semicolons.
   */
  function checkClassBodyForSemicolon(token: Token) {
    while (token) {
      const source = sourceOfToken(token);

      if (source === ';') {
        remove(startOfToken(token), endOfToken(token));
      } else {
        break;
      }

      token = tokenAfterToken(token);
    }
  }

  function firstTokenOfNode(node: t.Node): Token {
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.start === node.start) {
        return token;
      }
    }
    throw new Error(
      `cannot find first token for node ${node.type} at ` +
        `${node.loc!.start.line}:${node.loc!.start.column + 1}`
    );
  }

  function lastTokenOfNode(node: t.Node): Token {
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.end === node.end) {
        return token;
      }
    }
    throw new Error(
      `cannot find last token for node ${node.type} at ` +
        `${node.loc!.start.line}:${node.loc!.start.column + 1}`
    );
  }

  function tokenAfterToken(token: Token): Token {
    const index = tokens.indexOf(token);
    if (index < 0) {
      throw new Error(`cannot find token in tokens: ${JSON.stringify(token)}`);
    }
    return tokens[index + 1];
  }

  function sourceOfToken(token: Token): string {
    return source.slice(token.start, token.end);
  }

  function insert(index: number, content: string): void {
    insertions.push({ index, content });
  }

  function remove(start: number, end: number): void {
    removals.push({ start, end });
  }

  function startOfNode(node: t.Node): number {
    return node.start!;
  }

  function endOfNode(node: t.Node): number {
    return node.end!;
  }

  function startOfToken(token: Token): number {
    return token.start;
  }

  function endOfToken(token: Token): number {
    return token.end;
  }
}
