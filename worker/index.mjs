import knowledge from '../assets/data/knowledge.json' with { type: 'json' };
import { createWorker, PortfolioGuardCore } from './core.mjs';

// A single named Durable Object owns every request reservation and cached summary.
// Never change its name or reset its storage to work around a quota.
export class PortfolioGuard extends PortfolioGuardCore {
  constructor(ctx, env) {
    super(ctx, env, knowledge);
  }
}

export default createWorker(knowledge);
