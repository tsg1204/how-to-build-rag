import { CohereClient } from 'cohere-ai';

const token = process.env.COHERE_API_KEY?.trim();

export const cohereClient: CohereClient | null = token
  ? new CohereClient({ token })
  : null;

if (!token) {
  console.warn('COHERE_API_KEY not set');
}
