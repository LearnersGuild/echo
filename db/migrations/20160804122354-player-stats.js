const config = require('../config')

config()

exports.up = async (r, conn) => {
  const players = await r.table('players').run(conn)

  const updates = players.map(player => {
    const ecc = player.ecc
    const projects = {}

    const cycles = player.cycleProjectECC || {}
    Object.keys(cycles).forEach(cycleId => {
      const cycleProjects = cycles[cycleId] || {}

      Object.keys(cycleProjects).forEach(projectId => {
        const cycleProjectStats = cycleProjects[projectId] || {}

        if (!projects[projectId]) {
          projects[projectId] = {cycles: {}}
        }
        if (!projects[projectId].cycles[cycleId]) {
          projects[projectId].cycles[cycleId] = {}
        }

        projects[projectId].cycles[cycleId].abc = cycleProjectStats.abc || 0
        projects[projectId].cycles[cycleId].rc = cycleProjectStats.rc || 0
        projects[projectId].cycles[cycleId].ecc = cycleProjectStats.ecc || 0
      })
    })

    return r.table('players')
      .get(player.id)
      .replace(
        r.row
          .merge({stats: {ecc, projects}})
          .without('ecc', 'cycleProjectECC')
      )
      .run(conn)
  })

  return Promise.all(updates)
}

exports.down = async (r, conn) => {
  const players = await r.table('players').run(conn)

  const updates = players.map(player => {
    const stats = player.stats || {}
    const ecc = stats.ecc || 0
    const cycleProjectECC = {}

    const projects = stats.projects || {}
    Object.keys(projects).forEach(projectId => {
      const projectCycles = (projects[projectId] || {}).cycles || {}

      Object.keys(projectCycles).forEach(cycleId => {
        const projectCycleStats = projectCycles[cycleId] || {}

        if (!cycleProjectECC[cycleId]) {
          cycleProjectECC[cycleId] = {}
        }
        if (!cycleProjectECC[cycleId][projectId]) {
          cycleProjectECC[cycleId][projectId] = {}
        }

        cycleProjectECC[cycleId][projectId].abc = projectCycleStats.abc
        cycleProjectECC[cycleId][projectId].rc = projectCycleStats.rc
        cycleProjectECC[cycleId][projectId].ecc = projectCycleStats.ecc
      })
    })

    return r.table('players')
      .get(player.id)
      .replace(
        r.row
          .merge({ecc, cycleProjectECC})
          .without('stats')
      )
      .run(conn)
  })

  return Promise.all(updates)
}
