export function convertToCSV(
    data,
    columns
) {

    if (!data || data.length === 0) {
        return "";
    }


    // Headers
    const headers =
        columns
            .map(column => escapeCSV(column.header))
            .join(",");

    // Rows
    const rows =
        data.map(row => {

            return columns
                .map(column => {

                    return escapeCSV(
                        row[column.key]
                    );

                })
                .join(",");

        });


    return [
        headers,
        ...rows
    ].join("\n");

}

function escapeCSV(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    const stringValue =
        String(value);


    if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
    ) {

        return `"${stringValue.replace(
            /"/g,
            '""'
        )}"`;

    }


    return stringValue;

}