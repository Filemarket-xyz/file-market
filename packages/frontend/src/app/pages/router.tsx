import { createBrowserRouter, Navigate, RouteObject } from 'react-router-dom'

import { AppLayout } from '../components/App'
import { Params } from '../utils/router/Params'
import CollectionPage from './CollectionPage/CollectionPage'
import { collectionPageRoutes } from './CollectionPage/routes'
import { createRoutes } from './CreatePage/routes'
import ExplorerPage from './ExplorerPage/ExplorerPage'
import GetAccessPage from './GetAccessPage/GetAccessPage'
import FAQPage from './InfoPages/FAQ/FAQ'
import PolicyPage from './InfoPages/Policy/PolicyPage'
import MainPage from './MainPage/MainPage'
import MarketPage from './MarketPage/MarketPage'
import { marketRoutes } from './MarketPage/routes'
import NFTPage from './NFTPage/NFTPage'
import ProfilePage from './ProfilePage/ProfilePage'
import { profileRoutes } from './ProfilePage/routes'

const routes: RouteObject[] = [
  {
    path: '/',
    element: <GetAccessPage />
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        path: 'explorer',
        element: <ExplorerPage />
      },
      {
        path: 'mainpage',
        element: <MainPage />
      },
      {
        path: 'market',
        element: <MarketPage />,
        children: marketRoutes
      },
      {
        path: 'create',
        children: createRoutes
      },
      {
        path: 'policy',
        element: <PolicyPage />
      },
      {
        path: 'FAQ',
        element: <FAQPage />
      },
      {
        path: `profile/:${Params.profileAddress}`,
        element: <ProfilePage />,
        children: profileRoutes
      },
      {
        path: `collection/:${Params.collectionAddress}`,
        element: <CollectionPage />,
        children: collectionPageRoutes
      },
      {
        path: `collection/:${Params.collectionAddress}/:${Params.tokenId}`,
        element: <NFTPage />
      },
      {
        path: '*',
        element: <Navigate to={''} />
      }
    ]
  }
]
export const router = createBrowserRouter(routes)
