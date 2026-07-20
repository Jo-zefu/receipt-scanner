import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Receipts } from './pages/Receipts';
import { ReceiptDetail } from './pages/ReceiptDetail';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>,
  },
  {
    path: '/upload',
    element: <ProtectedRoute><Layout><Upload /></Layout></ProtectedRoute>,
  },
  {
    path: '/receipts',
    element: <ProtectedRoute><Layout><Receipts /></Layout></ProtectedRoute>,
  },
  {
    path: '/receipt/:id',
    element: <ProtectedRoute><Layout><ReceiptDetail /></Layout></ProtectedRoute>,
  },
]);
