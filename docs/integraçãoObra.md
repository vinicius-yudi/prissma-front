# Integração Frontend — Obras/Projects

## Stack & Base URL

- **Backend:** Java Spring Boot 3.x
- **Auth:** JWT via Bearer Token
- **Base URL:** `http://localhost:8080` (dev)

---

## Autenticação

Todo endpoint protegido exige o header:

```
Authorization: Bearer <token>
```

### Login

```http
POST /auth/login
Content-Type: application/json
```

```json
{
  "email": "user@email.com",
  "password": "senha"
}
```

**Resposta `200`:**
```json
{
  "token": "eyJ..."
}
```

### Outros endpoints de auth (públicos)

| Método | Path | Descrição |
|--------|------|-----------|
| POST | `/auth/forgot-password` | Solicitar redefinição de senha |
| POST | `/auth/reset-password` | Redefinir senha com token |

---

## Endpoints de Obras — `/projects`

### Criar projeto

```http
POST /projects
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "title": "Edifício Central",
  "address": "Rua das Flores, 123",
  "projectType": "RESIDENTIAL",
  "category": "BUILDING",
  "landArea": 500.00,
  "builtArea": 350.00,
  "status": "PLANNING",
  "plannedStartDate": "2025-01-01",
  "plannedEndDate": "2026-06-30"
}
```

> `status`, `plannedStartDate` e `plannedEndDate` são opcionais.

**Resposta `201`:** objeto do projeto criado (ver [Objeto Projeto](#objeto-projeto)).

---

### Listar projetos

```http
GET /projects
Authorization: Bearer {token}
```

**Resposta `200`:** array de [Objeto Projeto](#objeto-projeto).

---

### Buscar projeto por ID

```http
GET /projects/{id}
Authorization: Bearer {token}
```

**Resposta `200`:** [Objeto Projeto](#objeto-projeto).  
**Resposta `404`:** projeto não encontrado.

---

### Atualizar projeto (parcial)

```http
PATCH /projects/{id}
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "status": "IN_PROGRESS"
}
```

> Envie apenas os campos que devem ser alterados.

**Resposta `200`:** objeto atualizado.

---

### Deletar projeto

```http
DELETE /projects/{id}
Authorization: Bearer {token}
```

**Resposta `204`:** sem corpo.  
**Resposta `404`:** projeto não encontrado.

---

### Acompanhamento do projeto

```http
GET /projects/{id}/acompanhamento
Authorization: Bearer {token}
```

**Resposta `200`:**

```json
{
  "obraId": 1,
  "titulo": "Edifício Central",
  "status": "IN_PROGRESS",
  "totalEtapas": 4,
  "etapasConcluidas": 2,
  "totalTarefas": 12,
  "tarefasConcluidas": 8,
  "etapas": [
    {
      "id": 1,
      "name": "Fundação",
      "description": "Preparação e execução da fundação",
      "displayOrder": 1,
      "status": "DONE",
      "plannedStartDate": "2025-01-01",
      "plannedEndDate": "2025-02-28",
      "tasks": [
        {
          "id": 1,
          "title": "Sondagem do terreno",
          "description": "Análise do solo",
          "priority": "HIGH",
          "status": "DONE",
          "plannedStartDate": "2025-01-01",
          "plannedEndDate": "2025-01-15"
        }
      ]
    }
  ]
}
```

> **Atenção:** o acompanhamento retorna dados **mock gerados deterministicamente** pelo `id` do projeto. O mesmo ID sempre retorna o mesmo resultado.

---

## Objeto Projeto

```json
{
  "id": 1,
  "title": "Edifício Central",
  "address": "Rua das Flores, 123",
  "projectType": "RESIDENTIAL",
  "category": "BUILDING",
  "landArea": 500.00,
  "builtArea": 350.00,
  "status": "PLANNING",
  "plannedStartDate": "2025-01-01",
  "plannedEndDate": "2026-06-30",
  "createdAt": "2025-01-01T12:00:00Z",
  "updatedAt": "2025-01-01T12:00:00Z"
}
```

---

## Enumerações

| Campo | Valores aceitos |
|-------|----------------|
| `status` (projeto) | `PLANNING` \| `IN_PROGRESS` \| `PAUSED` \| `COMPLETED` \| `CANCELLED` |
| `status` (etapa) | `PLANNED` \| `IN_PROGRESS` \| `BLOCKED` \| `DONE` |
| `status` (tarefa) | `TODO` \| `IN_PROGRESS` \| `BLOCKED` \| `DONE` |
| `priority` (tarefa) | `LOW` \| `MEDIUM` \| `HIGH` |

---

## Fluxo típico de integração

```
1. POST /auth/login
        ↓ guarda token

2. POST /projects
        ↓ cria a obra, guarda id

3. GET  /projects
        ↓ lista no dashboard

4. GET  /projects/{id}
        ↓ detalhe da obra

5. GET  /projects/{id}/acompanhamento
        ↓ exibe progresso, etapas e tarefas

6. PATCH /projects/{id}
        ↓ edita campos (ex: muda status)

7. DELETE /projects/{id}
        ↓ remove a obra
```

---

## Erros comuns

| Código | Causa |
|--------|-------|
| `400` | Campo obrigatório faltando ou título duplicado |
| `401` | Token ausente, inválido ou expirado |
| `404` | Projeto não encontrado |

---

## Campos obrigatórios no POST /projects

| Campo | Tipo | Regra |
|-------|------|-------|
| `title` | String | Único, não vazio |
| `address` | String | Não vazio |
| `projectType` | String | Não vazio |
| `category` | String | Não vazio |
| `landArea` | BigDecimal | > 0 |
| `builtArea` | BigDecimal | > 0 |
