import React, {Component, PropTypes} from 'react'
import Dialog from 'react-toolbox/lib/dialog'

export default class ConfirmationDialog extends Component {
  render() {
    const {
      children,
      active,
      title,
      cancelLabel,
      confirmLabel,
      onClickCancel: handleClickCancel,
      onClickConfirm: handleClickConfirm,
    } = this.props

    const cancelButtonProps = {
      label: cancelLabel || 'Cancel',
      onClick: handleClickCancel,
    }
    const confirmButtonProps = {
      label: confirmLabel || 'Confirm',
      onClick: handleClickConfirm,
      accent: true,
    }

    return (
      <div>
        <Dialog
          active={active}
          actions={[cancelButtonProps, confirmButtonProps]}
          onEscKeyDown={handleClickCancel}
          onOverlayClick={handleClickCancel}
          title={title}
          >
          {children || (
            <div>Are you sure?</div>
          )}
        </Dialog>
      </div>
    )
  }
}

ConfirmationDialog.propTypes = {
  children: PropTypes.any,
  active: PropTypes.bool,
  title: PropTypes.string,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  onClickCancel: PropTypes.func,
  onClickConfirm: PropTypes.func,
}
