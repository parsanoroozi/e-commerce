import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      {children}
      <Footer />
    </div>
  );
}
