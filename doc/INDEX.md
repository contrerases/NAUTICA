# 📚 Documentación - Náutica Jornada

Este directorio contiene toda la documentación del proyecto.

---

## 📖 Índice de Documentos

### 1. **README.md** - Documentación Principal
Funcionalidades, épicas, historias de usuario, roadmap de desarrollo y stack tecnológico.

- Visión general del proyecto
- Funcionalidades por épica (7 épicas)
- DevOps y stack completo
- Estructura base del proyecto
- Roadmap de fases (v0.1 a v1.0)

**Leer primero para entender qué hace la app.**

---

### 2. **LOGICA_NEGOCIO.md** - Especificación Técnica ⭐
**CRÍTICO:** Toda la lógica de negocio, reglas de cálculo, validaciones y estados.

- Configuración global (horarios, tolerancia)
- Gestión de trabajadores (RUT, soft delete, auditoría)
- Flujo de marcaje y estados
- Cálculo de jornada y pagos
- Colación (30 min flexible)
- Atrasos y horas extras
- Jornadas pendientes y cierre manual
- Validaciones (RUT con módulo 11, dígito verificador)
- Ejemplos de código

**LEER ANTES DE CODIFICAR.**

---

### 3. **README_DEV.md** - Guía del Desarrollador
Setup, estructura, scripts, configuración de TypeScript, comunicación IPC.

- Instalación y requisitos
- Estructura completa del proyecto
- Scripts disponibles
- Base de datos (ubicación, migraciones)
- Configuración de TypeScript (2 tsconfig)
- Aliases de importación
- Tailwind CSS (utilidades)
- Comunicación IPC (ejemplos)
- Estado actual y próximos pasos
- Debugging y troubleshooting

**LEER cuando necesites levantar el proyecto o entender la arquitectura.**

---

### 4. **DIRECTORIO_PROYECTO.md** - Estructura Planeada
Árbol completo de directorios y archivos del proyecto (para referencia).

---

## 🚀 Flujo de Lectura Recomendado

Para nuevos desarrolladores:

1. **README.md** (5 min) → Entender qué hace el proyecto
2. **LOGICA_NEGOCIO.md** (20 min) → Aprender las reglas de negocio
3. **README_DEV.md** (10 min) → Setup y cómo correr el código
4. **DIRECTORIO_PROYECTO.md** (2 min) → Referencia rápida

---

## 📝 Actualizaciones Importantes

- **Última actualización:** 2026-04-01
- **Versión:** v0.1 en progreso
- **Base de datos:** Schema completo con snapshots históricos
- **Dependencias:** sql.js + bcryptjs (sin compilación nativa)

---

**Para consultas, revisar primero LOGICA_NEGOCIO.md 🎯**
