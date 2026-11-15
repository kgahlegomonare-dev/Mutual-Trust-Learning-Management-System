export const termFromDate = (dateExpression) => {
  const monthDay = `(
    EXTRACT(MONTH FROM ${dateExpression})::int * 100
    + EXTRACT(DAY FROM ${dateExpression})::int
  )`;

  return `(CASE
    WHEN ${monthDay} BETWEEN 201 AND 415 THEN 1
    WHEN ${monthDay} BETWEEN 416 AND 630 THEN 2
    WHEN ${monthDay} BETWEEN 701 AND 915 THEN 3
    WHEN ${monthDay} BETWEEN 916 AND 1215 THEN 4
    ELSE NULL
  END)`;
};

export const assessmentTerm = (alias = "a") =>
  termFromDate(`${alias}.created_at`);

export const getTermForDate = (
  date = new Date(),
  timeZone = "Africa/Johannesburg"
) => {
  const parsedDate =
    date instanceof Date
      ? date
      : new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const dateParts = new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone,
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(parsedDate);

  const month = Number(
    dateParts.find(
      (part) => part.type === "month"
    )?.value
  );

  const day = Number(
    dateParts.find(
      (part) => part.type === "day"
    )?.value
  );

  const monthDay = month * 100 + day;

  if (monthDay >= 201 && monthDay <= 415) {
    return 1;
  }

  if (monthDay >= 416 && monthDay <= 630) {
    return 2;
  }

  if (monthDay >= 701 && monthDay <= 915) {
    return 3;
  }

  if (monthDay >= 916 && monthDay <= 1215) {
    return 4;
  }

  return null;
};

export const getCurrentTerm = () =>
  getTermForDate(new Date());