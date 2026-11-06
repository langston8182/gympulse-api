import { AdminDeleteUserCommand, CognitoIdentityProviderClient, UserNotFoundException } from '@aws-sdk/client-cognito-identity-provider';

let client: CognitoIdentityProviderClient | null = null;

/** Supprime l'utilisateur du pool Cognito (idempotent). Sans pool configuré, ne fait rien. */
export async function deleteCognitoUser(username: string): Promise<boolean> {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  if (!userPoolId) return false;
  client ??= new CognitoIdentityProviderClient({});
  try {
    await client.send(new AdminDeleteUserCommand({ UserPoolId: userPoolId, Username: username }));
    return true;
  } catch (err) {
    if (err instanceof UserNotFoundException) return true;
    throw err;
  }
}
