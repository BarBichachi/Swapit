export const cities = [
  "Tel Aviv",
  "Jerusalem",
  "Haifa",
  "Rishon LeZion",
  "Petah Tikva",
  "Ashdod",
  "Netanya",
  "Beersheba",
  "Holon",
  "Bnei Brak",
  "Ramat Gan",
  "Rehovot",
  "Bat Yam",
  "Ashkelon",
  "Herzliya",
  "Kfar Saba",
  "Hadera",
  "Modiin",
  "Ra’anana",
  "Nazareth",
];

export const birthYears = Array.from(
  { length: 2025 - 1920 + 1 },
  (_, i) => 2025 - i
);

export const genders = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];
