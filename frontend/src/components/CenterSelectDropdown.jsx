import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';

export default function CenterSelectDropdown({ 
    centers = [], 
    selectedCenterId, 
    onCenterChange, 
    label = "Select Learning Center",
    error = false,
    helperText = ""
}) {
    return (
        <FormControl fullWidth size="small" error={error}>
            <InputLabel id="center-select-label">{label}</InputLabel>
            <Select
                labelId="center-select-label"
                id="center-select"
                value={selectedCenterId || ''}
                label={label}
                onChange={(e) => onCenterChange(e.target.value)}
            >
                {centers.length === 0 ? (
                    <MenuItem value="" disabled>No active centers found</MenuItem>
                ) : (
                    centers.map((center) => (
                        <MenuItem key={center.center_id} value={center.center_id}>
                            {center.center_name} ({center.center_province})
                        </MenuItem>
                    ))
                )}
            </Select>
            {helperText && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
    );
}