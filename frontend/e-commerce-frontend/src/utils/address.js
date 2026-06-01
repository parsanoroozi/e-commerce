export const COUNTRIES = [
  {
    code: 'US',
    name: 'United States',
    postalPattern: '^\\d{5}(-\\d{4})?$',
    postalHint: 'Use 12345 or 12345-6789.',
    states: [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
      'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
      'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
      'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
      'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
      'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
      'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
    ],
  },
  {
    code: 'CA',
    name: 'Canada',
    postalPattern: '^[A-Za-z]\\d[A-Za-z][ -]?\\d[A-Za-z]\\d$',
    postalHint: 'Use A1A 1A1.',
    states: ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan'],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    postalPattern: '^[A-Za-z]{1,2}\\d[A-Za-z\\d]?\\s?\\d[A-Za-z]{2}$',
    postalHint: 'Use SW1A 1AA.',
    states: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  },
  {
    code: 'IR',
    name: 'Iran',
    postalPattern: '^\\d{10}$',
    postalHint: 'Use a 10 digit postal code.',
    states: ['Tehran', 'Isfahan', 'Fars', 'Khorasan Razavi', 'East Azerbaijan', 'Khuzestan', 'Mazandaran', 'Gilan', 'Alborz', 'Qom'],
  },
];

export function countryByName(name) {
  return COUNTRIES.find((country) => country.name === name) || COUNTRIES[0];
}

export function validatePostalCode(countryName, postalCode) {
  const country = countryByName(countryName);
  if (!postalCode?.trim()) return 'Postal code is required.';
  if (!new RegExp(country.postalPattern).test(postalCode.trim())) return country.postalHint;
  return '';
}

export function formatAddressLine(address) {
  return [address.street, address.city, address.state, address.zipCode, address.country].filter(Boolean).join(', ');
}
