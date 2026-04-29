---
title: "Armadilha IA: Operações sem Audit Log"
category: armadilhas-ia
tags: [auditoria, compliance, banco, logs]
stack: [NestJS, Prisma, PostgreSQL]
excerpt: A IA implementa create/update/delete sem registrar quem fez o quê e quando. Impossível debugar, impossível auditar, impossível cumprir LGPD.
related: [soft-delete-audit, auth-architecture, outbox-pattern]
updated: "2026-04"
---

## O que a IA gera (operação sem rastro)

```typescript
// Deleção sem rastro algum de quem deletou, quando e por quê
async deleteEmployee(id: string) {
  await this.prisma.employee.delete({ where: { id } });
  return { success: true };
}

// Update que sobrescreve dados sem histórico
async updateSalary(id: string, newSalary: number) {
  return this.prisma.employee.update({
    where: { id },
    data: { salary: newSalary },
  });
  // Não sabe quem mudou, qual era o valor anterior, quando foi
}
```

Em produção: "Quem deletou o funcionário X?", "Qual era o salário antes da mudança?" → sem resposta.

## A versão correta — soft delete + audit table

```typescript
// Modelo Prisma com audit fields
model Employee {
  id          String   @id @default(uuid())
  // dados...
  createdAt   DateTime @default(now())
  createdBy   String   // userId
  updatedAt   DateTime @updatedAt
  updatedBy   String?
  deletedAt   DateTime? // null = ativo, preenchido = soft deleted
  deletedBy   String?
}

// Tabela de auditoria separada — imutável
model AuditLog {
  id         String   @id @default(uuid())
  entity     String   // "employee"
  entityId   String
  action     String   // "create" | "update" | "delete"
  actorId    String   // userId que fez a ação
  actorIp    String?
  before     Json?    // estado antes
  after      Json?    // estado depois
  reason     String?  // motivo opcional
  createdAt  DateTime @default(now())
}
```

```typescript
// Service com audit automático
@Injectable()
export class EmployeeService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private ctx: RequestContext,  // userId, IP do request atual
  ) {}

  async updateSalary(id: string, newSalary: number) {
    const before = await this.prisma.employee.findUnique({ where: { id } });

    const updated = await this.prisma.employee.update({
      where: { id },
      data: { salary: newSalary, updatedBy: this.ctx.userId },
    });

    // Audit log em paralelo (não bloqueia a resposta)
    this.auditService.log({
      entity: 'employee',
      entityId: id,
      action: 'update',
      actorId: this.ctx.userId,
      actorIp: this.ctx.ip,
      before: { salary: before?.salary },
      after:  { salary: newSalary },
    });

    return updated;
  }

  async delete(id: string, reason?: string) {
    // Soft delete — nunca apaga fisicamente dados de negócio
    return this.prisma.employee.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: this.ctx.userId,
      },
    });
  }
}
```

## Como detectar no code review

- [ ] Operações de update incluem `updatedBy` com o userId do request?
- [ ] Deletes são soft delete (campo `deletedAt`) em entidades de negócio?
- [ ] Existe audit log para operações financeiras e de acesso a dados sensíveis?
- [ ] O log registra estado antes E depois (não só o ID)?
- [ ] Logs de auditoria são imutáveis (sem endpoint de delete na audit table)?

## Prompt para evitar esta armadilha

```
Para toda operação de create/update/delete em entidades de negócio:
1. Registre createdBy/updatedBy/deletedBy com o userId do contexto de autenticação
2. Use soft delete (campo deletedAt) — nunca DELETE físico em dados de negócio
3. Para operações sensíveis (financeiro, permissões, dados pessoais):
   registre audit log com estado antes e depois
4. Audit logs são imutáveis — sem endpoint de deleção
```
