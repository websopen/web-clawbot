# ⚠️ Librerías eliminadas para liberar espacio

**Fecha:** 2026-04-23
**Motivo:** El disco principal estaba al 100%. Se eliminaron `node_modules` y/o `.venv` regenerables.

## Para restaurar este proyecto

### Si es un proyecto Node.js:
```bash
npm install
```

### Si es un proyecto Python con .venv:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Configuración global de librerías
Las librerías globales (`.nvm`, `.npm`, `.gradle`, `android-sdk`, `.pub-cache`, `.deno`) están en `/mnt/data/libs/` con symlinks en `~/`.
**Antes de trabajar, asegurar que la partición esté montada:**
```bash
sudo mount /dev/nvme0n1p3 /mnt/data
```
