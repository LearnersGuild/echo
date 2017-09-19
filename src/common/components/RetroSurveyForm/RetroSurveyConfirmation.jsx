import React from 'react'
import Flex from 'src/common/components/Layout'
import styles from './index.scss'

export default function RetroSurveyConfirmation() {
  return (
    <Flex width="100%" flexDirection="column" className={styles.confirmation}>
      <Flex flexDirection="column" justifyContent="center" alignItems="center" flex={1}>
        <section className={styles.confirmationSection}>
          <h6>
            To complete your survey, click the CONFIRM button below.
          </h6>
        </section>
        <section className={styles.confirmationSection}>
          <h6>
            <strong className={styles.underline}>You will not be able to change your responses</strong><br/>
            after they have been confirmed.
          </h6>
        </section>
        <section className={styles.confirmationSection}>
          <h6 className={styles.confirmationSectionLight}>
            To review and edit responses, use the BACK button.
          </h6>
        </section>
      </Flex>
    </Flex>
  )
}
