import "./styles/global.css";

import { Suspense, lazy } from "react";

import useHashRoute from "./hooks/useHashRoute";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Events from "./pages/Events";
import Blog from "./pages/Blog";
import ArticleDetail from "./pages/ArticleDetail";
import EventDetail from "./pages/EventDetail";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
/**
 * L'administration est chargée à la demande : un visiteur venu lire
 * un article n'a aucune raison de télécharger le back-office.
 */
const Admin = lazy(() => import("./pages/Admin"));

import Newsletter from "./components/Newsletter";
import Footer from "./components/Footer";

export default function App() {
  const route = useHashRoute();
  const isLogin = route.startsWith("/connexion");
  // L'administration a sa propre mise en page : ni navigation
  // publique, ni newsletter, ni pied de page.
  const isAdmin = route.startsWith("/administration");

  const renderPage = () => {
    // Un slug après la section ouvre la page de détail :
    //   #/blog            -> liste
    //   #/blog/mon-article -> détail
    const [, section, slug] = route.split("/");

    if (section === "evenement") return slug ? <EventDetail slug={slug} /> : <Events />;
    if (section === "blog") return slug ? <ArticleDetail slug={slug} /> : <Blog />;
    if (section === "contact") return <Contact />;
    if (isAdmin) {
      return (
        <Suspense fallback={<p className="adm__empty">Chargement de l'administration…</p>}>
          <Admin route={route} />
        </Suspense>
      );
    }
    if (isLogin) return <Login />;
    return <Home />;
  };

  return (
    <>
      {!isAdmin && <Navbar route={route} />}
      {renderPage()}

      {/* Sur la page de connexion, on masque la newsletter et le pied de page
          pour garder l'écran concentré sur le formulaire. */}
      {!isLogin && !isAdmin && (
        <>
          <Newsletter />
          <Footer />
        </>
      )}
    </>
  );
}