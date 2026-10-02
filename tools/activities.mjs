// Which activities there are: every folder in src/activities/ with a card.js, in name order. The
// build, the checks and the room checker all ask here, so a new activity is found by everything at once.
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const activityIds = root => readdirSync(join(root, 'src/activities')).sort()
  .filter(d => existsSync(join(root, 'src/activities', d, 'card.js')));
