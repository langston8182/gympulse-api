import { api, ok } from '../../utils/handler';

export const handler = api(async () => ok({ status: 'ok', time: new Date().toISOString() }), { auth: false, db: false });
