const validateSAID = (idNumber) => {
  if (!idNumber || idNumber.length !== 13 || !/^\d{13}$/.test(idNumber)) {
    return { valid: false, message: 'ID number must be exactly 13 digits.' };
  }

  // Extract date of birth
  const year  = idNumber.substring(0, 2);
  const month = idNumber.substring(2, 4);
  const day   = idNumber.substring(4, 6);

  const fullYear = parseInt(year) <= 24 ? `20${year}` : `19${year}`;
  const dob = new Date(`${fullYear}-${month}-${day}`);

  if (isNaN(dob.getTime())) {
    return { valid: false, message: 'ID number contains an invalid date of birth.' };
  }

  // Extract gender (digits 7-10: 0000-4999 = female, 5000-9999 = male)
  const genderCode = parseInt(idNumber.substring(6, 10));
  const gender = genderCode >= 5000 ? 'male' : 'female';

  // Extract citizenship (digit 11: 0 = SA citizen, 1 = permanent resident)
  const citizenDigit = idNumber[10];
  const citizenship = citizenDigit === '0' ? 'SA Citizen' : 'Permanent Resident';

  // Luhn algorithm checksum (digit 13)
  let total = 0;
  for (let i = 0; i < 12; i++) {
    let digit = parseInt(idNumber[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    total += digit;
  }
  const checkDigit = (10 - (total % 10)) % 10;

  if (checkDigit !== parseInt(idNumber[12])) {
    return { valid: false, message: 'ID number failed checksum validation.' };
  }

  return {
    valid: true,
    data: {
      dateOfBirth: dob.toISOString().split('T')[0],
      gender,
      citizenship,
    }
  };
};

module.exports = validateSAID;