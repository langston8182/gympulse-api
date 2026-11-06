import { parseTimezone } from '../../services/params';
import { deleteDemoContent, hasDemoContent, seedDemoContent } from '../../services/demo';
import { api, ok } from '../../utils/handler';
import { success } from '../../utils/response';

/** GET /v1/demo — { hasDemo } */
export const status = api(async ({ userId }) => ok({ hasDemo: await hasDemoContent(userId) }));

/** POST /v1/demo?tz= — (re)génère les données de démonstration. */
export const seed = api(async ({ userId, query }) => {
  const created = await seedDemoContent(userId, parseTimezone(query.tz));
  return success(201, { hasDemo: true, created });
});

/** DELETE /v1/demo — supprime les données de démonstration (le contenu de l'utilisateur est conservé). */
export const remove = api(async ({ userId }) => {
  const deleted = await deleteDemoContent(userId);
  return ok({ hasDemo: false, deleted });
});
