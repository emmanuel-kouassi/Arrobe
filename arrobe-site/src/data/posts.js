import imgGimp from "../assets/Logo-gimp.jpg";
import imgcovid from "../assets/Image3.png";
import imgaide from "../assets/Image4.png";
import imgImpr from "../assets/Image5.jpg";


export const CATEGORIES = [
  { id: "all", label: "Tous" },
  { id: "tuto", label: "Tuto" },
  { id: "projets", label: "Projets & Initiatives" },
];

export const POSTS = [
  {
    id: "tuto-gimp",
    title: "TUTO GIMP",
    excerpt:
    "Apprenez à retoucher vos photos et créer des visuels facilement grâce aux bases du logiciel libre GIMP.",
    category: "tuto",
    date: "2024-05-18",
    readingTime: 6,
    views: 36,
    image:imgGimp,
    //image: "https://placehold.co/800x600/f0f2f7/1e2e5e?text=TUTO+GIMP",
  },
  {
    id: "covid-19",
    title: "Arrobe se mobilise contre le COVID 19",
    excerpt:
      "Face à la crise sanitaire, l'équipe d'Arrobe s'est mobilisée avec son imprimante 3D pour fabriquer et distribuer plus de 310 visières aux soignants et commerçants locaux.",
    category: "projets",
    date: "2024-03-02",
    readingTime: 4,
    views: 36,
    image:imgcovid,
    //image: "https://placehold.co/800x600/1e2e5e/ffffff?text=Mobilisation+COVID",
  },
  {
    id: "aide-soignants",
    title: "ARROBE AIDE LES SOIGNANTS",
    excerpt:
      "Fabrication et distribution de visières de protection en impression 3D pour soutenir les hôpitaux et les commerces de proximité pendant la crise.",
    category: "projets",
    date: "2023-11-24",
    readingTime: 3,
    views: 36,
    image:imgaide,
    //image: "https://placehold.co/800x600/1e2e5e/ffffff?text=Aide+aux+soignants",
  },
  {
    id: "imprimante-3d",
    title: "Notre imprimante 3D",
    excerpt:
      "Fabrication et réglage de notre imprimante 3D par l'équipe : une belle aventure collective au service des projets de l'association.",
    category: "projets",
    date: "2023-09-09",
    readingTime: 8,
    views: 36,
    image:imgImpr,
    //image: "https://placehold.co/800x600/1e2e5e/ffffff?text=Imprimante+3D",
  },
];

export const SORT_OPTIONS = [
  { id: "recent", label: "Plus récents" },
  { id: "old", label: "Plus anciens" },
  { id: "reading", label: "Temps de lecture" },
];

/** Tri effectué côté navigateur, sans appel serveur. */
export function sortPosts(posts, sortId) {
  const copy = [...posts];
  if (sortId === "old") {
    return copy.sort((a, b) => a.date.localeCompare(b.date));
  }
  if (sortId === "reading") {
    return copy.sort((a, b) => a.readingTime - b.readingTime);
  }
  return copy.sort((a, b) => b.date.localeCompare(a.date));
}