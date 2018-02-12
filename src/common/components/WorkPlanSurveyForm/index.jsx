import React, {PropTypes} from 'react'
import Helmet from 'react-helmet'
import SurveyForm from 'src/common/components/SurveyForm'
import styles from '../RetroSurveyForm/index.scss'
import WorkPlanSurveyConfirmation from './WorkPlanSurveyConfirmation'

export default function WorkPlanSurveyForm(props) {
  const {
    surveyShortTitle,
    formName,
    surveyGroupIndex,
    surveyFields,
    handleSubmit,
    isBusy,
    submitting,
    invalid,
    onClickSubmit,
    onClickBack,
    getRef,
  } = props

  if (!isBusy && (!surveyFields || surveyFields.length === 0)) {
    return (
      <WorkPlanSurveyConfirmation
        onClickBack={onClickBack}
        />
    )
  }

  return (
    <div className={styles.container} ref={getRef}>
      <Helmet>
        <title>{surveyShortTitle}</title>
      </Helmet>
      <SurveyForm
        name={formName}
        title={((surveyFields || [])[0] || {}).title}
        fields={surveyFields}
        submitLabel="Submit"
        submitDisabled={isBusy}
        onClickSubmit={onClickSubmit}
        showBackButton={surveyGroupIndex > 0}
        backLabel="Back"
        backDisabled={isBusy}
        onClickBack={onClickBack}
        invalid={invalid}
        submitting={submitting}
        handleSubmit={handleSubmit}
        />
    </div>
  )
}

WorkPlanSurveyForm.propTypes = {
  surveyTitle: PropTypes.string,
  surveyShortTitle: PropTypes.string,
  playbookURL: PropTypes.string,
  formName: PropTypes.string,
  surveyFieldGroups: PropTypes.array,
  surveyGroupIndex: PropTypes.number,
  surveyFields: PropTypes.array,
  handleSubmit: PropTypes.func.isRequired,
  isBusy: PropTypes.bool,
  submitting: PropTypes.bool,
  invalid: PropTypes.bool,
  onClickSubmit: PropTypes.func.isRequired,
  onClickConfirm: PropTypes.func.isRequired,
  onClickBack: PropTypes.func.isRequired,
  getRef: PropTypes.func.isRequired,
}
