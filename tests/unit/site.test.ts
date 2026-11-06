import { deleteAccount, home, privacy, terms } from '../../src/handlers/site/pages';

describe('pages publiques', () => {
  it.each([
    ['accueil', home, 'GymPulse'],
    ['confidentialité', privacy, 'Politique de confidentialité'],
    ['conditions', terms, "Conditions d'utilisation"],
    ['suppression de compte', deleteAccount, 'Supprimer mon compte'],
  ])('sert la page %s en HTML sans authentification', async (_name, handler, title) => {
    const res: any = await handler();
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.body).toContain(`<h1>${title}</h1>`);
    expect(res.body).toContain('cyril.marchive@gmail.com');
  });

  it('la politique cite les données réellement traitées et la suppression', async () => {
    const res: any = await privacy();
    for (const word of ['Google', 'Amazon Cognito', 'MongoDB Atlas', 'Position', 'Supprimer mon compte']) {
      expect(res.body).toContain(word);
    }
  });
});
