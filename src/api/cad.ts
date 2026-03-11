import { Hono } from 'hono'

type Bindings = { DB: D1Database }
export const cadApi = new Hono<{ Bindings: Bindings }>()

/**
 * CAD Sync Endpoint
 * Accepts topology data and updates the ship's project data.
 */
cadApi.post('/sync', async (c) => {
    const { shipId, networkData, userId } = await c.req.json()

    if (!shipId || !networkData) {
        return c.json({ error: 'Missing shipId or networkData' }, 400)
    }

    const db = c.env.DB

    // 1. Load existing project data to merge with CAD data
    const existingProj = await db.prepare('SELECT * FROM projects WHERE ship_id = ? ORDER BY saved_at DESC LIMIT 1')
        .bind(shipId).first()

    let projectData = existingProj ? JSON.parse(existingProj.data_json as string) : { nodes: [], cables: [] }

    // 2. Integration Logic:
    // In a real scenario, we would map networkData.nodes and networkData.edges 
    // to the internal SCMS data structure.
    // For now, we'll store it in a 'cad_sync' field for the frontend to consume.
    projectData.cadMetadata = {
        lastSync: new Date().toISOString(),
        syncBy: userId || 'system',
        nodeCount: networkData.summary.total_nodes,
        edgeCount: networkData.edges.length
    }
    projectData.cadNetwork = networkData

    const id = 'proj_cad_' + (globalThis.crypto.randomUUID())

    // 3. Save as a new version
    await db.prepare('INSERT INTO projects (id, ship_id, data_json, saved_by) VALUES (?, ?, ?, ?)')
        .bind(id, shipId, JSON.stringify(projectData), userId || 'cad_sync_bot').run()

    return c.json({
        success: true,
        id,
        summary: networkData.summary
    })
})
