import { PGlite } from '@electric-sql/pglite'
import { worker } from '@electric-sql/pglite/worker'
import { live } from '@electric-sql/pglite/live'

import { migrate } from './migrations'

worker({
  async init() {
    const pg = await PGlite.create({
      dataDir: 'idb://myDb',
      relaxedDurability: true,
      extensions: {
        live
      }
    })
    await migrate(pg)
    return pg
  }
})
