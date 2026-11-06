import { deleteAccountData } from '../../services/account';
import { deleteCognitoUser } from '../../services/cognito';
import { api, ok } from '../../utils/handler';
import { HttpError } from '../../utils/validation';

/**
 * DELETE /v1/account — supprime définitivement toutes les données de l'utilisateur puis son compte Cognito.
 * Le corps doit contenir `{ "confirm": true }` pour éviter toute suppression accidentelle.
 */
export const handler = api(async ({ userId, username, body }) => {
  if (body.confirm !== true) throw new HttpError(400, 'Confirmation requise : { "confirm": true }');
  const deleted = await deleteAccountData(userId);
  // Les identités de développement (x-user-id) n'ont pas de compte Cognito.
  const accountDeleted = username ? await deleteCognitoUser(username) : false;
  return ok({ deleted, accountDeleted });
});
