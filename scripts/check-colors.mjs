#!/usr/bin/env node
/**
 * Trava de cor genérica.
 *
 * O palette default do Tailwind está apagado em `src/styles/index.css`
 * (`--color-*: initial`), então `bg-blue-500` não gera CSS nenhum. O problema é
 * que o Tailwind ignora utilitário desconhecido em silêncio: a classe some do
 * CSS e o elemento fica sem cor, sem ninguém perceber.
 *
 * Este script transforma esse silêncio em erro de build. É o que sustenta a
 * regra do Style Guide de que toda cor vem de token — em vez de deixá-la como
 * convenção que se perde na terceira tela.
 *
 * Branco e preto continuam válidos: o design usa texto branco sobre o
 * gradiente ouro e preto translúcido no scrim dos modais.
 */

import { readdir, readFile } from "node:fs/promises"
import { join, relative } from "node:path"

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")
const SRC = join(ROOT, "src")

const SCALES = [
  "slate", "gray", "zinc", "neutral", "stone", "red", "orange", "amber",
  "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue",
  "indigo", "violet", "purple", "fuchsia", "pink", "rose",
]

const PREFIXES = [
  "bg", "text", "border", "ring", "fill", "stroke", "from", "to", "via",
  "divide", "shadow", "outline", "accent", "caret", "decoration", "placeholder",
]

const BANNED = new RegExp(
  `\\b(?:${PREFIXES.join("|")})-(?:${SCALES.join("|")})-\\d{2,3}\\b`,
  "g",
)

// Hex cru em componente. Todo hex do produto mora no arquivo de tokens, que é
// a única exceção — é justamente o papel dele.
const RAW_HEX = /#[0-9a-fA-F]{3,8}\b/g

const TOKENS_FILE = join(SRC, "styles", "index.css")

const EXTENSIONS = /\.(tsx?|jsx?|css)$/

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else if (EXTENSIONS.test(entry.name)) yield full
  }
}

const findings = []

for await (const file of walk(SRC)) {
  const isTokensFile = file === TOKENS_FILE
  const text = await readFile(file, "utf8")
  const lines = text.split(/\r?\n/)

  lines.forEach((line, i) => {
    if (isTokensFile || line.includes("check-colors-allow")) return

    for (const match of line.matchAll(BANNED)) {
      findings.push({ file, line: i + 1, found: match[0], why: "palette default do Tailwind" })
    }
    for (const match of line.matchAll(RAW_HEX)) {
      findings.push({ file, line: i + 1, found: match[0], why: "hex cru" })
    }
  })
}

if (findings.length > 0) {
  console.error("\nCor fora do sistema de design:\n")
  for (const f of findings) {
    console.error(`  ${relative(ROOT, f.file)}:${f.line}  ${f.found}  (${f.why})`)
  }
  console.error(
    `\n${findings.length} ocorrência(s). Use um token semântico ` +
      "(text-on-surface, bg-surface-container-low, text-danger, bg-gold-grad…).\n" +
      "Tokens novos entram em src/styles/index.css, o único arquivo que conhece hex.\n" +
      "Exceção pontual: comentar a linha com `check-colors-allow`.\n",
  )
  process.exit(1)
}

console.log("check-colors: nenhuma cor fora do sistema de design.")
