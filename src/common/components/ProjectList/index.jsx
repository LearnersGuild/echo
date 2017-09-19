import React, {Component, PropTypes} from 'react'
import {Button} from 'react-toolbox/lib/button'
import Helmet from 'react-helmet'

import ContentHeader from 'src/common/components/ContentHeader'
import ContentTable from 'src/common/components/ContentTable'
import Flex from 'src/common/components/Layout'

export default class ProjectList extends Component {
  render() {
    const {projectData, projectModel, allowImport, onClickImport} = this.props
    const header = (
      <ContentHeader
        title="Projects"
        buttonIcon={allowImport ? 'add_circle' : null}
        onClickButton={allowImport ? onClickImport : null}
        />
    )
    const content = projectData.length > 0 ? (
      <div>
        <ContentTable
          model={projectModel}
          source={projectData}
          />
        <Flex column>
          <Button onClick={this.props.onLoadMoreClicked} label="Load More..." icon="keyboard_arrow_down" accent/>
        </Flex>
      </div>
    ) : (
      <div>No projects found.</div>
    )
    return (
      <Flex column>
        <Helmet>
          <title>Projects</title>
        </Helmet>
        {header}
        {content}
      </Flex>
    )
  }
}

ProjectList.propTypes = {
  projectModel: PropTypes.object,
  projectData: PropTypes.array,
  allowImport: PropTypes.bool,
  onClickImport: PropTypes.func,
  onLoadMoreClicked: PropTypes.func,
}
