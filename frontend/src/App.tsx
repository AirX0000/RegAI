import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { router } from './routes';
import { Toaster } from './components/ui/toaster';

function App() {
    return (
        <AuthProvider>
            <RouterProvider router={router} />
            <Toaster />
        </AuthProvider>
    );
}

export default App;
