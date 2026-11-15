import React from "react";
import {
    ListItemButton,
    ListItemText,
    Typography,
    Chip,
    Box
} from "@mui/material";

import CampaignIcon from "@mui/icons-material/Campaign";

export default function AnnouncementItem({
    announcement,
    selected,
    onClick
}) {

    const createdDate = announcement.created_at
        ? new Date(announcement.created_at).toLocaleDateString()
        : "";

    return (
        <ListItemButton
            selected={selected}
            onClick={onClick}
            sx={{
                alignItems: "flex-start",
                py: 2,
                px: 2,
                borderBottom: "1px solid",
                borderColor: "divider",

                "&.Mui-selected": {
                    backgroundColor: "#E3F2FD"
                },

                "&:hover": {
                    backgroundColor: "#F5F5F5"
                }
            }}
        >
            <Box sx={{ mr: 2, mt: 0.5 }}>
                <CampaignIcon color="primary" />
            </Box>

            <ListItemText

                primary={
                    <Typography
                        fontWeight={600}
                        noWrap
                    >
                        {announcement.title}
                    </Typography>
                }

                secondary={
                    <>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            sx={{ mb: 1 }}
                        >
                            {announcement.message}
                        </Typography>

                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}
                        >
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                {createdDate}
                            </Typography>

                            {announcement.isRead === false && (
                                <Chip
                                    label="NEW"
                                    color="primary"
                                    size="small"
                                />
                            )}
                        </Box>
                    </>
                }
            />
        </ListItemButton>
    );
}