import React from "react";
import {
    Box,
    Typography,
    List,
    Paper
} from "@mui/material";

import AnnouncementItem from "./AnnouncementItem";

export default function AnnouncementList({
    announcements,
    selectedAnnouncement,
    onSelect,
    search
}) {

    const filteredAnnouncements = announcements.filter((announcement) => {

        const searchText = search.toLowerCase();

        return (
            announcement.title?.toLowerCase().includes(searchText) ||
            announcement.message?.toLowerCase().includes(searchText)
        );

    });

    return (
        <Paper
            elevation={2}
            sx={{
                height: "75vh",
                overflow: "hidden",
                borderRadius: 3,
                display: "flex",
                flexDirection: "column"
            }}
        >
            <Box
                sx={{
                    p: 2,
                    borderBottom: "1px solid",
                    borderColor: "divider"
                }}
            >
                <Typography
                    variant="h6"
                    fontWeight={600}
                >
                    Recent Announcements
                </Typography>

                <Typography
                    variant="body2"
                    color="text.secondary"
                >
                    {filteredAnnouncements.length} announcement(s)
                </Typography>
            </Box>

            <List
                sx={{
                    overflowY: "auto",
                    p: 0,
                    flex: 1
                }}
            >
                {filteredAnnouncements.length === 0 ? (

                    <Box
                        sx={{
                            p: 4,
                            textAlign: "center"
                        }}
                    >
                        <Typography
                            color="text.secondary"
                        >
                            No announcements found.
                        </Typography>
                    </Box>

                ) : (

                    filteredAnnouncements.map((announcement) => (

                        <AnnouncementItem
                            key={announcement.id}
                            announcement={announcement}
                            selected={
                                selectedAnnouncement?.id === announcement.id
                            }
                            onClick={() => onSelect(announcement)}
                        />

                    ))

                )}
            </List>
        </Paper>
    );
}