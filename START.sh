#!/bin/bash

set -e

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║     FieldVision — Claude Code Builder (2026)         ║"
echo "║   RN 0.84 · TS 6 · TurboModules · Zustand 5         ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Verificar PROMPT.md
if [ ! -f "PROMPT.md" ]; then
  echo "❌  PROMPT.md no encontrado. Ejecuta desde la carpeta correcta."
  exit 1
fi

echo "✅  Claude Code: $(claude --version 2>/dev/null || echo 'instalado')"
echo "✅  Node.js: $(node --version)"
echo "✅  Directorio: $(pwd)"
echo ""
echo "📁  Archivos de entrada:"
ls -1 *.md 2>/dev/null
ls -1 docs/*.md 2>/dev/null || echo "  (no hay docs/ aún)"
echo ""
echo "🚀  Iniciando construcción..."
echo "    Stack: RN 0.84 + TS 6 + TurboModules + Zustand 5 + TanStack Query v5"
echo "    Puede tomar 15-25 minutos. No interrumpas."
echo ""
echo "────────────────────────────────────────────────────────"
echo ""

claude \
  --dangerously-skip-permissions \
  --max-turns 200 \
  "$(cat PROMPT.md)"

echo ""
echo "────────────────────────────────────────────────────────"
echo ""

if [ -f "fieldvision/BUILD_COMPLETE.md" ]; then
  echo "✅  Build completado."
  echo ""
  echo "Para correr:"
  echo "  cd fieldvision"
  echo "  npm start               # Terminal 1"
  echo "  npx react-native run-ios  # Terminal 2"
  echo ""
  cat fieldvision/BUILD_COMPLETE.md
elif [ -f "fieldvision/BUILD_LOG.md" ]; then
  echo "⚠️  Build con advertencias. Revisa fieldvision/BUILD_LOG.md"
else
  echo "⚠️  BUILD_COMPLETE.md no encontrado. Revisa si existe ./fieldvision/"
fi
