import React from 'react'
import SurveyForm from 'src/common/components/SurveyForm'
import renderConfirmation from './renderConfirmation.jsx'

export default function renderBody(formName, surveyFields, handleSubmit, isBusy, submitting, invalid, surveyGroupIndex, handleClickSubmit, handleClickConfirm, handleClickBack) {
  if (!isBusy && (!surveyFields || surveyFields.length === 0)) {
    return (
      <SurveyForm
        name={formName}
        title={((surveyFields || [])[0] || {}).title}
        content={renderConfirmation()}
        onSubmit={handleClickSubmit}
        submitLabel="Confirm"
        submitDisabled={submitting}
        onClickSubmit={handleClickConfirm}
        showBackButton={surveyGroupIndex > 0}
        backLabel="Back"
        backDisabled={submitting}
        onClickBack={handleClickBack}
        handleSubmit={handleSubmit}
        />
    )
  }
  return (
    <SurveyForm
      name={formName}
      title={((surveyFields || [])[0] || {}).title}
      fields={surveyFields}
      submitLabel="Next"
      submitDisabled={isBusy}
      onClickSubmit={handleClickSubmit}
      showBackButton={surveyGroupIndex > 0}
      backLabel="Back"
      backDisabled={isBusy}
      onClickBack={handleClickBack}
      invalid={invalid}
      submitting={submitting}
      handleSubmit={handleSubmit}
      />
  )
}
