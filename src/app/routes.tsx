import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Receipts } from './pages/Receipts';
import { ReceiptDetail } from './pages/ReceiptDetail';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout><Dashboard /></Layout>,
  },
  {
    path: '/upload',
    element: <Layout><Upload /></Layout>,
  },
  {
    path: '/receipts',
    element: <Layout><Receipts /></Layout>,
  },
  {
    path: '/receipt/:id',
    element: <Layout><ReceiptDetail /></Layout>,
  },
]);
