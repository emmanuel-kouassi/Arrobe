import "./styles/global.css";

import useHashRoute from "./hooks/useHashRoute";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Events from "./pages/Events";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Newsletter from "./components/Newsletter";
import Footer from "./components/Footer";

export default function App() {
  const route = useHashRoute();
  const isLogin = route.startsWith("/connexion");

  const renderPage = () => {
    if (route.startsWith("/evenement")) return <Events />;
    if (route.startsWith("/blog")) return <Blog />;
    if (route.startsWith("/contact")) return <Contact />;
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