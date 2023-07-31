import { useActivateDeactivateRequireParams } from './useActivateDeactivateStore'
import { useStores } from './useStores'

/**
 * Component, using this hook, MUST be wrapped into observer.
 * Supports repeated usage in nested components.
 * Returns store containing collection details
 * @param collectionAddress
 */
export function useCollectionStore(collectionAddress?: string, chainName?: string) {
  const { collectionStore } = useStores()
  useActivateDeactivateRequireParams(collectionStore, collectionAddress, chainName)

  return collectionStore
}
