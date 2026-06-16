import { getDb } from './database';
import bcrypt from 'bcryptjs';
import { config } from '../config/env';

const PROJECT_ID  = 'seed-project-001';
const PAPER_1_ID  = 'seed-paper-001';
const PAPER_2_ID  = 'seed-paper-002';
const PAPER_3_ID  = 'seed-paper-003';
const CLAIM_1A_ID = 'seed-claim-001';
const CLAIM_1B_ID = 'seed-claim-002';
const CLAIM_2A_ID = 'seed-claim-003';
const CLAIM_2B_ID = 'seed-claim-004';
const CLAIM_3A_ID = 'seed-claim-005';
const CLAIM_3B_ID = 'seed-claim-006';
const CLUSTER_1_ID = 'seed-cluster-001';
const CLUSTER_2_ID = 'seed-cluster-002';

export function runSeed(): void {
  const db = getDb();

  db.exec(`
    INSERT OR IGNORE INTO projects (id, name, description) VALUES
      ('${PROJECT_ID}', 'Sleep and Memory Consolidation',
       'Research project exploring how sleep stages affect different types of memory consolidation.');

    INSERT OR IGNORE INTO papers (id, project_id, title, authors, year, summary) VALUES
      ('${PAPER_1_ID}', '${PROJECT_ID}',
       'Sleep-dependent memory consolidation',
       'Stickgold, R.', 2005,
       'Reviews evidence that sleep plays a critical role in the consolidation of newly acquired memories, with different sleep stages supporting different memory types.'),
      ('${PAPER_2_ID}', '${PROJECT_ID}',
       'Reactivation of hippocampal ensemble memories during sleep',
       'Wilson, M.A., McNaughton, B.L.', 1994,
       'Demonstrates that hippocampal place cells that fired together during waking exploration replay those sequences during subsequent slow-wave sleep.'),
      ('${PAPER_3_ID}', '${PROJECT_ID}',
       'Strengthening individual memories by reactivating them during sleep',
       'Rudoy, J.D. et al.', 2009,
       'Shows that presenting sound cues associated with learned object locations during SWS selectively enhances memory for those objects.');

    INSERT OR IGNORE INTO claims (id, paper_id, text, notes) VALUES
      ('${CLAIM_1A_ID}', '${PAPER_1_ID}',
       'REM sleep preferentially consolidates procedural and emotional memories.',
       'Contrasted with NREM which supports declarative memory.'),
      ('${CLAIM_1B_ID}', '${PAPER_1_ID}',
       'Slow-wave sleep is critical for declarative memory consolidation.',
       NULL),
      ('${CLAIM_2A_ID}', '${PAPER_2_ID}',
       'Hippocampal place cells replay waking activity sequences during slow-wave sleep.',
       'Temporal compression ratio roughly 6–7x during replay.'),
      ('${CLAIM_2B_ID}', '${PAPER_2_ID}',
       'Memory replay during NREM sleep is thought to transfer representations to neocortex.',
       NULL),
      ('${CLAIM_3A_ID}', '${PAPER_3_ID}',
       'Targeted memory reactivation during SWS selectively strengthens associated memories.',
       'Effect is specific — non-cued items show no benefit.'),
      ('${CLAIM_3B_ID}', '${PAPER_3_ID}',
       'TMR has no measurable effect when applied during REM sleep.',
       NULL);

    INSERT OR IGNORE INTO clusters (id, project_id, name, description) VALUES
      ('${CLUSTER_1_ID}', '${PROJECT_ID}',
       'NREM / Slow-Wave Sleep Effects',
       'Claims relating to the role of slow-wave sleep in memory consolidation.'),
      ('${CLUSTER_2_ID}', '${PROJECT_ID}',
       'Hippocampal Replay Mechanism',
       'Claims about how the hippocampus reactivates memories during sleep.');

    INSERT OR IGNORE INTO claim_clusters (claim_id, cluster_id) VALUES
      ('${CLAIM_1B_ID}', '${CLUSTER_1_ID}'),
      ('${CLAIM_2A_ID}', '${CLUSTER_1_ID}'),
      ('${CLAIM_3A_ID}', '${CLUSTER_1_ID}'),
      ('${CLAIM_2A_ID}', '${CLUSTER_2_ID}'),
      ('${CLAIM_2B_ID}', '${CLUSTER_2_ID}');
  `);

  const existingAdmin = db.prepare('SELECT id FROM users WHERE id = ?').get('admin-user-001');
  if (!existingAdmin) {
    const hash = bcrypt.hashSync(config.adminPassword, 10);
    db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run('admin-user-001', config.adminEmail, hash);
  }
}
