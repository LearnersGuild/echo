import React from 'react'
import styles from './index.css'

function renderProjectListItem(project, i, handleClickProject) {
  const projectInfo = `${project.name} (cycle ${project.cycle.cycleNumber})`
  const projectItem = project.artifactURL ? (
    <a href="" onClick={handleClickProject(project)}>{projectInfo}</a>
  ) : (
    <span className={styles.disabledListItemText}>{projectInfo} - Project Artifact Needed</span>
  )

  return (
    <div key={i} className={styles.projectListItem}>
      {'• '}{projectItem}
    </div>
  )
}

export default function renderProjectList(projects = [], navigate, handleClickProject) {
  return (
    <div className={styles.projectList}>
      <div className={styles.header}>
        <h5>Available Retrospectives</h5>
      </div>
      <hr className={styles.headerDivider}/>
      <div className={styles.projectListPrompt}>Select a project:</div>
      <div>
        {projects.map((project, i) => renderProjectListItem(project, i, handleClickProject))}
      </div>
    </div>
  )
}
