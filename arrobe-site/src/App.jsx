import "./styles/global.css";

import useHashRoute from "./hooks/useHashRoute";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Events from "./pages/Events";
import Blog from "./pages/Blog";
import ArticleDetail from "./pages/ArticleDetail";
import EventDetail from "./pages/EventDetail";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Newsletter from "./components/Newsletter";
import Footer from "./components/Footer";

export default function App() {
  const route = useHashRoute();
  const isLogin = route.startsWith("/connexion");

  const renderPage = () => {
    // Un slug après la section ouvre la page de détail :
    //   #/blog            -> liste
    //   #/blog/mon-article -> détail
    const [, section, slug] = route.split("/");

    if (section === "evenement") return slug ? <EventDetail slug={slug} /> : <Events />;
    if (section === "blog") return slug ? <ArticleDetail slug={slug} /> : <Blog />;
    if (section === "contact") return <Contact />;
    if (isLogin) return <Login />;
    return <Home />;
  };

  return (
    <>
      <Navbar route={route} />
      {renderPage()}

      {/* Sur la page de connexion, on masque la newsletter et le pied de page
          pour garder l'écran concentré sur le formulaire. */}
      {!isLogin && (
        <>
          <Newsletter />
          <Footer />
        </>
      )}
    </>
  );
}