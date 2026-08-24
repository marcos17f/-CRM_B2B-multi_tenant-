/**
 * Dados de demonstração — um workspace, um usuário dono, pipeline default, algumas
 * companies/contacts/opportunities/activities/tasks. Idempotente (não faz nada se o
 * usuário demo já existir).
 *
 * Uso: npm run db:seed
 */
import 'dotenv/config';
import { sql } from 'kysely';
import { createKysely } from './kysely';
import { hashPassword } from '../src/common/security/password';

const DEMO_EMAIL = 'demo@flow89.com';
const DEMO_PASSWORD = 'demo1234';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL não definido (copie .env.example para .env).');

  const db = createKysely(databaseUrl);

  const existing = await db.selectFrom('users').select('id').where('email', '=', DEMO_EMAIL).executeTakeFirst();
  if (existing) {
    console.log('Seed já aplicado antes (usuário demo já existe) — nada a fazer.');
    await db.destroy();
    return;
  }

  await db.transaction().execute(async (trx) => {
    const ownerRole = await trx
      .selectFrom('roles')
      .select(['id'])
      .where('name', '=', 'owner')
      .where('workspaceId', 'is', null)
      .executeTakeFirstOrThrow();

    const user = await trx
      .insertInto('users')
      .values({ email: DEMO_EMAIL, passwordHash: await hashPassword(DEMO_PASSWORD), name: 'Demo Owner', status: 'active' })
      .returningAll()
      .executeTakeFirstOrThrow();

    const workspace = await trx
      .insertInto('workspaces')
      .values({ name: 'MarcosLab', slug: 'marcoslab', status: 'active' })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Tabelas daqui pra baixo têm RLS forçado — ativa o contexto do workspace recém-criado.
    await sql`select set_config('app.current_workspace_id', ${workspace.id}, true)`.execute(trx);

    const member = await trx
      .insertInto('workspaceMembers')
      .values({ workspaceId: workspace.id, userId: user.id, roleId: ownerRole.id, status: 'active', joinedAt: new Date() })
      .returningAll()
      .executeTakeFirstOrThrow();

    const pipeline = await trx
      .insertInto('pipelines')
      .values({ workspaceId: workspace.id, name: 'Vendas', isDefault: true })
      .returningAll()
      .executeTakeFirstOrThrow();

    const stages = await trx
      .insertInto('pipelineStages')
      .values([
        { pipelineId: pipeline.id, name: 'Qualificação', orderIndex: 0, probability: '0.100', stageType: 'open' },
        { pipelineId: pipeline.id, name: 'Diagnóstico', orderIndex: 1, probability: '0.300', stageType: 'open' },
        { pipelineId: pipeline.id, name: 'Proposta', orderIndex: 2, probability: '0.600', stageType: 'open' },
        { pipelineId: pipeline.id, name: 'Negociação', orderIndex: 3, probability: '0.800', stageType: 'open' },
        { pipelineId: pipeline.id, name: 'Ganho', orderIndex: 4, probability: '1.000', stageType: 'won' },
        { pipelineId: pipeline.id, name: 'Perdido', orderIndex: 5, probability: '0.000', stageType: 'lost' },
      ])
      .returningAll()
      .execute();

    const campaign = await trx
      .insertInto('campaigns')
      .values({ workspaceId: workspace.id, name: 'Outbound Q3', type: 'outbound', status: 'active', ownerId: member.id })
      .returningAll()
      .executeTakeFirstOrThrow();

    const companiesData = [
      { name: 'Acme Tecnologia', domain: 'acme.com', industry: 'SaaS', employeeCount: 120, status: 'customer' },
      { name: 'Nortel Distribuidora', domain: 'nortel.com.br', industry: 'Varejo', employeeCount: 45, status: 'prospect' },
      { name: 'Vega Logística', domain: 'vega.com.br', industry: 'Logística', employeeCount: 300, status: 'customer' },
    ];
    const companies = [];
    for (const c of companiesData) {
      companies.push(
        await trx
          .insertInto('companies')
          .values({
            workspaceId: workspace.id,
            name: c.name,
            domain: c.domain,
            industry: c.industry,
            employeeCount: c.employeeCount,
            status: c.status,
            ownerId: member.id,
            createdBy: member.id,
          })
          .returningAll()
          .executeTakeFirstOrThrow(),
      );
    }

    const contact1 = await trx
      .insertInto('contacts')
      .values({
        workspaceId: workspace.id,
        companyId: companies[0].id,
        firstName: 'Marina',
        lastName: 'Souza',
        email: 'marina@acme.com',
        title: 'Head de Operações',
        ownerId: member.id,
        sourceCampaignId: campaign.id,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const contact2 = await trx
      .insertInto('contacts')
      .values({
        workspaceId: workspace.id,
        companyId: companies[1].id,
        firstName: 'Bruno',
        lastName: 'Alves',
        email: 'bruno@nortel.com.br',
        title: 'Diretor Comercial',
        ownerId: member.id,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const propostaStage = stages.find((s) => s.name === 'Proposta')!;
    const opp1 = await trx
      .insertInto('opportunities')
      .values({
        workspaceId: workspace.id,
        name: 'Nortel — expansão 2026',
        companyId: companies[1].id,
        primaryContactId: contact2.id,
        pipelineId: pipeline.id,
        stageId: propostaStage.id,
        type: 'new_business',
        amount: '48000.00',
        currency: 'BRL',
        ownerId: member.id,
        expectedCloseDate: '2026-10-15',
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const negociacaoStage = stages.find((s) => s.name === 'Negociação')!;
    await trx
      .insertInto('opportunities')
      .values({
        workspaceId: workspace.id,
        name: 'Acme — upsell módulo IA',
        companyId: companies[0].id,
        primaryContactId: contact1.id,
        pipelineId: pipeline.id,
        stageId: negociacaoStage.id,
        type: 'upsell',
        amount: '15000.00',
        currency: 'BRL',
        ownerId: member.id,
        riskLevel: 'low',
        expectedCloseDate: '2026-09-30',
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    await trx
      .insertInto('activities')
      .values({
        workspaceId: workspace.id,
        type: 'note',
        relatedToType: 'opportunity',
        relatedToId: opp1.id,
        actorId: member.id,
        payload: { text: 'Call de descoberta feita — cliente confirmou budget para Q4.' },
      })
      .execute();

    await trx
      .insertInto('tasks')
      .values({
        workspaceId: workspace.id,
        subject: 'Enviar proposta revisada',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        assigneeId: member.id,
        relatedToType: 'opportunity',
        relatedToId: opp1.id,
        createdBy: member.id,
      })
      .execute();
  });

  console.log(`Seed aplicado. Login demo: ${DEMO_EMAIL} / ${DEMO_PASSWORD} (workspace "marcoslab").`);
  await db.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
