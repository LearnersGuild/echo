import React, {PropTypes} from 'react'
import Chip from 'react-toolbox/lib/chip'
import Slider from 'react-toolbox/lib/slider'

import Flex from 'src/common/components/Layout'

import styles from './index.css'

class SurveyFormInputSliderGroup extends React.Component {
  constructor(props) {
    super(props)
    this.handleUpdate = this.handleUpdate.bind(this)
    this.renderOptionSubject = this.renderOptionSubject.bind(this)
    this.renderOptionSlider = this.renderOptionSlider.bind(this)
    this.renderOptionPercentage = this.renderOptionPercentage.bind(this)
  }

  getSum() {
    return (this.props.value || []).reduce((result, val) => {
      return result + (val.value || 0)
    }, 0)
  }

  getValue(key) {
    const optionValue = (this.props.value || []).find(val => val.key === key)
    return optionValue ? optionValue.value : 0
  }

  handleUpdate(key, newValue) {
    if (this.props.onChange) {
      newValue = newValue || 0
      const oldValue = this.getValue(key)
      const oldSum = this.getSum()
      const newSum = oldSum - oldValue + newValue

      if (newSum > this.props.sum) {
        newValue = this.props.sum - (oldSum - oldValue)
      }

      const newValues = this.props.options.map(option => {
        return {
          key: option.key,
          value: option.key === key ?
            newValue : this.getValue(option.key)
        }
      })

      this.props.onChange(newValues)
    }
  }

  renderOptionSubject(option) {
    return (
      <Chip className={styles.chipContainer}>
        <Flex className={styles.chipContent} alignItems="center">
          <a className={styles.chipLabel} title={option.tooltip} href={option.url || ''} target="_blank" rel="noopener noreferrer">
            {option.label}
          </a>
        </Flex>
      </Chip>
    )
  }

  renderOptionSlider(option) {
    const sliderProps = {
      step: 1,
      min: 0,
      max: this.props.sum,
      value: this.getValue(option.key)
    }

    const handleChange = value => this.handleUpdate(option.key, value)

    return (
      <Flex justifyContent="center" alignItems="center" className={styles.sliderContainer}>
        <Slider {...sliderProps} onChange={handleChange} className={styles.slider}/>
      </Flex>
    )
  }

  renderOptionPercentage(option) {
    return (
      <Flex justifyContent="flex-end" alignItems="center" className={styles.percentageContainer}>
        {`${this.getValue(option.key)}%`}
      </Flex>
    )
  }

  render() {
    return (
      <Flex flexDirection="column" className={styles.container}>
        <Flex>
          <Flex flexDirection="column" className={styles.sliderLeftCol}>
            {this.props.options.map(option => (
              <div key={option.key} className={styles.row}>
                {this.renderOptionSubject(option)}
              </div>
            ))}
          </Flex>

          <Flex flexDirection="column" className={styles.sliderMiddleCol}>
            {this.props.options.map(option => (
              <div key={option.key} className={styles.row}>
                {this.renderOptionSlider(option)}
              </div>
            ))}
          </Flex>

          <Flex flexDirection="column" className={styles.sliderRightCol}>
            {this.props.options.map(option => (
              <div key={option.key} className={styles.row}>
                {this.renderOptionPercentage(option)}
              </div>
            ))}
          </Flex>
        </Flex>

        <Flex flexDirection="column" alignItems="flex-end" className={styles.sumPercentageContainer}>
          <h5 className={styles.sumPercentage}>{`All Contributions: ${this.getSum()}%`}</h5>
          <p>{this.props.hint}</p>
        </Flex>
      </Flex>
    )
  }
}

SurveyFormInputSliderGroup.propTypes = {
  name: PropTypes.string.isRequired,
  sum: PropTypes.number.isRequired,
  hint: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.required,
    label: PropTypes.any,
    tooltip: PropTypes.any,
    url: PropTypes.any,
  })),
  value: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.required,
    value: PropTypes.number
  })),
  onChange: PropTypes.func,
}

export default SurveyFormInputSliderGroup
