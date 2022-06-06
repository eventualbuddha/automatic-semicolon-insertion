import * as t from '@babel/types';
import { strict as assert } from 'assert';
import { traverse } from './traverse.js';

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

/**
 * Process a source code string and its AST to produce source code insertions
 * and removals.
 */
export function process(source: string, ast: t.File): Changes {
  assert(
    ast.tokens,
    `ast must include .tokens property; pass { tokens: true } to babel.parse`
  );
  const tokens: Array<Token> = ast.tokens;
  const insertions: Array<Insertion> = [];
  const removals: Array<Removal> = [];

  traverse(ast, {
    VariableDeclaration(node: t.VariableDeclaration, parent?: t.Node): void {
      const isForInit =
        (t.isForStatement(parent) && parent.init === node) ||
        ((t.isForInStatement(parent) || t.isForOfStatement(parent)) &&
          parent.left === node);

      if (!isForInit) {
        checkForSemicolon(node);
      }
    },

    ExpressionStatement(node: t.ExpressionStatement): void {
      checkForSemicolon(node);
    },

    ReturnStatement(node: t.ReturnStatement): void {
      checkForSemicolon(node);
    },

    ThrowStatement(node: t.ThrowStatement): void {
      checkForSemicolon(node);
    },

    DoWhileStatement(node: t.DoWhileStatement): void {
      checkForSemicolon(node);
    },

    DebuggerStatement(node: t.DebuggerStatement): void {
      checkForSemicolon(node);
    },

    BreakStatement(node: t.BreakStatement): void {
      checkForSemicolon(node);
    },

    ContinueStatement(node: t.ContinueStatement): void {
      checkForSemicolon(node);
    },

    ImportDeclaration(node: t.ImportDeclaration): void {
      checkForSemicolon(node);
    },

    ExportAllDeclaration(node: t.ExportAllDeclaration): void {
      checkForSemicolon(node);
    },

    ExportNamedDeclaration(node: t.ExportNamedDeclaration): void {
      if (!node.declaration) {
        checkForSemicolon(node);
      }
    },

    ExportDefaultDeclaration(node: t.ExportDefaultDeclaration): void {
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

    EmptyStatement(node: t.EmptyStatement, parent?: t.Node): void {
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

    ClassBody(node: t.ClassBody): void {
      checkClassBodyForSemicolon(tokenAfterToken(firstTokenOfNode(node)));
    },

    ClassMethod(node: t.ClassMethod): void {
      checkClassBodyForSemicolon(tokenAfterToken(lastTokenOfNode(node)));
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
