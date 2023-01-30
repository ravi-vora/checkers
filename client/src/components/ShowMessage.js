import React from 'react'
import { Snackbar, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close';

const ShowMessage = ({open, setOpen, message }) => {
    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpen(false);
    };

    const action = (
        <React.Fragment>
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </React.Fragment>
      );

  return (
    <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        message={message}
        action={action}
    />
  )
}

export default ShowMessage