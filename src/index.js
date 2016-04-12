type Config<Node, Token> = {
  ast: Node,
  traverse: (node: Node, iterator: (node: Node, parent: ?Node) => void) => void,
  isSemicolonToken: (token: Token) => boolean,
  lastTokenOfNode: (node: Node) => Token,
  tokenAfterToken: (token: Token) => ?Token,
  sourceOfToken: (token: Token) => string,
  insert: (index: number, content: string) => void,
  remove: (start: number, end: number) => void,
  startOfToken: (token: Token) => number,
  endOfToken: (token: Token) => number,
  startOfNode: (node: Node) => number,
  endOfNode: (node: Node) => number,
};

export default function process<Node, Token>(config: Config<Node, Token>) {
  let {
    ast,
    traverse,
    firstTokenOfNode,
    lastTokenOfNode,
    tokenAfterToken,
    sourceOfToken,
    insert,
    remove,
    startOfToken,
    endOfToken,
    startOfNode,
    endOfNode,
  } = config;

  traverse(ast, (node, parent) => {
    switch (node.type) {
      case 'VariableDeclaration':
        let isForInit = (
          parent &&
          (parent.type === 'ForStatement' && parent.init === node) ||
          (/^For(?:In|Of)Statement/.test(parent.type) && parent.left === node)
        );

        if (!isForInit) {
          checkForSemicolon(node);
        }
        break;

      case 'ExpressionStatement':
      case 'ReturnStatement':
      case 'ThrowStatement':
      case 'DoWhileStatement':
      case 'DebuggerStatement':
      case 'BreakStatement':
      case 'ContinueStatement':
      case 'ImportDeclaration':
      case 'ExportAllDeclaration':
        checkForSemicolon(node);
        break;

      case 'ExportNamedDeclaration':
        if (!node.declaration) {
          checkForSemicolon(node);
        }
        break;

      case 'ExportDefaultDeclaration':
        if (/(?:Class|Function)Declaration/.test(node.declaration.type)) {
          if (!node.declaration.id) {
            checkForSemicolon(node);
          }
        } else {
          checkForSemicolon(node);
        }
        break;

      case 'EmptyStatement':
        switch (parent.type) {
          case 'ForStatement':
          case 'ForOfStatement':
          case 'ForInStatement':
          case 'WhileStatement':
          case 'DoWhileStatement':
            // These are allowed to have empty statement bodies, for example.
            break;

          default:
            remove(startOfNode(node), endOfNode(node));
            break;
        }
        break;

      case 'ClassBody':
        checkClassBodyForSemicolon(tokenAfterToken(firstTokenOfNode(node)));
        break;

      case 'ClassMethod':
      case 'MethodDefinition':
        checkClassBodyForSemicolon(tokenAfterToken(lastTokenOfNode(node)));
        break;
    }
  });

  /**
   * Checks a node to see if it's followed by a semicolon.
   */
  function checkForSemicolon(node: Node) {
    var lastToken = lastTokenOfNode(node);

    if (sourceOfToken(lastToken) !== ';') {
      insert(endOfToken(lastToken), ';');
    }
  }

  /**
   * Class bodies don't need semicolons.
   */
  function checkClassBodyForSemicolon(token: Token) {
    while (token) {
      let source = sourceOfToken(token);

      if (source === ';') {
        remove(startOfToken(token), endOfToken(token));
      } else {
        break;
      }

      token = tokenAfterToken(token);
    }
  }
}
