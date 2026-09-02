import imgFete from "../assets/Image8.jpg";
import imgPot from "../assets/Image6.png";
import imgPython from "../assets/images(1).jpg";

export const UPCOMING_EVENTS = [
  {
    id: "up-1",
    day: "3",
    month: "Sept",
    year: "2023",
    title: "Lorem ipsum",
    organizer: "Association arrobe",
    place: "saint germain sur morin, France",
    schedule: "3 septembre 2023 - 10:00",
    image: null,
  },
  {
    id: "up-2",
    day: "29",
    month: "Oct",
    year: "2021",
    title: "Lorem ipsum",
    organizer: "Association arrobe",
    place: "saint germain sur morin, France",
    schedule: "29 Octobre 2021 - 14:00",
    image: null,
  },
  {
    id: "up-3",
    day: "29",
    month: "Jan",
    year: "2020",
    title: "Lorem ipsum",
    organizer: "Association arrobe",
    place: "En ligne",
    schedule: "29 Janvier 2020 - 21:00",
    image: null,
  },
];

export const PAST_EVENTS = [
  {
    id: "past-1",
    day: "3",
    month: "Sept",
    year: "2023",
    title: "Fête du village 2023",
    organizer: "Association arrobe",
    place: "saint germain sur morin, France",
    schedule: "3 septembre 2023 - 10:00",
    image:imgFete,
    //image: "https://placehold.co/600x420/1e2e5e/ffffff?text=Fete+du+village",
  },
  {
    id: "past-2",
    day: "29",
    month: "Oct",
    year: "2021",
    title: "Pôt de départ Jean Paul",
    organizer: "Association arrobe",
    place: "saint germain sur morin, France",
    schedule: "29 Octobre 2021 - 14:00",
    image:imgPot,
    //image: "https://placehold.co/600x420/1e2e5e/ffffff?text=Pot+de+depart",
  },
  {
    id: "past-3",
    day: "29",
    month: "Jan",
    year: "2020",
    title: "Formation python",
    organizer: "Association arrobe",
    place: "En ligne",
    schedule: "29 Janvier 2020 - 21:00",
    image:imgPython,
    //image: "https://placehold.co/600x420/1e2e5e/ffffff?text=Formation+Python",
  },
];