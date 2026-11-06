import { EXERCISE_LIBRARY } from '../../domain/library';
import { api, ok } from '../../utils/handler';

/** GET /v1/exercises/library — bibliothèque fournie (statique, sans accès base). */
export const handler = api(async () => ok(EXERCISE_LIBRARY), { db: false });
