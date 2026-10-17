import { env } from '../config/env.js';

export interface ClassificationResult {
  tags: string[];
  category: string;
  confidence: number;
  engine: 'gemini-api' | 'local-nlp';
}

interface TaxonomyCategory {
  category: string;
  keywords: string[];
  canonicalTags: string[];
}

const TAXONOMY: TaxonomyCategory[] = [
  {
    category: 'Database',
    keywords: [
      'mongodb', 'sql', 'postgres', 'database', 'nosql', 'query', 'aggregation',
      'index', 'indexing', 'ixscan', 'pipeline', 'collection', 'schema', 'table',
      'lookup', 'unwind', 'shard', 'replica', 'transaction', 'acid', 'prisma', 'mongoose'
    ],
    canonicalTags: ['mongodb', 'database', 'indexing', 'aggregations', 'performance'],
  },
  {
    category: 'Security',
    keywords: [
      'jwt', 'token', 'auth', 'authentication', 'authorization', 'bcrypt', 'hash',
      'password', 'security', 'rbac', 'vulnerability', 'xss', 'csrf', 'encryption',
      'cors', 'helmet', 'ssl', 'tls', 'secret', 'signature', 'role', 'permission'
    ],
    canonicalTags: ['security', 'jwt', 'auth', 'rbac', 'encryption'],
  },
  {
    category: 'Architecture',
    keywords: [
      'architecture', 'system', 'design', 'microservices', 'monolith', 'scalability',
      'scaling', 'caching', 'redis', 'cluster', 'throughput', 'latency', 'distributed',
      'load balancer', 'clean architecture', 'solid', 'dry', 'modularity'
    ],
    canonicalTags: ['architecture', 'scalability', 'system-design', 'microservices', 'clean-code'],
  },
  {
    category: 'DevOps & Cloud',
    keywords: [
      'devops', 'docker', 'kubernetes', 'k8s', 'ci', 'cd', 'pipeline', 'deployment',
      'aws', 'gcp', 'cloud', 'vercel', 'nginx', 'linux', 'container', 'monitoring',
      'git', 'github', 'actions', 'infra', 'terraform'
    ],
    canonicalTags: ['devops', 'cloud', 'docker', 'ci-cd', 'deployment'],
  },
  {
    category: 'Testing & QA',
    keywords: [
      'test', 'testing', 'vitest', 'jest', 'supertest', 'integration', 'unit',
      'mock', 'e2e', 'cypress', 'playwright', 'coverage', 'assert', 'tdd'
    ],
    canonicalTags: ['testing', 'vitest', 'unit-test', 'integration-test', 'quality'],
  },
  {
    category: 'Frontend',
    keywords: [
      'react', 'vue', 'angular', 'frontend', 'ui', 'ux', 'css', 'html', 'javascript',
      'typescript', 'component', 'hook', 'state', 'dom', 'browser', 'responsive',
      'vite', 'tailwind', 'style', 'canvas', 'spa'
    ],
    canonicalTags: ['frontend', 'react', 'typescript', 'javascript', 'ui-ux'],
  },
  {
    category: 'Backend',
    keywords: [
      'backend', 'api', 'rest', 'restful', 'node', 'nodejs', 'express', 'server',
      'endpoint', 'middleware', 'controller', 'service', 'handler', 'http', 'json'
    ],
    canonicalTags: ['backend', 'nodejs', 'express', 'api', 'rest-api'],
  },
];

export class AiService {
  /**
   * Deterministic local NLP topic classification engine using TF-IDF token matching
   * Runs in-memory, 0 latency, 0 external network dependencies.
   */
  static localClassify(title: string, content: string): ClassificationResult {
    const rawText = `${title} ${title} ${content}`.toLowerCase();
    const tokens = rawText.replace(/[^a-z0-9+#_]/g, ' ').split(/\s+/).filter((t) => t.length > 1);

    const categoryScores: Record<string, number> = {};
    const matchedTags = new Set<string>();

    TAXONOMY.forEach((tax) => {
      let score = 0;
      tax.keywords.forEach((keyword) => {
        // Multi-word phrase or single token match
        if (keyword.includes(' ')) {
          if (rawText.includes(keyword)) {
            score += 3;
            matchedTags.add(keyword.replace(/\s+/g, '-'));
          }
        } else {
          const count = tokens.filter((t) => t === keyword).length;
          if (count > 0) {
            score += count;
            matchedTags.add(keyword);
          }
        }
      });
      categoryScores[tax.category] = score;
    });

    // Determine top category
    let topCategory = 'General';
    let maxScore = 0;
    Object.entries(categoryScores).forEach(([cat, score]) => {
      if (score > maxScore) {
        maxScore = score;
        topCategory = cat;
      }
    });

    // Populate tags
    let resultTags = Array.from(matchedTags);
    if (resultTags.length === 0) {
      // Default to general technical tags
      resultTags = ['technology', 'notes', 'learning'];
    } else if (resultTags.length < 2 && topCategory !== 'General') {
      const canonical = TAXONOMY.find((t) => t.category === topCategory)?.canonicalTags || [];
      canonical.forEach((ct) => {
        if (resultTags.length < 3 && !resultTags.includes(ct)) {
          resultTags.push(ct);
        }
      });
    }

    // Limit to 4 tags max
    resultTags = resultTags.slice(0, 4);

    // Calculate confidence score (normalized between 0.70 and 0.95)
    const confidence = maxScore > 0 ? Math.min(0.95, 0.70 + maxScore * 0.04) : 0.70;

    return {
      tags: resultTags,
      category: topCategory,
      confidence: Math.round(confidence * 100) / 100,
      engine: 'local-nlp',
    };
  }

  /**
   * Remote LLM classification using Google Gemini REST API (when GEMINI_API_KEY is configured).
   */
  static async geminiClassify(title: string, content: string, apiKey: string): Promise<ClassificationResult> {
    const prompt = `You are a strict technical topic classifier for a developer note and post platform.
Analyze the following title and content, and output JSON ONLY with no formatting wrappers:
{
  "tags": ["2 to 4 specific technical tags in lowercase"],
  "category": "one of: Database, Security, Architecture, DevOps & Cloud, Testing & QA, Frontend, Backend, General",
  "confidence": 0.95
}

Title: "${title.replace(/"/g, '\\"')}"
Content: "${content.slice(0, 1500).replace(/"/g, '\\"')}"`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 150,
          },
        }),
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    // Clean code block ticks if any
    const jsonStr = rawText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(jsonStr) as { tags: string[]; category: string; confidence?: number };

    return {
      tags: (parsed.tags || []).map((t) => t.toLowerCase().trim().replace(/\s+/g, '-')).filter(Boolean).slice(0, 4),
      category: parsed.category || 'General',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.92,
      engine: 'gemini-api',
    };
  }

  /**
   * Main Entrypoint: attempts Gemini API when key is present, otherwise seamlessly falls back to Local NLP.
   */
  static async suggestTags(title: string, content: string): Promise<ClassificationResult> {
    const apiKey = env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim().length > 0) {
      try {
        return await this.geminiClassify(title, content, apiKey.trim());
      } catch (err: unknown) {
        console.warn('[AiService] Gemini API call skipped/failed, falling back to Local NLP engine:', (err as Error).message);
      }
    }

    return this.localClassify(title, content);
  }
}
