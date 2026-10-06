import { ShopProvider } from './context/ShopContext';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import './App.css';

function App() {
  return (
    <BrowserRouter><AuthProvider><ShopProvider><AppRoutes /></ShopProvider></AuthProvider></BrowserRouter>
  );
}

export default App;
