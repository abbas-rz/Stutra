import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { ACTIVITY_OPTIONS } from '../../constants/index';

interface ActivityDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (activity: string) => void;
}

export function ActivityDialog({ open, onClose, onSelect }: ActivityDialogProps) {
  const [customActivity, setCustomActivity] = useState('');

  const handleSelect = (activity: string) => {
    onSelect(activity);
    setCustomActivity('');
    onClose();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && customActivity.trim()) {
      handleSelect(customActivity.trim());
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xs" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: 'background.paper',
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>Select Activity</DialogTitle>
      <List>
        {ACTIVITY_OPTIONS.map((activity: string) => (
          <ListItem 
            key={activity} 
            onClick={() => handleSelect(activity)}
            sx={{ 
              py: 1,
              cursor: 'pointer',
              borderRadius: 2,
              mx: 1,
              '&:hover': {
                bgcolor: 'rgba(0, 122, 255, 0.1)',
              },
            }}
          >
            <ListItemText primary={activity} />
          </ListItem>
        ))}
        <ListItem sx={{ pt: 2, px: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Enter custom activity"
            value={customActivity}
            onChange={(e) => setCustomActivity(e.target.value)}
            onKeyPress={handleKeyPress}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
            InputProps={{
              endAdornment: customActivity.trim() && (
                <InputAdornment position="end">
                  <IconButton 
                    size="small" 
                    onClick={() => handleSelect(customActivity.trim())}
                    sx={{ color: 'primary.main' }}
                  >
                    <CheckCircle />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </ListItem>
      </List>
    </Dialog>
  );
}
