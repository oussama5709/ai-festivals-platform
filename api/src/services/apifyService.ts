import axios from 'axios';

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN ?? '';
const APIFY_ACTOR_ID = process.env.APIFY_ACTOR_ID ?? '';
const BASE_URL = 'https://api.apify.com/v2';

export async function triggerActorRun(
  regions: string[],
  maxResults: number = 500
): Promise<{ runId: string; estimatedDuration: number }> {
  const response = await axios.post(
    `${BASE_URL}/acts/${APIFY_ACTOR_ID}/runs`,
    { regions, maxResults },
    {
      headers: { Authorization: `Bearer ${APIFY_API_TOKEN}` },
    }
  );
  return {
    runId: response.data.data.id,
    estimatedDuration: 180, // seconds
  };
}

export async function fetchDatasetItems(datasetId: string): Promise<unknown[]> {
  const response = await axios.get(
    `${BASE_URL}/datasets/${datasetId}/items?format=json`,
    {
      headers: { Authorization: `Bearer ${APIFY_API_TOKEN}` },
    }
  );
  return response.data;
}

export async function getRunStatus(runId: string): Promise<string> {
  const response = await axios.get(`${BASE_URL}/actor-runs/${runId}`, {
    headers: { Authorization: `Bearer ${APIFY_API_TOKEN}` },
  });
  return response.data.data.status;
}

export async function getRunDatasetId(runId: string): Promise<string | null> {
  const response = await axios.get(`${BASE_URL}/actor-runs/${runId}`, {
    headers: { Authorization: `Bearer ${APIFY_API_TOKEN}` },
  });
  return response.data.data.defaultDatasetId ?? null;
}

export function isApifyConfigured(): boolean {
  return Boolean(APIFY_API_TOKEN && APIFY_ACTOR_ID);
}
