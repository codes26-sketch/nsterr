import { endpoint, json, method, readSettings } from './common.mjs';

export const handler = endpoint(async event => {
  method(event, ['GET']);
  const settings = await readSettings();
  return json(200, { setupComplete: Boolean(settings.setup_complete), initialCredentialsConfigured: Boolean(process.env.NSTER_INITIAL_OWNER_PASSWORD && process.env.NSTER_INITIAL_VISITOR_PASSWORD && process.env.NSTER_INITIAL_UPLOADER_USERNAME && process.env.NSTER_INITIAL_UPLOADER_PASSWORD) });
});
