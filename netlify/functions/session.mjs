import { endpoint, json, method, readOwnerSession, readVisitorSession } from './common.mjs';

export const handler = endpoint(async event => {
  method(event, ['GET']);
  const owner = await readOwnerSession(event);
  if (owner) return json(200, { role: owner.role, owner: { id: owner.id, displayName: owner.displayName, role: owner.role } });
  if (await readVisitorSession(event)) return json(200, { role: 'visitor' });
  return json(200, { role: 'none' });
});

export default handler;
