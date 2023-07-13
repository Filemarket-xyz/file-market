import { Navigate, RouteObject } from 'react-router-dom'

import CollectionSection from './CollectionSection'
import CreatorSection from './CreatorSection'
import NamespaceSection from './NamespaceSection'
import NftSection from './NftSection'

export const marketRoutes: RouteObject[] = [
  {
    path: '',
    element: <Navigate replace to={'efts'} />,
  },
  {
    path: 'efts',
    element: <NftSection />,
  },
  {
    path: 'collections',
    element: <CollectionSection />,
  },
  {
    path: 'creators',
    element: <CreatorSection />,
  },
  {
    path: 'namespaces',
    element: <NamespaceSection />,
  },
]
