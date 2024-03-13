# simplelang

The goal of this repo is to demonstrate how to create an interpreter for a simple programming language with minimal grammar in around 300 lines. This can be improved on later by expanding the grammar, but the basic building blocks of lexing, parsing, and AST traversal are here.

This small interpreter project is meant to be educational. Everyone should experience making their own programming language at one point!

This project was bootstraped with `Bun`.

## Grammar

```
<program> ::= <statement> |
              <statement> <program>

<statement> ::= <var-decl> ";" |
                <print-statement> ";"

<var-decl> ::= "let" <identifier> "=" <number>
<print-statement> ::= "print" "(" <identifier> ")"

<identifier> ::= <letter> |
                 <identifier> <letter> |
                 <identifier> <digit>

<number> ::= <digit> |
             <number> <digit>

<digit> ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<letter> ::= "a" | "b" | "c" | ... | "z" | "A" | "B" | "C" | ... | "Z"
```
