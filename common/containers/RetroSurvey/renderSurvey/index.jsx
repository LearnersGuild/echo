import React from 'react'
import styles from '../index.css'
import renderHeader from './renderHeader.jsx'
import renderProgress from './renderProgress.jsx'
import renderBody from './renderBody.jsx'

export default function renderSurvey(surveyTitle, formName, surveyFieldGroups, surveyGroupIndex, surveyFields, handleSubmit, isBusy, submitting, invalid, handleClickSubmit, handleClickConfirm, handleClickBack, getRef) {
  return (
    <div className={styles.container} ref={getRef}>
      {renderHeader(surveyTitle)}
      {renderProgress(surveyFieldGroups, surveyGroupIndex)}
      {renderBody(formName, surveyFields, handleSubmit, isBusy, submitting, invalid, surveyGroupIndex, handleClickSubmit, handleClickConfirm, handleClickBack)}
    </div>
  )
}
