import React, { useState } from 'react';
import { 
    Box, Typography, TextField, Button, Grid, Paper, Stack,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Dialog, DialogTitle, DialogContent, DialogActions, Chip 
} from '@mui/material';
import { useCenters } from '../../hooks/useCenters';

export default function CentersManagement() {
    const {
        filteredCenters,
        loading,
        error,
        searchName,
        setSearchName,
        searchProvince,
        setSearchProvince,
        createNewCenter,
        disableCenter
    } = useCenters();

    // Local form handling state for adding a center
    const [form, setForm] = useState({ center_name: '', location_address: '', center_capacity: '', province: '' });
    
    // Deactivation modal state management
    const [selectedId, setSelectedId] = useState(null);
    const [deactivateReason, setDeactivateReason] = useState('');
    const [openDeactivateModal, setOpenDeactivateModal] = useState(false);

    const handleFormChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            await createNewCenter({
                center_name: form.center_name,
                location_address: form.location_address,
                center_capacity: Number(form.center_capacity),
                province: form.province
            });
            setForm({ center_name: '', location_address: '', center_capacity: '', province: '' });
        } catch (err) {
            // Error state handled inside custom hook automatically
        }
    };

    const handleDeactivateClick = (id) => {
        setSelectedId(id);
        setOpenDeactivateModal(true);
    };

    const handleConfirmDeactivate = async () => {
        if (!deactivateReason.trim()) return;
        try {
            await disableCenter(selectedId, deactivateReason);
            setOpenDeactivateModal(false);
            setDeactivateReason('');
            setSelectedId(null);
        } catch (err) {
            // Handled safely by hook
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>Centers Administration Workspace</Typography>
            
            {error && <Typography color="error" sx={{ mb: 2 }}>⚠️ Error: {error}</Typography>}

            <Grid container spacing={3}>
                {/* 1. CREATION PANEL FORM */}
                <Grid item xs={12} md={4}>
                    <Paper component="form" onSubmit={handleCreateSubmit} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 500 }}>Create New Campus</Typography>
                        <TextField size="small" label="Center Name" name="center_name" value={form.center_name} onChange={handleFormChange} required fullWidth />
                        <TextField size="small" label="Physical Address" name="location_address" value={form.location_address} onChange={handleFormChange} required fullWidth />
                        <TextField size="small" label="Max Capacity" type="number" name="center_capacity" value={form.center_capacity} onChange={handleFormChange} required fullWidth />
                        <TextField size="small" label="Province / Region" name="province" value={form.province} onChange={handleFormChange} required fullWidth />
                        <Button type="submit" variant="contained" color="primary" disabled={loading} fullWidth>
                            {loading ? 'Processing...' : 'Register Center'}
                        </Button>
                    </Paper>
                </Grid>

                {/* 2. REALTIME SEARCH & SEARCH DATA TABLE */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 500 }}>Operational Campuses</Typography>
                        
                        {/* Interactive Instant Filter Search Bars */}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField size="small" label="Search by Center Name" value={searchName} onChange={(e) => setSearchName(e.target.value)} fullWidth />
                            <TextField size="small" label="Filter by Province" value={searchProvince} onChange={(e) => setSearchProvince(e.target.value)} fullWidth />
                        </Stack>

                        <TableContainer sx={{ maxHeight: 400 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell><b>Campus Name</b></TableCell>
                                        <TableCell><b>Province</b></TableCell>
                                        <TableCell><b>Capacity</b></TableCell>
                                        <TableCell><b>Status</b></TableCell>
                                        <TableCell align="right"><b>Actions</b></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredCenters.map((center) => (
                                        <TableRow key={center.center_id} hover>
                                            <TableCell>{center.center_name}</TableCell>
                                            <TableCell>{center.center_province}</TableCell>
                                            <TableCell>{center.center_capacity}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    size="small" 
                                                    label={center.is_active ? "Active" : "Inactive"} 
                                                    color={center.is_active ? "success" : "default"} 
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                {center.is_active && (
                                                    <Button size="small" color="error" variant="outlined" onClick={() => handleDeactivateClick(center.center_id)}>
                                                        Deactivate
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>

            {/* 3. SOFT DEACTIVATION CONTEXT POPUP DIALOG */}
            <Dialog open={openDeactivateModal} onClose={() => setOpenDeactivateModal(false)} fullWidth maxWidth="xs">
                <DialogTitle>Deactivate Center Confirmation</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', pt: 1, gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Please provide an explicit justification for making this campus profile inactive.
                    </Typography>
                    <TextField 
                        autoFocus 
                        label="Reason for Deactivation" 
                        multiline 
                        rows={3} 
                        fullWidth 
                        value={deactivateReason} 
                        onChange={(e) => setDeactivateReason(e.target.value)} 
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeactivateModal(false)}>Cancel</Button>
                    <Button onClick={handleConfirmDeactivate} color="error" variant="contained" disabled={!deactivateReason.trim()}>
                        Confirm Deactivate
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}