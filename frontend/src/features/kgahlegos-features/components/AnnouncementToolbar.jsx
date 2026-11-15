import React from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    InputAdornment
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import CampaignIcon from "@mui/icons-material/Campaign";

export default function AnnouncementToolbar({
    search,
    setSearch,
    canPublish,
    onCreate
}) {
    return (
        <Box
            sx={{
                mb: 3,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2
            }}
        >
            <Box>
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 700
                    }}
                >
                    Announcements
                </Typography>

                <Typography
                    color="text.secondary"
                >
                    View and manage announcements across the platform.
                </Typography>
            </Box>

            <Box
                sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: "center"
                }}
            >
                <TextField
                    size="small"
                    placeholder="Search announcements..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{
                        width: 300
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        )
                    }}
                />

                {canPublish && (
                    <Button
                        variant="contained"
                        startIcon={<CampaignIcon />}
                        onClick={onCreate}
                        sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            px: 3
                        }}
                    >
                        Broadcast
                    </Button>
                )}
            </Box>
        </Box>
    );
}