# Development Guidelines

## Configuración de Desarrollo

### Backend Development

1. Instalar herramientas de desarrollo:
```bash
pip install pytest pytest-cov black flake8 mypy
```

2. Ejecutar tests:
```bash
pytest
```

3. Formatear código:
```bash
black app/
```

4. Verificar tipos:
```bash
mypy app/
```

### Frontend Development

1. Linting:
```bash
npm run lint
```

2. Type checking:
```bash
npm run type-check
```

3. Build:
```bash
npm run build
```

## Estructura de Commits

Usar conventional commits:
- `feat:` Nueva característica
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Cambios de formato
- `refactor:` Refactorización de código
- `perf:` Mejoras de performance
- `test:` Agregar o actualizar tests

## Reglas de Código

### Backend (Python)
- Usar type hints
- Máximo 100 caracteres por línea
- Docstrings en funciones públicas
- Validación con Pydantic

### Frontend (TypeScript)
- Componentes funcionales con hooks
- Props con interfaces tipadas
- Máximo 80 caracteres por línea
- Error handling explícito
