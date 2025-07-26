import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { formatDateDDMMYYYY } from '../utils';

interface NotesDialogProps {
  open: boolean;
  onClose: () => void;
  studentName: string;
  notes: string[];
  onAddNote: (note: string) => void;
  onDeleteNote: (index: number) => void;
}

export function NotesDialog({ 
  open, 
  onClose, 
  studentName, 
  notes, 
  onAddNote,
  onDeleteNote 
}: NotesDialogProps) {
  const [newNote, setNewNote] = useState('');

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(newNote.trim());
      setNewNote('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: 'background.paper',
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        Notes for {studentName}
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        <Box mb={2}>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Add a note about this student..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
          <Box mt={1} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              startIcon={<Add />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Add Note
            </Button>
          </Box>
        </Box>

        {notes.length > 0 ? (
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {notes.map((note, index) => (
              <ListItem
                key={index}
                sx={{
                  bgcolor: 'background.default',
                  borderRadius: 2,
                  mb: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    onClick={() => onDeleteNote(index)}
                    size="small"
                    sx={{ color: 'error.main' }}
                  >
                    <Delete />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={note}
                  secondary={`Added on ${formatDateDDMMYYYY(new Date())}`}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            py={4}
            flexDirection="column"
          >
            <Typography color="text.secondary" variant="body2">
              No notes yet
            </Typography>
            <Typography color="text.secondary" variant="caption">
              Add your first note above
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
