const programInput = `
  let x = 69;
  let y = 420;
  print(x);
  print(1337);
  print(y);
`

type TokenType =
  | 'LET'
  | 'IDENTIFIER'
  | 'EQ'
  | 'NUMBER'
  | 'PRINT'
  | 'LPAREN'
  | 'RPAREN'
  | 'SEMICOL'
  | 'EOF'

type Token = {
  type: TokenType
  value: string
}

function createToken({ value, type }: { value: string; type: TokenType }): Token {
  return { value, type } as Token
}

const ASCII_CODE = {
  a: 'a'.charCodeAt(0),
  A: 'A'.charCodeAt(0),
  z: 'z'.charCodeAt(0),
  Z: 'Z'.charCodeAt(0),
  _: '_'.charCodeAt(0),
  '0': '0'.charCodeAt(0),
  '9': '9'.charCodeAt(0)
} as const

function isLetter(ch: string): boolean {
  const charCode = ch.charCodeAt(0)
  return (
    (ASCII_CODE.a <= charCode && charCode <= ASCII_CODE.z) ||
    (ASCII_CODE.A <= charCode && charCode <= ASCII_CODE.Z) ||
    ASCII_CODE._ === charCode
  )
}

function isDigit(ch: string): boolean {
  const charCode = ch.charCodeAt(0)
  return ASCII_CODE[0] <= charCode && charCode <= ASCII_CODE[9]
}

const keywords = {
  let: createToken({ value: 'let', type: 'LET' }),
  print: createToken({ value: 'print', type: 'PRINT' })
}

function lookupIdent(ident: string): TokenType {
  const keyword = keywords?.[ident as keyof typeof keywords]
  if (keyword) {
    return keyword.type
  }
  return 'IDENTIFIER'
}

function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n'
}

class Lexer {
  private program: string

  constructor(program: string) {
    this.program = program
  }

  public tokenize(): Token[] {
    const tokens: Token[] = []
    for (let idx = 0; idx < this.program.length; idx++) {
      let token: Token
      const currentChar = this.program[idx]

      if (isWhitespace(currentChar)) {
        continue
      }

      switch (currentChar) {
        case '=':
          token = createToken({ value: '=', type: 'EQ' })
          tokens.push(token)
          break
        case '(':
          token = createToken({ value: '(', type: 'LPAREN' })
          tokens.push(token)
          break
        case ')':
          token = createToken({ value: ')', type: 'RPAREN' })
          tokens.push(token)
          break
        case ';':
          token = createToken({ value: ';', type: 'SEMICOL' })
          tokens.push(token)
          break
        case '':
          token = createToken({ value: '', type: 'EOF' })
          tokens.push(token)
          break
        default:
          if (isLetter(currentChar)) {
            let identifier = currentChar
            idx++ // Move to the next character

            while (
              idx < this.program.length &&
              (isLetter(this.program[idx]) ||
                isDigit(this.program[idx]) ||
                this.program[idx] === '_')
            ) {
              identifier += this.program[idx]
              idx++
            }

            const type = lookupIdent(identifier)
            token = createToken({ type, value: identifier })
            tokens.push(token)

            idx--
            break
          }

          if (isDigit(currentChar)) {
            let digit = currentChar
            idx++

            while (idx < this.program.length && isDigit(this.program[idx])) {
              digit += this.program[idx]
              idx++
            }

            token = createToken({ value: digit, type: 'NUMBER' })
            tokens.push(token)

            idx--
            break
          }

          throw new Error(`Unexpected, found ${currentChar}`)
      }
    }

    const token: Token = createToken({ value: '', type: 'EOF' })
    tokens.push(token)
    return tokens
  }
}

type ASTNode = VariableDeclarationNode | PrintStatementNode

type VariableDeclarationNode = {
  type: 'VariableDeclaration'
  identifier: string
  value: number
}

type PrintContent = IdentifierNode | NumberNode

type IdentifierNode = {
  type: 'IDENTIFIER'
  value: string
}

type NumberNode = {
  type: 'NUMBER'
  value: number
}

type PrintStatementNode = {
  type: 'PrintStatement'
  content: IdentifierNode | NumberNode
}

class Parser {
  private tokens: Token[]
  private currentTokenIdx: number = 0

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  private getCurrentToken(): Token {
    return this.tokens[this.currentTokenIdx]
  }

  private advanceToken(): void {
    this.currentTokenIdx++
  }

  private expectAndAdvanceToken(expectedType: TokenType): Token {
    const token = this.getCurrentToken()
    if (token.type !== expectedType) {
      throw new Error(`Expected token type ${expectedType}, found ${token.type}`)
    }
    this.advanceToken()
    return token
  }

  private parseVariableDeclaration(): VariableDeclarationNode {
    this.expectAndAdvanceToken('LET')
    const identifierToken = this.expectAndAdvanceToken('IDENTIFIER')
    this.expectAndAdvanceToken('EQ')
    const numberToken = this.expectAndAdvanceToken('NUMBER')
    this.expectAndAdvanceToken('SEMICOL')

    return {
      type: 'VariableDeclaration',
      identifier: identifierToken.value,
      value: parseInt(numberToken.value)
    }
  }

  private parsePrintStatement(): PrintStatementNode {
    this.expectAndAdvanceToken('PRINT')
    this.expectAndAdvanceToken('LPAREN')

    const nextToken = this.getCurrentToken()
    let content: PrintContent

    if (nextToken.type === 'IDENTIFIER') {
      content = { type: 'IDENTIFIER', value: nextToken.value }
      this.advanceToken()
    } else if (nextToken.type === 'NUMBER') {
      content = { type: 'NUMBER', value: parseInt(nextToken.value) }
      this.advanceToken()
    } else {
      throw new Error('Expected identifier or number in print statement')
    }

    this.expectAndAdvanceToken('RPAREN')
    this.expectAndAdvanceToken('SEMICOL')

    return {
      type: 'PrintStatement',
      content
    }
  }

  parse(): ASTNode[] {
    const nodes: ASTNode[] = []
    while (this.getCurrentToken().type !== 'EOF') {
      const tokenType = this.getCurrentToken().type
      let node: ASTNode

      if (tokenType === 'LET') {
        node = this.parseVariableDeclaration()
      } else if (tokenType === 'PRINT') {
        node = this.parsePrintStatement()
      } else {
        throw new Error(`Unexpected token type: ${tokenType}`)
      }

      nodes.push(node)
    }
    return nodes
  }
}

function analyzeAst(ast: ASTNode[]): void {
  const globalMemory: Map<string, number> = new Map()
  for (let idx = 0; idx < ast.length; idx++) {
    const currentNode = ast[idx]
    if (currentNode.type === 'VariableDeclaration') {
      const variableName = currentNode.identifier
      const variableValue = currentNode.value
      globalMemory.set(variableName, variableValue)
    } else if (currentNode.type === 'PrintStatement') {
      const isLiteral = currentNode.content.type === 'NUMBER'
      if (isLiteral) {
        const value = currentNode.content.value
        console.log(value)
        continue
      }

      const variableName = currentNode.content.value as string
      if (!globalMemory.has(variableName)) {
        throw new Error(`${variableName} is not defined.`)
      }

      const value = globalMemory.get(variableName)
      console.log(value)
    }
  }
}

const lexer = new Lexer(programInput)
const tokens = lexer.tokenize()

const parser = new Parser(tokens)

const ast = parser.parse()
analyzeAst(ast)
